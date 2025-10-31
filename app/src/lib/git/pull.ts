import { git, gitRebaseArguments, IGitStringExecutionOptions } from './core'
import { Repository } from '../../models/repository'
import { IPullProgress } from '../../models/progress'
import {
  PullProgressParser,
  executionOptionsWithProgress,
  IGitOutput,
} from '../progress'
import { IRemote } from '../../models/remote'
import {
  envForRemoteOperation,
  getFallbackUrlForProxyResolve,
} from './environment'
import { getConfigValue } from './config'

const PullStepWeight = 0.9

function clampProgress(
  minimum: number,
  maximum: number,
  progressCallback: (progress: IPullProgress) => void
): (progress: IPullProgress) => void {
  return (progress: IPullProgress) =>
    progressCallback({
      ...progress,
      value: minimum + progress.value * (maximum - minimum),
    })
}

async function getPullArgs(
  repository: Repository,
  remote: string,
  progressCallback?: (progress: IPullProgress) => void
) {
  return [
    ...gitRebaseArguments(),
    'pull',
    ...(await getDefaultPullDivergentBranchArguments(repository)),
    ...(progressCallback ? ['--progress'] : []),
    remote,
  ]
}

/**
 * Update submodules after a pull operation.
 *
 * @param repository - The repository in which to update submodules
 * @param remote - The remote that was pulled from
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the submodule update operation.
 */
async function updateSubmodulesAfterPull(
  repository: Repository,
  remote: IRemote,
  progressCallback: ((progress: IPullProgress) => void) | undefined,
  allowFileProtocol: boolean
): Promise<void> {
  const opts: IGitStringExecutionOptions = {
    env: await envForRemoteOperation(
      getFallbackUrlForProxyResolve(repository, remote)
    ),
  }

  const args = [
    ...(allowFileProtocol ? ['-c', 'protocol.file.allow=always'] : []),
    'submodule',
    'update',
    '--init',
    '--recursive',
  ]

  if (!progressCallback) {
    await git(args, repository.path, 'updateSubmodules', opts)
    return
  }

  // Initial progress
  const title = `Pulling ${remote.name}`
  progressCallback({
    kind: 'pull',
    title,
    description: 'Updating submodules',
    value: 0,
    remote: remote.name,
  })

  const kind = 'pull'

  let submoduleEventCount = 0

  const progressOpts = await executionOptionsWithProgress(
    { ...opts, trackLFSProgress: true },
    {
      parse(line: string): IGitOutput {
        if (
          line.match(/^Submodule path (.)+?: checked out /) ||
          line.startsWith('Cloning into ')
        ) {
          submoduleEventCount += 1
        }

        return {
          kind: 'context',
          text: `Updating submodules: ${line}`,
          // Math taken from https://math.stackexchange.com/a/2323106
          // We do this to fake a progress that slows down as we process more
          // events, as we don't know how many submodules there are upfront, or
          // what does git have to do with them (cloning, just checking them
          // out...)
          percent: 1 - Math.exp(-submoduleEventCount * 0.25),
        }
      },
    },
    progress => {
      const description =
        progress.kind === 'progress' ? progress.details.text : progress.text

      const value = progress.percent

      progressCallback({
        kind,
        title,
        description,
        value,
        remote: remote.name,
      })
    }
  )

  await git(args, repository.path, 'updateSubmodules', progressOpts)

  // Final progress
  progressCallback({
    kind,
    title,
    description: 'Submodules updated',
    value: 1,
    remote: remote.name,
  })
}

/**
 * Pull from the specified remote.
 *
 * @param repository - The repository in which the pull should take place
 *
 * @param remote     - The name of the remote that should be pulled from
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the pull operation. When provided this enables
 *                           the '--progress' command line flag for
 *                           'git pull'.
 */
export async function pull(
  repository: Repository,
  remote: IRemote,
  progressCallback?: (progress: IPullProgress) => void,
  allowFileProtocol: boolean = false
): Promise<void> {
  let opts: IGitStringExecutionOptions = {
    env: await envForRemoteOperation(
      getFallbackUrlForProxyResolve(repository, remote)
    ),
  }

  if (progressCallback) {
    const title = `Pulling ${remote.name}`
    const kind = 'pull'

    const clampedCallback = clampProgress(0, PullStepWeight, progressCallback)

    opts = await executionOptionsWithProgress(
      { ...opts, trackLFSProgress: true },
      new PullProgressParser(),
      progress => {
        // In addition to progress output from the remote end and from
        // git itself, the stderr output from pull contains information
        // about ref updates. We don't need to bring those into the progress
        // stream so we'll just punt on anything we don't know about for now.
        if (progress.kind === 'context') {
          if (!progress.text.startsWith('remote: Counting objects')) {
            return
          }
        }

        const description =
          progress.kind === 'progress' ? progress.details.text : progress.text

        const value = progress.percent

        clampedCallback({
          kind,
          title,
          description,
          value,
          remote: remote.name,
        })
      }
    )

    // Initial progress
    clampedCallback({ kind, title, value: 0, remote: remote.name })
  }

  const args = await getPullArgs(repository, remote.name, progressCallback)
  await git(args, repository.path, 'pull', opts)

  // Update submodules after pull
  await updateSubmodulesAfterPull(
    repository,
    remote,
    progressCallback
      ? clampProgress(PullStepWeight, 1, progressCallback)
      : undefined,
    allowFileProtocol
  )
}

/**
 * Defaults the pull default for divergent paths to try to fast forward and if
 * not perform a merge. Aka uses the flag --ff
 *
 * It checks whether the user has a config set for this already, if so, no need for
 * default.
 */
async function getDefaultPullDivergentBranchArguments(
  repository: Repository
): Promise<ReadonlyArray<string>> {
  try {
    const pullFF = await getConfigValue(repository, 'pull.ff')
    return pullFF !== null ? [] : ['--ff']
  } catch (e) {
    log.error("Couldn't read 'pull.ff' config", e)
  }

  // If there is a failure in checking the config, we still want to use any
  // config and not overwrite the user's set config behavior. This will show the
  // git error if no config is set.
  return []
}
