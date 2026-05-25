import * as React from 'react'
import { DialogContent } from '../dialog'
import { TextBox } from '../lib/text-box'
import { TextArea } from '../lib/text-area'
import { Select } from '../lib/select'
import {
  StoredBYOKCommitGenerationConfig,
  getStoredBYOKCommitGenerationConfig,
} from '../../lib/byok/config'

interface IAIProviderPreferencesProps {
  readonly onConfigChanged: (config: StoredBYOKCommitGenerationConfig) => void
}

interface IAIProviderPreferencesState {
  readonly config: StoredBYOKCommitGenerationConfig
}

export class AIProviderPreferences extends React.Component<
  IAIProviderPreferencesProps,
  IAIProviderPreferencesState
> {
  public constructor(props: IAIProviderPreferencesProps) {
    super(props)
    this.state = { config: getStoredBYOKCommitGenerationConfig() }
  }

  private updateConfig(
    update: Partial<StoredBYOKCommitGenerationConfig>
  ): void {
    const config = { ...this.state.config, ...update }
    this.setState({ config })
    this.props.onConfigChanged(config)
  }

  private onBaseURLChanged = (baseURL: string) => this.updateConfig({ baseURL })
  private onAPIKeyChanged = (apiKey: string) => this.updateConfig({ apiKey })
  private onModelChanged = (model: string) => this.updateConfig({ model })
  private onTemperatureChanged = (temperature: string) =>
    this.updateConfig({ temperature })
  private onLanguageChanged = (language: string) => this.updateConfig({ language })
  private onCustomInstructionsChanged = (
    event: React.FormEvent<HTMLTextAreaElement>
  ) => this.updateConfig({ customInstructions: event.currentTarget.value })

  private onStyleChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value
    this.updateConfig({
      style: value === 'simple' ? 'simple' : 'conventional',
    })
  }

  public render() {
    const { config } = this.state

    return (
      <DialogContent>
        <div className="advanced-section">
          <h2>BYOK commit generation</h2>
          <p className="settings-description">
            Configure the OpenAI-compatible provider used by Generate with BYOK.
            The app sends only the changes selected for the commit.
          </p>
          <TextBox
            label="Base URL"
            value={config.baseURL}
            placeholder="http://localhost:8317/v1"
            onValueChanged={this.onBaseURLChanged}
          />
          <TextBox
            label="API key"
            type="password"
            value={config.apiKey}
            placeholder="Optional for local providers"
            onValueChanged={this.onAPIKeyChanged}
          />
          <TextBox
            label="Model"
            value={config.model}
            placeholder="gemini-3.1-pro-low"
            onValueChanged={this.onModelChanged}
          />
          <TextBox
            label="Temperature"
            value={config.temperature}
            placeholder="0.2"
            onValueChanged={this.onTemperatureChanged}
          />
          <Select
            label="Style"
            value={config.style}
            onChange={this.onStyleChanged}
          >
            <option value="conventional">Conventional commits</option>
            <option value="simple">Simple</option>
          </Select>
          <TextBox
            label="Language"
            value={config.language}
            placeholder="English"
            onValueChanged={this.onLanguageChanged}
          />
          <TextArea
            label="Custom instructions"
            value={config.customInstructions}
            placeholder="Optional extra instructions"
            onChange={this.onCustomInstructionsChanged}
          />
        </div>
      </DialogContent>
    )
  }
}
