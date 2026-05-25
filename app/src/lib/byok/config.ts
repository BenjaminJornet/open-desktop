import {
  BYOKCommitGenerationConfig,
  BYOKCommitStyle,
} from './types'

type BYOKEnv = NodeJS.ProcessEnv

const BYOKCommitGenerationConfigKey = 'byok-commit-generation-config'

export interface StoredBYOKCommitGenerationConfig {
  readonly baseURL: string
  readonly apiKey: string
  readonly model: string
  readonly temperature: string
  readonly style: BYOKCommitStyle
  readonly language: string
  readonly customInstructions: string
}

function parseStyle(value: string | undefined): BYOKCommitStyle {
  return value === 'simple' || value === 'conventional'
    ? value
    : 'conventional'
}

function parseTemperature(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return 0.2
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0.2
}

function optionalTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeBaseURL(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/chat/completions')
    ? trimmed
    : `${trimmed}/chat/completions`
}

function getDefaultStoredConfig(): StoredBYOKCommitGenerationConfig {
  return {
    baseURL: process.env.DESKTOP_BYOK_BASE_URL ?? '',
    apiKey: process.env.DESKTOP_BYOK_API_KEY ?? '',
    model: process.env.DESKTOP_BYOK_MODEL ?? '',
    temperature: process.env.DESKTOP_BYOK_TEMPERATURE ?? '0.2',
    style: parseStyle(process.env.DESKTOP_BYOK_STYLE),
    language: process.env.DESKTOP_BYOK_LANGUAGE ?? 'English',
    customInstructions: process.env.DESKTOP_BYOK_CUSTOM_INSTRUCTIONS ?? '',
  }
}

export function getStoredBYOKCommitGenerationConfig(): StoredBYOKCommitGenerationConfig {
  const raw = localStorage.getItem(BYOKCommitGenerationConfigKey)
  if (raw === null) {
    return getDefaultStoredConfig()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredBYOKCommitGenerationConfig>
    return {
      baseURL: parsed.baseURL ?? '',
      apiKey: parsed.apiKey ?? '',
      model: parsed.model ?? '',
      temperature: parsed.temperature ?? '0.2',
      style: parseStyle(parsed.style),
      language: parsed.language?.trim() || 'English',
      customInstructions: parsed.customInstructions ?? '',
    }
  } catch {
    return getDefaultStoredConfig()
  }
}

export function setStoredBYOKCommitGenerationConfig(
  config: StoredBYOKCommitGenerationConfig
): void {
  localStorage.setItem(BYOKCommitGenerationConfigKey, JSON.stringify(config))
}

export function getBYOKCommitGenerationConfigFromStoredSettings(): BYOKCommitGenerationConfig | null {
  const stored = getStoredBYOKCommitGenerationConfig()
  const baseURL = stored.baseURL.trim()
  const model = stored.model.trim()

  if (!baseURL || !model) {
    return null
  }

  return {
    baseURL: normalizeBaseURL(baseURL),
    apiKey: stored.apiKey.trim(),
    model,
    temperature: parseTemperature(stored.temperature),
    style: parseStyle(stored.style),
    language: stored.language.trim() || 'English',
    customInstructions: optionalTrimmed(stored.customInstructions),
  }
}

export function getBYOKCommitGenerationConfig(): BYOKCommitGenerationConfig | null {
  return (
    getBYOKCommitGenerationConfigFromStoredSettings() ??
    getBYOKCommitGenerationConfigFromEnv()
  )
}

export function getBYOKCommitGenerationConfigFromEnv(
  env: BYOKEnv = process.env
): BYOKCommitGenerationConfig | null {
  const baseURL = env.DESKTOP_BYOK_BASE_URL?.trim()
  const model = env.DESKTOP_BYOK_MODEL?.trim()

  if (!baseURL || !model) {
    return null
  }

  return {
    baseURL: normalizeBaseURL(baseURL),
    apiKey: env.DESKTOP_BYOK_API_KEY?.trim() ?? '',
    model,
    temperature: parseTemperature(env.DESKTOP_BYOK_TEMPERATURE),
    style: parseStyle(env.DESKTOP_BYOK_STYLE),
    language: optionalTrimmed(env.DESKTOP_BYOK_LANGUAGE) ?? 'English',
    customInstructions: optionalTrimmed(
      env.DESKTOP_BYOK_CUSTOM_INSTRUCTIONS
    ),
  }
}
