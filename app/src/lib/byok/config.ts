import {
  BYOKCommitGenerationConfig,
  BYOKCommitStyle,
  StoredBYOKCommitGenerationProvider,
  StoredBYOKCommitGenerationSettings,
} from './types'

type BYOKEnv = NodeJS.ProcessEnv

const BYOKCommitGenerationConfigKey = 'byok-commit-generation-config'
const DefaultProviderId = 'default'

export interface StoredBYOKCommitGenerationConfig {
  readonly baseURL: string
  readonly apiKey: string
  readonly model: string
  readonly temperature: string
  readonly style: BYOKCommitStyle
  readonly language: string
  readonly customInstructions: string
}

export type { StoredBYOKCommitGenerationSettings }

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

export function normalizeBYOKChatCompletionsURL(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/chat/completions')
    ? trimmed
    : `${trimmed}/chat/completions`
}

export function getBYOKModelsURL(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (trimmed.endsWith('/chat/completions')) {
    return `${trimmed.slice(0, -'/chat/completions'.length)}/models`
  }
  return `${trimmed}/models`
}

function createDefaultProvider(
  config: StoredBYOKCommitGenerationConfig
): StoredBYOKCommitGenerationProvider | null {
  const baseURL = config.baseURL.trim()
  const model = config.model.trim()
  if (!baseURL && !model) {
    return null
  }

  return {
    id: DefaultProviderId,
    name: 'Default',
    baseURL,
    apiKey: config.apiKey,
    models: model !== '' ? [{ id: model, name: model }] : [],
  }
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
  const settings = getStoredBYOKCommitGenerationSettings()
  const provider = settings.providers.find(
    p => p.id === settings.selectedProviderId
  )

  return {
    baseURL: provider?.baseURL ?? '',
    apiKey: provider?.apiKey ?? '',
    model: settings.selectedModelId,
    temperature: settings.temperature,
    style: settings.style,
    language: settings.language,
    customInstructions: settings.customInstructions,
  }
}

export function setStoredBYOKCommitGenerationConfig(
  config: StoredBYOKCommitGenerationConfig
): void {
  const provider = createDefaultProvider(config)
  setStoredBYOKCommitGenerationSettings({
    selectedProviderId: provider?.id ?? '',
    selectedModelId: config.model.trim(),
    providers: provider === null ? [] : [provider],
    temperature: config.temperature,
    style: parseStyle(config.style),
    language: config.language.trim() || 'English',
    customInstructions: config.customInstructions,
  })
}

function parseLegacyStoredConfig(
  raw: string | null
): StoredBYOKCommitGenerationConfig {
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

function isStoredProvider(
  value: unknown
): value is StoredBYOKCommitGenerationProvider {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const provider = value as Partial<StoredBYOKCommitGenerationProvider>
  return (
    typeof provider.id === 'string' &&
    typeof provider.name === 'string' &&
    typeof provider.baseURL === 'string' &&
    typeof provider.apiKey === 'string' &&
    Array.isArray(provider.models)
  )
}

export function getStoredBYOKCommitGenerationSettings(): StoredBYOKCommitGenerationSettings {
  const raw = localStorage.getItem(BYOKCommitGenerationConfigKey)
  const legacy = parseLegacyStoredConfig(raw)

  try {
    const parsed = raw === null ? null : JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && 'providers' in parsed) {
      const record = parsed as Partial<StoredBYOKCommitGenerationSettings>
      const providers = Array.isArray(record.providers)
        ? record.providers.filter(isStoredProvider).map(provider => ({
            ...provider,
            models: provider.models
              .filter(
                model =>
                  typeof model === 'object' &&
                  model !== null &&
                  typeof (model as { id?: unknown }).id === 'string'
              )
              .map(model => {
                const m = model as { id: string; name?: unknown }
                return {
                  id: m.id,
                  name: typeof m.name === 'string' ? m.name : m.id,
                }
              }),
          }))
        : []

      return {
        selectedProviderId: record.selectedProviderId ?? providers[0]?.id ?? '',
        selectedModelId:
          record.selectedModelId ?? providers[0]?.models[0]?.id ?? '',
        providers,
        temperature: record.temperature ?? legacy.temperature,
        style: parseStyle(record.style),
        language: record.language?.trim() || legacy.language,
        customInstructions: record.customInstructions ?? legacy.customInstructions,
      }
    }
  } catch {
    // Fall through to legacy/default migration.
  }

  const provider = createDefaultProvider(legacy)
  return {
    selectedProviderId: provider?.id ?? '',
    selectedModelId: legacy.model.trim(),
    providers: provider === null ? [] : [provider],
    temperature: legacy.temperature,
    style: parseStyle(legacy.style),
    language: legacy.language.trim() || 'English',
    customInstructions: legacy.customInstructions,
  }
}

export function setStoredBYOKCommitGenerationSettings(
  settings: StoredBYOKCommitGenerationSettings
): void {
  localStorage.setItem(BYOKCommitGenerationConfigKey, JSON.stringify(settings))
}

export function getBYOKCommitGenerationConfigFromStoredSettings(): BYOKCommitGenerationConfig | null {
  const stored = getStoredBYOKCommitGenerationSettings()
  const provider = stored.providers.find(p => p.id === stored.selectedProviderId)
  const baseURL = provider?.baseURL.trim() ?? ''
  const model = stored.selectedModelId.trim()

  if (!baseURL || !model) {
    return null
  }

  return {
    baseURL: normalizeBYOKChatCompletionsURL(baseURL),
    apiKey: provider?.apiKey.trim() ?? '',
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
    baseURL: normalizeBYOKChatCompletionsURL(baseURL),
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
