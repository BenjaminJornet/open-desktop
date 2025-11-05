import memoizeOne from 'memoize-one'
import { Shescape } from 'shescape'

const getQuoteFn = memoizeOne((shell: string) => {
  const shescape = new Shescape({ shell, flagProtection: false })
  return {
    escape: shescape.escape.bind(shescape),
    quote: shescape.quote.bind(shescape),
  }
})

export const getShell = () => {
  // TODO: Windows:
  if (__WIN32__) {
    throw new Error('Not implemented')
  }

  if (process.env.SHELL) {
    return {
      shell: process.env.SHELL,
      args: ['-ilc'],
      ...getQuoteFn(process.env.SHELL),
    }
  }

  return {
    shell: '/bin/sh',
    args: ['-ilc'],
    ...getQuoteFn('/bin/sh'),
  }
}
