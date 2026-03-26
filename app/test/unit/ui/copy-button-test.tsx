import assert from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { clipboard } from 'electron'
import * as React from 'react'

import { fireEvent, render, screen, waitFor } from '../../helpers/ui/render'
import { CopyButton } from '../../../src/ui/copy-button'

describe('CopyButton', () => {
  const writes: Array<string> = []

  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout'] })
    writes.length = 0
    clipboard.writeText = (text: string) => {
      writes.push(text)
    }
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('copies content and announces the copied state before resetting', async () => {
    render(
      <CopyButton
        copyContent="refs/heads/main"
        ariaLabel="Copy branch name"
      />
    )

    const button = screen.getByRole('button', { name: 'Copy branch name' })

    fireEvent.click(button)

    assert.deepEqual(writes, ['refs/heads/main'])

    mock.timers.tick(1000)

    await waitFor(() => {
      const liveRegion = screen.getByText(/^Copied!/, { selector: 'div' })
      assert.ok(liveRegion.textContent?.startsWith('Copied!'))
    })

    mock.timers.tick(2000)

    await waitFor(() => {
      assert.equal(screen.queryByText(/^Copied!/, { selector: 'div' }), null)
    })
  })
})