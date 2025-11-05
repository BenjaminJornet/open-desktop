import { join } from 'path'
import { getShell } from './get-shell'
import { execFile } from '../exec-file'

export const getShellEnv = async (): Promise<
  Record<string, string | undefined>
> => {
  const ext = __WIN32__ ? '.exe' : ''
  const printenvzPath = join(__dirname, `printenvz${ext}`)

  const { shell, args, quote } = getShell()
  const { stdout } = await execFile(shell, [...args, quote(printenvzPath)], {
    env: {},
    maxBuffer: Infinity,
  })

  const matches = stdout.matchAll(/([^=]+)=([^\0]*)\0/g)
  return Object.fromEntries(Array.from(matches, m => [m[1], m[2]]))
}
