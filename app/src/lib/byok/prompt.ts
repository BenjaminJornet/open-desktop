import { BYOKCommitGenerationInput, BYOKCommitStyle } from './types'

export const MAX_DIFF_CHARS = 60000

const TruncationWarning = `The selected diff was longer than ${MAX_DIFF_CHARS} characters and has been truncated. Summarize only the visible selected diff and mention in the description that the diff was truncated.`

export type BYOKCommitGenerationMessage = {
  readonly role: 'system' | 'user'
  readonly content: string
}

export function truncateDiffForPrompt(diff: string): string {
  if (diff.length <= MAX_DIFF_CHARS) {
    return diff
  }

  return `${diff.slice(0, MAX_DIFF_CHARS)}\n\n[${TruncationWarning}]`
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

export function buildBYOKCommitGenerationMessages(
  input: BYOKCommitGenerationInput
): ReadonlyArray<BYOKCommitGenerationMessage> {
  const style = input.style ?? 'conventional'
  const language = input.language?.trim() || 'English'
  const diff = truncateDiffForPrompt(input.diff)
  const repositoryName = input.repositoryName?.trim() || 'Unknown repository'
  const branchName = input.branchName?.trim() || 'Unknown branch'
  const customInstructions = input.customInstructions?.trim()

  const userParts = [
    `Repository: ${repositoryName}`,
    `Branch: ${branchName}`,
    `Language: ${language}`,
    '',
    'Style instructions:',
    getStyleInstruction(style),
  ]

  if (customInstructions) {
    userParts.push('', 'Custom instructions:', customInstructions)
  }

  userParts.push('', 'Selected diff:', '```diff', diff, '```')

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
