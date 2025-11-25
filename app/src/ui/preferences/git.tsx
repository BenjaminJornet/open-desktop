import * as React from 'react'
import { DialogContent } from '../dialog'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { Account } from '../../models/account'
import { GitConfigUserForm } from '../lib/git-config-user-form'
import { TabBar } from '../tab-bar'
import { ISegmentedItem } from '../lib/vertical-segmented-control'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Select } from '../lib/select'

interface IGitProps {
  readonly name: string
  readonly email: string
  readonly defaultBranch: string
  readonly isLoadingGitConfig: boolean

  readonly accounts: ReadonlyArray<Account>

  readonly onNameChanged: (name: string) => void
  readonly onEmailChanged: (email: string) => void
  readonly onDefaultBranchChanged: (defaultBranch: string) => void

  readonly onEditGlobalGitConfig: () => void

  readonly selectedTabIndex?: number
  readonly onSelectedTabIndexChanged: (index: number) => void
}

interface IGitState {
  readonly selectedTabIndex: number
  readonly enableGitHookEnv: boolean
  readonly cacheGitHookEnv: boolean
  readonly selectedShell: string
}

const windowsShells: ReadonlyArray<ISegmentedItem<string>> = [
  {
    key: 'g4w-bash',
    title: 'Git Bash (Git for Windows)',
  },
  {
    key: 'pwsh',
    title: 'PowerShell Core',
  },
  {
    key: 'powershell',
    title: 'PowerShell Desktop',
  },
  {
    key: 'cmd',
    title: 'Command Prompt',
  },
]

export class Git extends React.Component<IGitProps, IGitState> {
  public constructor(props: IGitProps) {
    super(props)

    this.state = {
      selectedTabIndex: this.props.selectedTabIndex ?? 0,
      enableGitHookEnv: false, // TODO: load from props
      cacheGitHookEnv: false, // TODO: load from props
      selectedShell: windowsShells[0].key, // TODO: load from props
    }
  }

  private onTabClicked = (index: number) => {
    this.setState({ selectedTabIndex: index })
    this.props.onSelectedTabIndexChanged?.(index)
  }

  private onEnableGitHookEnvChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.setState({ enableGitHookEnv: event.currentTarget.checked })
  }

  private onCacheGitHookEnvChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.setState({ cacheGitHookEnv: event.currentTarget.checked })
  }

  private onSelectedShellChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    this.setState({ selectedShell: event.currentTarget.value })
  }

  private renderHooksSettings() {
    return (
      <>
        <Checkbox
          label="Load Git hook environment variables from shell"
          ariaDescribedBy="git-hooks-env-description"
          value={
            this.state.enableGitHookEnv ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onEnableGitHookEnvChanged}
        />
        <p className="git-hooks-env-description">
          When enabled, GitHub Desktop will attempt to load environment
          variables from your shell when executing Git hooks. This is useful if
          your Git hooks depend on environment variables set in your shell
          configuration files, a common practive for version managers such as
          nvm, rbenv, asdf, etc.
        </p>

        {this.state.enableGitHookEnv && __WIN32__ && (
          <>
            <Select
              className="git-hook-shell-select"
              label={'Shell to use when loading environment'}
              value={this.state.selectedShell}
              onChange={this.onSelectedShellChanged}
            >
              {windowsShells.map(s => (
                <option key={s.key} value={s.key}>
                  {s.title}
                </option>
              ))}
            </Select>
          </>
        )}

        {this.state.enableGitHookEnv && (
          <>
            <Checkbox
              label="Cache Git hook environment variables"
              ariaDescribedBy="git-hooks-cache-description"
              onChange={this.onCacheGitHookEnvChanged}
              value={
                this.state.cacheGitHookEnv
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
            />

            <div className="git-hooks-cache-description">
              Cache hook environment variables to improve performance. Disable
              if your hooks rely on frequently changing environment variables.
            </div>
          </>
        )}
      </>
    )
  }

  public render() {
    return (
      <DialogContent className="git-preferences">
        <TabBar
          selectedIndex={this.state.selectedTabIndex}
          onTabClicked={this.onTabClicked}
        >
          <span>Author</span>
          <span>Default branch</span>
          <span>Hooks</span>
        </TabBar>
        <div className="git-preferences-content">{this.renderCurrentTab()}</div>
      </DialogContent>
    )
  }

  private renderCurrentTab() {
    if (this.state.selectedTabIndex === 0) {
      return this.renderGitConfigAuthorInfo()
    } else if (this.state.selectedTabIndex === 1) {
      return this.renderDefaultBranchSetting()
    } else if (this.state.selectedTabIndex === 2) {
      return this.renderHooksSettings()
    }

    return null
  }

  private renderGitConfigAuthorInfo() {
    return (
      <>
        <GitConfigUserForm
          email={this.props.email}
          name={this.props.name}
          isLoadingGitConfig={this.props.isLoadingGitConfig}
          accounts={this.props.accounts}
          onEmailChanged={this.props.onEmailChanged}
          onNameChanged={this.props.onNameChanged}
        />
        {this.renderEditGlobalGitConfigInfo()}
      </>
    )
  }

  private renderDefaultBranchSetting() {
    return (
      <div className="default-branch-component">
        <h2 id="default-branch-heading">
          Default branch name for new repositories
        </h2>

        <RefNameTextBox
          initialValue={this.props.defaultBranch}
          onValueChange={this.props.onDefaultBranchChanged}
          ariaLabelledBy={'default-branch-heading'}
          ariaDescribedBy="default-branch-description"
          warningMessageVerb="saved"
        />

        <p id="default-branch-description" className="git-settings-description">
          GitHub's default branch name is <Ref>main</Ref>. You may want to
          change it due to different workflows, or because your integrations
          still require the historical default branch name of <Ref>master</Ref>.
        </p>

        {this.renderEditGlobalGitConfigInfo()}
      </div>
    )
  }

  private renderEditGlobalGitConfigInfo() {
    return (
      <p className="git-settings-description">
        These preferences will{' '}
        <LinkButton onClick={this.props.onEditGlobalGitConfig}>
          edit your global Git config file
        </LinkButton>
        .
      </p>
    )
  }
}
