import assert from 'node:assert'
import { afterEach, describe, it } from 'node:test'
import { getBYOKCommitGenerationConfigFromEnv } from '../../src/lib/byok/config'
import {
  buildBYOKCommitGenerationMessages,
  MAX_DIFF_CHARS,
  truncateDiffForPrompt,
} from '../../src/lib/byok/prompt'
import {
  generateCommitMessageWithOpenAICompatible,
  parseBYOKCommitGenerationContent,
} from '../../src/lib/byok/open-ai-compatible'
import { BYOKCommitGenerationConfig } from '../../src/lib/byok/types'

const config: BYOKCommitGenerationConfig = {
  baseURL: 'https://example.com/v1/chat/completions',
  apiKey: 'secret',
  model: 'gpt-test',
  temperature: 0.2,
  style: 'conventional',
  language: 'English',
}

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
})

describe('getBYOKCommitGenerationConfigFromEnv', () => {
  it('returns null when required values are missing', () => {
    assert.equal(getBYOKCommitGenerationConfigFromEnv({}), null)
    assert.equal(
      getBYOKCommitGenerationConfigFromEnv({
        DESKTOP_BYOK_BASE_URL: 'https://example.com',
      }),
      null
    )
  })

  it('parses required values and defaults', () => {
    assert.deepStrictEqual(
      getBYOKCommitGenerationConfigFromEnv({
        DESKTOP_BYOK_BASE_URL: ' https://example.com/v1/chat/completions ',
        DESKTOP_BYOK_MODEL: ' gpt-test ',
      }),
      {
        baseURL: 'https://example.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-test',
        temperature: 0.2,
        style: 'conventional',
        language: 'English',
        customInstructions: undefined,
      }
    )
  })

  it('normalizes OpenAI-compatible base URLs to chat completions endpoints', () => {
    assert.equal(
      getBYOKCommitGenerationConfigFromEnv({
        DESKTOP_BYOK_BASE_URL: 'http://localhost:8317/v1',
        DESKTOP_BYOK_MODEL: 'model',
      })?.baseURL,
      'http://localhost:8317/v1/chat/completions'
    )

    assert.equal(
      getBYOKCommitGenerationConfigFromEnv({
        DESKTOP_BYOK_BASE_URL: 'http://localhost:8317/v1/chat/completions',
        DESKTOP_BYOK_MODEL: 'model',
      })?.baseURL,
      'http://localhost:8317/v1/chat/completions'
    )
  })

  it('parses optional values', () => {
    assert.deepStrictEqual(
      getBYOKCommitGenerationConfigFromEnv({
        DESKTOP_BYOK_BASE_URL: 'https://example.com',
        DESKTOP_BYOK_API_KEY: ' key ',
        DESKTOP_BYOK_MODEL: 'model',
        DESKTOP_BYOK_TEMPERATURE: '0.7',
        DESKTOP_BYOK_STYLE: 'simple',
        DESKTOP_BYOK_LANGUAGE: 'French',
        DESKTOP_BYOK_CUSTOM_INSTRUCTIONS: 'Be short',
      }),
      {
        baseURL: 'https://example.com/chat/completions',
        apiKey: 'key',
        model: 'model',
        temperature: 0.7,
        style: 'simple',
        language: 'French',
        customInstructions: 'Be short',
      }
    )
  })

  it('falls back for invalid temperature and style', () => {
    const parsed = getBYOKCommitGenerationConfigFromEnv({
      DESKTOP_BYOK_BASE_URL: 'https://example.com',
      DESKTOP_BYOK_MODEL: 'model',
      DESKTOP_BYOK_TEMPERATURE: 'not-a-number',
      DESKTOP_BYOK_STYLE: 'verbose',
    })

    assert.equal(parsed?.temperature, 0.2)
    assert.equal(parsed?.style, 'conventional')
  })
})

