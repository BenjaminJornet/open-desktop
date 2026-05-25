export type BYOKCommitStyle = 'simple' | 'conventional'

export interface BYOKCommitGenerationConfig {
  readonly baseURL: string
  readonly apiKey: string
  readonly model: string
  readonly temperature: number
  readonly style: BYOKCommitStyle
  readonly language: string
  readonly customInstructions?: string
}

export interface BYOKCommitGenerationInput {
  readonly diff: string
  readonly repositoryName?: string
  readonly branchName?: string
  readonly style?: BYOKCommitStyle
  readonly language?: string
  readonly customInstructions?: string
}

export interface BYOKCommitGenerationResult {
  readonly summary: string
  readonly description: string
}
