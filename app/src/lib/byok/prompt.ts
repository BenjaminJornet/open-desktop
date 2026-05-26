import {
  BYOKCommitChunkAnalysisResult,
  BYOKCommitGenerationInput,
  BYOKCommitStyle,
} from './types'

export const MAX_SINGLE_REQUEST_DIFF_CHARS = 180000
export const MAX_CHUNK_CHARS = 120000
export const MAX_CHUNKS = 50

export type BYOKCommitGenerationMessage = {
  readonly role: 'system' | 'user'
  readonly content: string
}

function getStyleInstruction(style: BYOKCommitStyle): string {
  if (style === 'simple') {
    return [
      'Use a simple commit message style.',
      'Summary must be <= 72 chars if possible.',
      'Use imperative mood.',
      'Description can be empty or a short bullet list if useful.',
    ].join('\n')
  }

  return [
    'Use conventional commit style.',
    'Use feat/fix/chore/refactor/docs/test/build/ci/perf when appropriate.',
    'Summary must be <= 72 chars if possible.',
    'Use imperative mood.',
    'Description can be empty or a short bullet list if useful.',
  ].join('\n')
}

function buildContextParts(input: BYOKCommitGenerationInput): ReadonlyArray<string> {
  const style = input.style ?? 'conventional'
  const language = input.language?.trim() || 'English'
  const repositoryName = input.repositoryName?.trim() || 'Unknown repository'
  const branchName = input.branchName?.trim() || 'Unknown branch'
  const customInstructions = input.customInstructions?.trim()

  const parts = [
    `Repository: ${repositoryName}`,
    `Branch: ${branchName}`,
    `Language: ${language}`,
    '',
    'Style instructions:',
    getStyleInstruction(style),
  ]

  if (customInstructions) {
    parts.push('', 'Custom instructions:', customInstructions)
  }

  return parts
}

export function buildBYOKCommitGenerationMessages(
  input: BYOKCommitGenerationInput
): ReadonlyArray<BYOKCommitGenerationMessage> {
  const userParts = [...buildContextParts(input)]
  userParts.push('', 'Selected diff:', '```diff', input.diff, '```')

  return [
    {
      role: 'system',
      content: [
        'You are an expert software engineer writing Git commit messages.',
        'Return only valid JSON with exactly two string fields: summary and description.',
        'Do not include markdown fences.',
        'Do not invent changes not present in the diff.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: userParts.join('\n'),
    },
  ]
}

export function buildBYOKChunkAnalysisMessages(
  input: BYOKCommitGenerationInput,
  chunk: string,
  chunkIndex: number,
  chunkCount: number
): ReadonlyArray<BYOKCommitGenerationMessage> {
  const userParts = [...buildContextParts(input)]
  userParts.push(
    '',
    `Diff chunk: ${chunkIndex + 1} of ${chunkCount}`,
    'Analyze this chunk only. Do not write the final commit message.',
    'Return concise facts that will let another pass synthesize the final commit message.',
    '',
    'Diff chunk:',
    '```diff',
    chunk,
    '```'
  )

  return [
    {
      role: 'system',
      content: [
        'You are an expert software engineer analyzing a portion of a Git diff.',
        'Return only valid JSON with exactly these fields:',
        'summary: string, description: string, files: string[], keyChanges: string[], commitTypeHints: string[].',
        'Do not include markdown fences.',
        'Do not invent changes not present in this diff chunk.',
      ].join('\n'),
    },
    { role: 'user', content: userParts.join('\n') },
  ]
}

export function buildBYOKCommitAggregationMessages(
  input: BYOKCommitGenerationInput,
  analyses: ReadonlyArray<BYOKCommitChunkAnalysisResult>
): ReadonlyArray<BYOKCommitGenerationMessage> {
  const userParts = [...buildContextParts(input)]
  userParts.push(
    '',
    'Chunk analyses:',
    JSON.stringify(analyses, null, 2),
    '',
    'Write one final commit message that covers all chunk analyses.',
    'Do not mention chunks, partial analysis, truncation, or internal processing.'
  )

  return [
    {
      role: 'system',
      content: [
        'You are an expert software engineer writing Git commit messages.',
        'Return only valid JSON with exactly two string fields: summary and description.',
        'Do not include markdown fences.',
        'Synthesize every provided chunk analysis into one coherent commit message.',
      ].join('\n'),
    },
    { role: 'user', content: userParts.join('\n') },
  ]
}

export function splitDiffIntoFileSections(diff: string): ReadonlyArray<string> {
  const matches = Array.from(diff.matchAll(/^diff --git .*$/gm))
  if (matches.length === 0) {
    return diff.length === 0 ? [] : [diff]
  }

  return matches.map((match, index) => {
    const start = match.index ?? 0
    const end = matches[index + 1]?.index ?? diff.length
    return diff.slice(start, end).trimEnd()
  })
}

function splitOversizedText(text: string, maxChars: number): ReadonlyArray<string> {
  const chunks = []
  for (let index = 0; index < text.length; index += maxChars) {
    chunks.push(text.slice(index, index + maxChars))
  }
  return chunks
}

function splitOversizedFileSection(
  section: string,
  maxChars: number
): ReadonlyArray<string> {
  if (section.length <= maxChars) {
    return [section]
  }

  const firstHunkIndex = section.search(/^@@ .* @@/m)
  if (firstHunkIndex === -1) {
    return splitOversizedText(section, maxChars)
  }

  const header = section.slice(0, firstHunkIndex).trimEnd()
  const hunksText = section.slice(firstHunkIndex)
  const hunkMatches = Array.from(hunksText.matchAll(/^@@ .* @@/gm))
  const hunks = hunkMatches.map((match, index) => {
    const start = match.index ?? 0
    const end = hunkMatches[index + 1]?.index ?? hunksText.length
    return hunksText.slice(start, end).trimEnd()
  })

  const chunks: string[] = []
  let current = header

  for (const hunk of hunks) {
    const next = `${current}\n${hunk}`
    if (next.length <= maxChars) {
      current = next
      continue
    }

    if (current !== header) {
      chunks.push(current)
      current = header
    }

    const single = `${header}\n${hunk}`
    if (single.length <= maxChars) {
      current = single
    } else {
      chunks.push(...splitOversizedText(single, maxChars))
      current = header
    }
  }

  if (current !== header) {
    chunks.push(current)
  }

  return chunks.length > 0 ? chunks : splitOversizedText(section, maxChars)
}

export function chunkDiffForCommitGeneration(
  diff: string,
  maxChunkChars = MAX_CHUNK_CHARS
): ReadonlyArray<string> {
  const sections = splitDiffIntoFileSections(diff)
  const chunks: string[] = []
  let current = ''

  for (const section of sections) {
    if (section.length > maxChunkChars) {
      if (current !== '') {
        chunks.push(current)
        current = ''
      }
      chunks.push(...splitOversizedFileSection(section, maxChunkChars))
      continue
    }

    const next = current === '' ? section : `${current}\n\n${section}`
    if (next.length <= maxChunkChars) {
      current = next
      continue
    }

    if (current !== '') {
      chunks.push(current)
    }
    current = section
  }

  if (current !== '') {
    chunks.push(current)
  }

  return chunks
}

/** Backward-compatible alias for older callers/tests. No truncation is applied. */
export function truncateDiffForPrompt(diff: string): string {
  return diff
}

/** Backward-compatible value for older callers/tests. Prefer the new constants. */
export const MAX_DIFF_CHARS = MAX_SINGLE_REQUEST_DIFF_CHARS
