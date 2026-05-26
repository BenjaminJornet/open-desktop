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

export interface BYOKCommitChunkAnalysisResult {
  readonly summary: string
  readonly description: string
  readonly files: ReadonlyArray<string>
  readonly keyChanges: ReadonlyArray<string>
  readonly commitTypeHints: ReadonlyArray<string>
}

export interface StoredBYOKCommitGenerationModel {
  readonly id: string
  readonly name: string
  /** Provider group (owned_by field from the OpenAI-compatible models API). */
  readonly group?: string
}

export interface StoredBYOKCommitGenerationProvider {
  readonly id: string
  readonly name: string
  readonly baseURL: string
  readonly apiKey: string
  readonly models: ReadonlyArray<StoredBYOKCommitGenerationModel>
}

export interface StoredBYOKCommitGenerationSettings {
  readonly selectedProviderId: string
  readonly selectedModelId: string
  readonly providers: ReadonlyArray<StoredBYOKCommitGenerationProvider>
  readonly temperature: string
  readonly style: BYOKCommitStyle
  readonly language: string
  readonly customInstructions: string
}