describe('buildBYOKCommitGenerationMessages', () => {
  it('builds conventional commit instructions', () => {
    const messages = buildBYOKCommitGenerationMessages({
      diff: 'diff --git a/a b/a',
      repositoryName: 'repo',
      branchName: 'main',
      style: 'conventional',
      language: 'English',
    })

    assert.equal(messages[0].role, 'system')
    assert.match(messages[0].content, /Return only valid JSON/)
    assert.match(messages[1].content, /Repository: repo/)
    assert.match(messages[1].content, /Branch: main/)
    assert.match(messages[1].content, /Use conventional commit style/)
    assert.match(messages[1].content, /feat\/fix\/chore/)
  })

  it('builds simple style and includes custom instructions', () => {
    const messages = buildBYOKCommitGenerationMessages({
      diff: 'diff --git a/a b/a',
      style: 'simple',
      language: 'French',
      customInstructions: 'No bullet list',
    })

    assert.match(messages[1].content, /Language: French/)
    assert.match(messages[1].content, /Use a simple commit message style/)
    assert.match(messages[1].content, /No bullet list/)
    assert.doesNotMatch(messages[1].content, /Use conventional commit style/)
  })

  it('truncates long diffs with a warning', () => {
    const diff = 'a'.repeat(MAX_DIFF_CHARS + 1)
    const truncated = truncateDiffForPrompt(diff)

    assert.ok(truncated.length > MAX_DIFF_CHARS)
    assert.match(truncated, /has been truncated/)
  })
})

describe('parseBYOKCommitGenerationContent', () => {
  it('parses JSON content', () => {
    assert.deepStrictEqual(
      parseBYOKCommitGenerationContent(
        JSON.stringify({ summary: 'feat: add thing', description: 'Details' })
      ),
      { summary: 'feat: add thing', description: 'Details' }
    )
  })

  it('parses fenced JSON content from providers that ignore formatting instructions', () => {
    assert.deepStrictEqual(
      parseBYOKCommitGenerationContent(
        '```json\n{"summary":"feat: add byok","description":"Details"}\n```'
      ),
      { summary: 'feat: add byok', description: 'Details' }
    )
  })

  it('falls back to first non-empty line as summary', () => {
    assert.deepStrictEqual(
      parseBYOKCommitGenerationContent('\nSummary line\nDetail one\nDetail two'),
      { summary: 'Summary line', description: 'Detail one\nDetail two' }
    )
  })

  it('rejects empty summaries', () => {
    assert.throws(
      () => parseBYOKCommitGenerationContent('{"summary":"","description":""}'),
      /commit summary/
    )
  })

  it('truncates very long summaries', () => {
    const result = parseBYOKCommitGenerationContent('a'.repeat(120))
    assert.equal(result.summary.length, 100)
  })
})

describe('generateCommitMessageWithOpenAICompatible', () => {
  it('sends a chat completions request and parses the response', async () => {
    const captured: Array<{ readonly url: string; readonly init: RequestInit }> =
      []
    global.fetch = (async (url: string, init: RequestInit) => {
      captured.push({ url, init })
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: 'feat: add byok',
                  description: 'Adds generation.',
                }),
              },
            },
          ],
        }),
        { status: 200 }
      )
    }) as typeof fetch

    const result = await generateCommitMessageWithOpenAICompatible(config, {
      diff: 'diff --git a/a b/a',
    })

    assert.deepStrictEqual(result, {
      summary: 'feat: add byok',
      description: 'Adds generation.',
    })
    assert.equal(captured.length, 1)
    const request = captured[0]
    assert.notEqual(request, undefined)
    assert.equal(request.url, config.baseURL)
    assert.equal(
      (request.init.headers as Record<string, string>).Authorization,
      'Bearer secret'
    )
    assert.equal(JSON.parse(request.init.body as string).model, config.model)
  })

  it('omits authorization for empty API keys', async () => {
    let headers: Record<string, string> = {}
    global.fetch = (async (_url: string, init: RequestInit) => {
      headers = init.headers as Record<string, string>
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'summary' } }],
        }),
        { status: 200 }
      )
    }) as typeof fetch

    await generateCommitMessageWithOpenAICompatible(
      { ...config, apiKey: '' },
      { diff: 'diff' }
    )

    assert.equal(headers.Authorization, undefined)
  })

  it('throws useful errors for HTTP failures', async () => {
    global.fetch = (async () =>
      new Response('bad request', { status: 400 })) as typeof fetch

    await assert.rejects(
      generateCommitMessageWithOpenAICompatible(config, { diff: 'diff' }),
      /HTTP 400: bad request/
    )
  })
})
