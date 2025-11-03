import { exec } from 'dugite'
import { access, constants, readdir } from 'fs/promises'
import { join, resolve } from 'path'

const isExecutable = (path: string) =>
  access(path, constants.X_OK)
    .then(() => true)
    .catch(() => false)

export async function* getRepoHooks(path: string) {
  // TODO: Could we cache this? For just a little while?
  // Probably not because we need to react to changes to core.hooksPath on the
  // fly but it sure would be nice.
  const { exitCode, stdout } = await exec(
    ['config', '-z', '--get', 'core.hooksPath'],
    path
  )

  const hooksPath =
    exitCode === 0
      ? resolve(path, stdout.split('\0')[0])
      : join(path, '.git', 'hooks')

  const files = await readdir(hooksPath, { withFileTypes: true })
    .then(entries => entries.filter(x => x.isFile()))
    .catch(() => [])

  for (const hook of files) {
    const hookPath = join(hook.parentPath, hook.name)

    if (__WIN32__) {
      if (hook.name.endsWith('.exe')) {
        continue
      }
    } else {
      if (!(await isExecutable(hookPath))) {
        continue
      }
    }

    yield hookPath
  }
}
