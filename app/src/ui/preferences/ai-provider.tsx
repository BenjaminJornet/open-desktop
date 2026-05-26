import * as React from 'react'
import { DialogContent, DialogError } from '../dialog'
import { TextBox } from '../lib/text-box'
import { TextArea } from '../lib/text-area'
import { Select } from '../lib/select'
import { Button } from '../lib/button'
import {
  getStoredBYOKCommitGenerationSettings,
  StoredBYOKCommitGenerationSettings,
} from '../../lib/byok/config'
import { fetchOpenAICompatibleModels } from '../../lib/byok/open-ai-compatible'
import {
  StoredBYOKCommitGenerationModel,
  StoredBYOKCommitGenerationProvider,
} from '../../lib/byok/types'

interface IAIProviderPreferencesProps {
  readonly onSettingsChanged: (
    settings: StoredBYOKCommitGenerationSettings
  ) => void
}

interface IAIProviderPreferencesState {
  readonly settings: StoredBYOKCommitGenerationSettings
  readonly editingProviderId: string
  readonly fetchError: string | null
  readonly fetchMessage: string | null
  readonly isFetchingModels: boolean
}

function createProvider(): StoredBYOKCommitGenerationProvider {
  const id = crypto.randomUUID()
  return {
    id,
    name: 'New provider',
    baseURL: '',
    apiKey: '',
    models: [],
  }
}

function mergeModels(
  existing: ReadonlyArray<StoredBYOKCommitGenerationModel>,
  fetched: ReadonlyArray<StoredBYOKCommitGenerationModel>
): ReadonlyArray<StoredBYOKCommitGenerationModel> {
  const byId = new Map(existing.map(model => [model.id, model]))
  for (const model of fetched) {
    if (!byId.has(model.id)) {
      byId.set(model.id, model)
    }
  }
  // Keep sorted alphabetically so the textarea always shows a consistent order
  return Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id))
}

export class AIProviderPreferences extends React.Component<
  IAIProviderPreferencesProps,
  IAIProviderPreferencesState
