import { getBYOKModelsURL } from './config'
import {
  buildBYOKChunkAnalysisMessages,
  buildBYOKCommitAggregationMessages,
  buildBYOKCommitGenerationMessages,
  chunkDiffForCommitGeneration,
  MAX_CHUNKS,
  MAX_SINGLE_REQUEST_DIFF_CHARS,
  BYOKCommitGenerationMessage,
} from './prompt'
import {
  BYOKCommitChunkAnalysisResult,
  BYOKCommitGenerationConfig,
  BYOKCommitGenerationInput,
  BYOKCommitGenerationResult,
  StoredBYOKCommitGenerationModel,
} from './types'

const MaxSummaryLength = 100

interface IOpenAICompatibleResponse {
  readonly choices?: ReadonlyArray<{
    readonly message?: {
      readonly content?: unknown
    }
  }>
}

interface IOpenAICompatibleModelsResponse {
  readonly data?: ReadonlyArray<{
    readonly id?: unknown
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

function stripMarkdownJSONFence(content: string): string {
  const match = content.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i)
  return match ? match[1].trim() : content
}

function parseJSONRecord(content: string): Record<string, unknown> | null {
  let parsed: unknown
  const jsonContent = stripMarkdownJSONFence(content.trim())

  try {
    parsed = JSON.parse(jsonContent)
  } catch {
    return null
  }

  return typeof parsed === 'object' && parsed !== null
    ? (parsed as Record<string, unknown>)
    : null
}

function parseJSONContent(content: string): BYOKCommitGenerationResult | null {
  const record = parseJSONRecord(content)
  if (record === null) {
    return null
  }

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

function stringArray(value: unknown): ReadonlyArray<string> {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function parseChunkAnalysisContent(
  content: string
): BYOKCommitChunkAnalysisResult {
  const record = parseJSONRecord(content)
  if (record === null) {
    const fallback = parseFallbackContent(content)
    return {
      summary: fallback.summary,
      description: fallback.description,
      files: [],
      keyChanges: fallback.description ? [fallback.description] : [],
      commitTypeHints: [],
    }
  }

  const summary =
    typeof record.summary === 'string' ? record.summary.trim() : 'Chunk changes'
  const description =
    typeof record.description === 'string' ? record.description.trim() : ''

  return {
    summary: summary || 'Chunk changes',
    description,
    files: stringArray(record.files),
    keyChanges: stringArray(record.keyChanges),
    commitTypeHints: stringArray(record.commitTypeHints),
  }
}

async function sendChatCompletionRequest(
  config: BYOKCommitGenerationConfig,
  messages: ReadonlyArray<BYOKCommitGenerationMessage>
): Promise<string> {
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
      messages,
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

  return content
}

async function generateSingleShotCommitMessage(
  config: BYOKCommitGenerationConfig,
  input: BYOKCommitGenerationInput
): Promise<BYOKCommitGenerationResult> {
  const content = await sendChatCompletionRequest(
    config,
    buildBYOKCommitGenerationMessages(input)
  )
  return parseBYOKCommitGenerationContent(content)
}

async function analyzeChunk(
  config: BYOKCommitGenerationConfig,
  input: BYOKCommitGenerationInput,
  chunk: string,
  chunkIndex: number,
  chunkCount: number
): Promise<BYOKCommitChunkAnalysisResult> {
  const content = await sendChatCompletionRequest(
    config,
    buildBYOKChunkAnalysisMessages(input, chunk, chunkIndex, chunkCount)
  )
  return parseChunkAnalysisContent(content)
}

async function generateChunkedCommitMessage(
  config: BYOKCommitGenerationConfig,
  input: BYOKCommitGenerationInput
): Promise<BYOKCommitGenerationResult> {
  const chunks = chunkDiffForCommitGeneration(input.diff)
  if (chunks.length > MAX_CHUNKS) {
    throw new Error(
      `Selected diff is too large to generate safely (${chunks.length} chunks).`
    )
  }

  const analyses: BYOKCommitChunkAnalysisResult[] = []
  for (let index = 0; index < chunks.length; index++) {
    analyses.push(
      await analyzeChunk(config, input, chunks[index], index, chunks.length)
    )
  }

  const content = await sendChatCompletionRequest(
    config,
    buildBYOKCommitAggregationMessages(input, analyses)
  )
  return parseBYOKCommitGenerationContent(content)
}

export async function generateCommitMessageWithOpenAICompatible(
  config: BYOKCommitGenerationConfig,
  input: BYOKCommitGenerationInput
): Promise<BYOKCommitGenerationResult> {
  const enrichedInput = {
    ...input,
    style: input.style ?? config.style,
    language: input.language ?? config.language,
    customInstructions: input.customInstructions ?? config.customInstructions,
  }

  return input.diff.length <= MAX_SINGLE_REQUEST_DIFF_CHARS
    ? generateSingleShotCommitMessage(config, enrichedInput)
    : generateChunkedCommitMessage(config, enrichedInput)
}

export async function fetchOpenAICompatibleModels(
  baseURL: string,
  apiKey: string
): Promise<ReadonlyArray<StoredBYOKCommitGenerationModel>> {
  const headers: Record<string, string> = {}
  if (apiKey.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`
  }

  const response = await fetch(getBYOKModelsURL(baseURL), { headers })
  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(
      `Fetching models failed with HTTP ${response.status}: ${responseText}`
    )
  }

  let json: IOpenAICompatibleModelsResponse
  try {
    json = JSON.parse(responseText) as IOpenAICompatibleModelsResponse
  } catch {
    throw new Error('Fetching models returned invalid JSON')
  }

  const ids = (json.data ?? [])
    .map(model => model.id)
    .filter((id): id is string => typeof id === 'string' && id.trim() !== '')

  return Array.from(new Set(ids)).map(id => ({ id, name: id }))
}
