import { buildBYOKCommitGenerationMessages } from './prompt'
import {
  BYOKCommitGenerationConfig,
  BYOKCommitGenerationInput,
  BYOKCommitGenerationResult,
} from './types'

const MaxSummaryLength = 100

interface IOpenAICompatibleResponse {
  readonly choices?: ReadonlyArray<{
    readonly message?: {
      readonly content?: unknown
    }
  }>
}

function truncateSummary(summary: string): string {
  if (summary.length <= MaxSummaryLength) {
    return summary
  }

  return summary.slice(0, MaxSummaryLength).trimEnd()
}

function validateResult(
  result: BYOKCommitGenerationResult
): BYOKCommitGenerationResult {
  const summary = truncateSummary(result.summary.trim())
  const description = result.description.trim()

  if (!summary) {
    throw new Error('BYOK response did not include a commit summary')
  }

  return { summary, description }
}

function parseJSONContent(content: string): BYOKCommitGenerationResult | null {
  let parsed: unknown
  const jsonContent = stripMarkdownJSONFence(content.trim())

  try {
    parsed = JSON.parse(jsonContent)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }

  const record = parsed as Record<string, unknown>
  if (
    typeof record.summary !== 'string' ||
    typeof record.description !== 'string'
  ) {
    return null
  }

  return validateResult({
    summary: record.summary,
    description: record.description,
  })
}

function stripMarkdownJSONFence(content: string): string {
  const match = content.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i)
  return match ? match[1].trim() : content
}

function parseFallbackContent(content: string): BYOKCommitGenerationResult {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)

  return validateResult({
    summary: lines[0] ?? '',
    description: lines.slice(1).join('\n'),
  })
}

export function parseBYOKCommitGenerationContent(
  content: string
): BYOKCommitGenerationResult {
  return parseJSONContent(content) ?? parseFallbackContent(content)
}

export async function generateCommitMessageWithOpenAICompatible(
  config: BYOKCommitGenerationConfig,
  input: BYOKCommitGenerationInput
): Promise<BYOKCommitGenerationResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (config.apiKey.trim()) {
    headers.Authorization = `Bearer ${config.apiKey.trim()}`
  }

  const response = await fetch(config.baseURL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      messages: buildBYOKCommitGenerationMessages({
        ...input,
        style: input.style ?? config.style,
        language: input.language ?? config.language,
        customInstructions:
          input.customInstructions ?? config.customInstructions,
      }),
    }),
  })

  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(
      `BYOK commit generation failed with HTTP ${response.status}: ${responseText}`
    )
  }

  let json: IOpenAICompatibleResponse
  try {
    json = JSON.parse(responseText) as IOpenAICompatibleResponse
  } catch {
    throw new Error('BYOK commit generation returned invalid JSON')
  }

  const content = json.choices?.[0]?.message?.content
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('BYOK commit generation returned an empty response')
  }

  return parseBYOKCommitGenerationContent(content)
}