> {
  public constructor(props: IAIProviderPreferencesProps) {
    super(props)
    const settings = getStoredBYOKCommitGenerationSettings()
    this.state = {
      settings,
      editingProviderId: settings.selectedProviderId || settings.providers[0]?.id || '',
      fetchError: null,
      fetchMessage: null,
      isFetchingModels: false,
    }
  }

  private updateSettings(
    update:
      | Partial<StoredBYOKCommitGenerationSettings>
      | ((settings: StoredBYOKCommitGenerationSettings) => StoredBYOKCommitGenerationSettings)
  ): void {
    const settings =
      typeof update === 'function'
        ? update(this.state.settings)
        : { ...this.state.settings, ...update }
    this.setState({ settings })
    this.props.onSettingsChanged(settings)
  }

  private get editingProvider(): StoredBYOKCommitGenerationProvider | null {
    return (
      this.state.settings.providers.find(
        provider => provider.id === this.state.editingProviderId
      ) ?? null
    )
  }

  private updateEditingProvider(
    update: Partial<StoredBYOKCommitGenerationProvider>
  ): void {
    const id = this.state.editingProviderId
    this.updateSettings(settings => ({
      ...settings,
      providers: settings.providers.map(provider =>
        provider.id === id ? { ...provider, ...update } : provider
      ),
    }))
    this.setState({ fetchError: null, fetchMessage: null })
  }

  private onSelectedProviderChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const selectedProviderId = event.currentTarget.value
    const provider = this.state.settings.providers.find(
      p => p.id === selectedProviderId
    )
    this.updateSettings({
      selectedProviderId,
      selectedModelId: provider?.models[0]?.id ?? '',
    })
    this.setState({ editingProviderId: selectedProviderId })
  }

  private onSelectedModelChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    this.updateSettings({ selectedModelId: event.currentTarget.value })
  }

  private onNameChanged = (name: string) => this.updateEditingProvider({ name })
  private onBaseURLChanged = (baseURL: string) =>
    this.updateEditingProvider({ baseURL })
  private onAPIKeyChanged = (apiKey: string) =>
    this.updateEditingProvider({ apiKey })
  private onTemperatureChanged = (temperature: string) =>
    this.updateSettings({ temperature })
  private onLanguageChanged = (language: string) => this.updateSettings({ language })
  private onCustomInstructionsChanged = (
    event: React.FormEvent<HTMLTextAreaElement>
  ) => this.updateSettings({ customInstructions: event.currentTarget.value })

  private onStyleChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value
    this.updateSettings({
      style: value === 'simple' ? 'simple' : 'conventional',
    })
  }

  private onAddProvider = () => {
    const provider = createProvider()
    this.updateSettings(settings => ({
      ...settings,
      selectedProviderId: settings.selectedProviderId || provider.id,
      providers: [...settings.providers, provider],
    }))
    this.setState({ editingProviderId: provider.id })
  }

  private onRemoveProvider = () => {
    const id = this.state.editingProviderId
    const providers = this.state.settings.providers.filter(
      provider => provider.id !== id
    )
    const selectedProviderId =
      this.state.settings.selectedProviderId === id
        ? providers[0]?.id ?? ''
        : this.state.settings.selectedProviderId
    const selectedProvider = providers.find(p => p.id === selectedProviderId)
    const settings = {
      ...this.state.settings,
      providers,
      selectedProviderId,
      selectedModelId:
        this.state.settings.selectedProviderId === id
          ? selectedProvider?.models[0]?.id ?? ''
          : this.state.settings.selectedModelId,
    }

    this.setState({
      settings,
      editingProviderId: providers[0]?.id ?? '',
    })
    this.props.onSettingsChanged(settings)
  }

  private onModelsChanged = (value: string) => {
    const models = value
      .split(/\r?\n|,/)
      // Strip inline comments ("model-id  # group" → "model-id")
      .map(line => line.replace(/#.*$/, '').trim())
      .filter(id => id !== '')
      .map(id => ({ id, name: id }))
    this.updateEditingProvider({ models })
  }

  private onFetchModels = async () => {
    const provider = this.editingProvider
    if (provider === null || provider.baseURL.trim() === '') {
      this.setState({ fetchError: 'Enter a base URL before fetching models.' })
      return
    }

    this.setState({ isFetchingModels: true, fetchError: null, fetchMessage: null })
    try {
      const fetched = await fetchOpenAICompatibleModels(
        provider.baseURL,
        provider.apiKey
      )
      const models = mergeModels(provider.models, fetched)
      this.updateEditingProvider({ models })
      this.setState({
        fetchMessage: `Fetched ${fetched.length} model${
          fetched.length === 1 ? '' : 's'
        }.`,
      })
    } catch (error) {
      this.setState({
        fetchError:
          error instanceof Error ? error.message : 'Fetching models failed.',
      })
    } finally {
      this.setState({ isFetchingModels: false })
    }
  }

  public render() {
    const { settings } = this.state
    const selectedProvider = settings.providers.find(
      provider => provider.id === settings.selectedProviderId
    )
    const editingProvider = this.editingProvider

    return (
      <DialogContent>
        {/* Section 1: Providers */}
        <div className="advanced-section">
          <h2>Providers</h2>
          <p className="settings-description">
            Configure OpenAI-compatible providers used by Generate with BYOK.
            API keys are optional for local providers like Ollama.
          </p>

          {settings.providers.length > 0 && (
            <>
              <Select
                label="Active provider"
                value={settings.selectedProviderId}
                onChange={this.onSelectedProviderChanged}
              >
                {settings.providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name || provider.baseURL || 'Untitled provider'}
                  </option>
                ))}
              </Select>
              <Select
                label="Active model"
                value={settings.selectedModelId}
                onChange={this.onSelectedModelChanged}
              >
                {(selectedProvider?.models ?? []).map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name || model.id}
                  </option>
                ))}
              </Select>
            </>
          )}

          <div className="button-group">
            <Button onClick={this.onAddProvider}>Add provider</Button>
            <Button
              onClick={this.onRemoveProvider}
              disabled={editingProvider === null}
            >
              Remove provider
            </Button>
          </div>

          {editingProvider !== null && this.renderProviderEditor(editingProvider)}
        </div>

        {/* Section 2: Generation settings */}
        <div className="advanced-section">
          <h2>Generation settings</h2>
          <TextBox
            label="Temperature"
            value={settings.temperature}
            placeholder="0.2"
            onValueChanged={this.onTemperatureChanged}
          />
          <Select
            label="Style"
            value={settings.style}
            onChange={this.onStyleChanged}
          >
            <option value="conventional">Conventional commits</option>
            <option value="simple">Simple</option>
          </Select>
          <TextBox
            label="Language"
            value={settings.language}
            placeholder="English"
            onValueChanged={this.onLanguageChanged}
          />
          <TextArea
            label="Custom instructions"
            value={settings.customInstructions}
            placeholder="Optional extra instructions"
            onChange={this.onCustomInstructionsChanged}
          />
        </div>
      </DialogContent>
    )
  }

  private renderProviderEditor(provider: StoredBYOKCommitGenerationProvider) {
    return (
      <fieldset className="advanced-section">
        <legend>Provider details</legend>
        {this.state.fetchError !== null && (
          <DialogError>{this.state.fetchError}</DialogError>
        )}
        {this.state.fetchMessage !== null && (
          <p className="settings-description">{this.state.fetchMessage}</p>
        )}
        <TextBox
          label="Provider name"
          value={provider.name}
          placeholder="ProxyPal"
          onValueChanged={this.onNameChanged}
        />
        <TextBox
          label="Base URL"
          value={provider.baseURL}
          placeholder="http://localhost:8317/v1"
          onValueChanged={this.onBaseURLChanged}
        />
        <TextBox
          label="API key"
          type="password"
          value={provider.apiKey}
          placeholder="Optional for local providers"
          onValueChanged={this.onAPIKeyChanged}
        />
        <TextArea
          label="Models"
          value={provider.models
            .map(m => (m.group ? `${m.id}  # ${m.group}` : m.id))
            .join('\n')}
          placeholder="One model ID per line"
          onChange={event => this.onModelsChanged(event.currentTarget.value)}
        />
        <Button onClick={this.onFetchModels} disabled={this.state.isFetchingModels}>
          {this.state.isFetchingModels ? 'Fetching models…' : 'Fetch models'}
        </Button>
      </fieldset>
    )
  }
}
