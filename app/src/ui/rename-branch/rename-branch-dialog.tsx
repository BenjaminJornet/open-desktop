import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import {
  Repository,
  isRepositoryWithGitHubRepository,
} from '../../models/repository'
import { Branch } from '../../models/branch'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { renderBranchHasRemoteWarning } from '../lib/branch-name-warnings'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { API, APIRepoRuleType, IAPIRepoRuleset } from '../../lib/api'
import { Account } from '../../models/account'
import { getAccountForRepository } from '../../lib/get-account-for-repository'
import { InputError } from '../lib/input-description/input-error'
import { InputWarning } from '../lib/input-description/input-warning'
import { parseRepoRules, useRepoRulesLogic } from '../../lib/helpers/repo-rules'
import { Row } from '../lib/row'

interface IRenameBranchProps {
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
  readonly repository: Repository
  readonly branch: Branch
  readonly accounts: ReadonlyArray<Account>
  readonly cachedRepoRulesets: ReadonlyMap<number, IAPIRepoRuleset>
}

interface IRenameBranchState {
  readonly newName: string
  readonly currentError: { error: Error; isWarning: boolean } | null
}

export class RenameBranch extends React.Component<
  IRenameBranchProps,
  IRenameBranchState
> {
  private branchRulesDebounceId: number | null = null

  private readonly ERRORS_ID = 'rename-branch-name-errors'

  public constructor(props: IRenameBranchProps) {
    super(props)

    this.state = { newName: props.branch.name, currentError: null }
  }

  public render() {
    const disabled =
      this.state.newName.length === 0 ||
      (!!this.state.currentError && !this.state.currentError.isWarning)
    const hasError = !!this.state.currentError

    return (
      <Dialog
        id="rename-branch"
        title={__DARWIN__ ? 'Rename Branch' : 'Rename branch'}
        onDismissed={this.props.onDismissed}
        onSubmit={this.renameBranch}
        focusCloseButtonOnOpen={true}
      >
        <DialogContent>
          {renderBranchHasRemoteWarning(this.props.branch)}
          <RefNameTextBox
            label="Name"
            ariaDescribedBy={hasError ? this.ERRORS_ID : undefined}
            initialValue={this.props.branch.name}
            onValueChange={this.onNameChange}
          />

          {this.renderBranchNameErrors()}
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={`Rename ${this.props.branch.name}`}
            okButtonDisabled={disabled}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderBranchNameErrors() {
    const { currentError } = this.state
    if (!currentError) {
      return null
    }

    if (currentError.isWarning) {
      return (
        <Row>
          <InputWarning
            id={this.ERRORS_ID}
            trackedUserInput={this.state.newName}
          >
            {currentError.error.message}
          </InputWarning>
        </Row>
      )
    } else {
      return (
        <Row>
          <InputError id={this.ERRORS_ID} trackedUserInput={this.state.newName}>
            {currentError.error.message}
          </InputError>
        </Row>
      )
    }
  }

  private onNameChange = (name: string) => {
    this.setState({ newName: name, currentError: null })

    if (this.branchRulesDebounceId !== null) {
      window.clearTimeout(this.branchRulesDebounceId)
    }

    if (name !== '') {
      this.branchRulesDebounceId = window.setTimeout(
        this.checkBranchRules,
        500,
        name
      )
    }
  }

  /**
   * Checks repo rules to see if the provided branch name is valid for the
   * current user and repository. The "get all rules for a branch" endpoint
   * is called first, and if a "creation" or "branch name" rule is found,
   * then those rulesets are checked to see if the current user can bypass
   * them.
   */
  private checkBranchRules = async (branchName: string) => {
    if (
      this.state.newName !== branchName ||
      this.props.accounts.length === 0 ||
      !isRepositoryWithGitHubRepository(this.props.repository) ||
      branchName === '' ||
      this.state.currentError !== null
    ) {
      return
    }

    const account = getAccountForRepository(
      this.props.accounts,
      this.props.repository
    )

    if (
      account === null ||
      !useRepoRulesLogic(account, this.props.repository)
    ) {
      return
    }

    const api = API.fromAccount(account)
    const branchRules = await api.fetchRepoRulesForBranch(
      this.props.repository.gitHubRepository.owner.login,
      this.props.repository.gitHubRepository.name,
      branchName
    )

    // Make sure user branch name hasn't changed during api call
    if (this.state.newName !== branchName) {
      return
    }

    // filter the rules to only the relevant ones and get their IDs. use a Set to dedupe.
    const toCheck = new Set(
      branchRules
        .filter(
          r =>
            r.type === APIRepoRuleType.Creation ||
            r.type === APIRepoRuleType.BranchNamePattern
        )
        .map(r => r.ruleset_id)
    )

    // there are no relevant rules for this branch name, so return
    if (toCheck.size === 0) {
      return
    }

    // check for actual failures
    const { branchNamePatterns, creationRestricted } = await parseRepoRules(
      branchRules,
      this.props.cachedRepoRulesets,
      this.props.repository
    )

    // Make sure user branch name hasn't changed during parsing of repo rules
    // (async due to a config retrieval of users with commit signing repo rules)
    if (this.state.newName !== branchName) {
      return
    }

    const { status } = branchNamePatterns.getFailedRules(branchName)

    // Only possible kind of failures is branch name pattern failures and creation restriction
    if (creationRestricted !== true && status === 'pass') {
      return
    }

    // check cached rulesets to see which ones the user can bypass
    let cannotBypass = false
    for (const id of toCheck) {
      const rs = this.props.cachedRepoRulesets.get(id)

      if (rs?.current_user_can_bypass !== 'always') {
        // the user cannot bypass, so stop checking
        cannotBypass = true
        break
      }
    }

    if (cannotBypass) {
      this.setState({
        currentError: {
          error: new Error(
            `Branch name '${branchName}' is restricted by repo rules.`
          ),
          isWarning: false,
        },
      })
    } else {
      this.setState({
        currentError: {
          error: new Error(
            `Branch name '${branchName}' is restricted by repo rules, but you can bypass them. Proceed with caution!`
          ),
          isWarning: true,
        },
      })
    }
  }

  private renameBranch = () => {
    this.props.dispatcher.renameBranch(
      this.props.repository,
      this.props.branch,
      this.state.newName
    )
    this.props.onDismissed()
  }
}
