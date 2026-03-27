import assert from 'node:assert'
import { describe, it, mock } from 'node:test'
import * as React from 'react'

import { CICheckRunNoStepItem } from '../../../src/ui/check-runs/ci-check-run-no-steps'
import { fireEvent, render, screen } from '../../helpers/ui/render'

describe('small action and dialog surfaces', () => {
  it('renders the no-step check-run state and invokes the external-view callback', () => {
    let externalViewCount = 0

    function onViewCheckExternally() {
      externalViewCount++
    }

    const view = render(
      React.createElement(CICheckRunNoStepItem, {
        onViewCheckExternally,
      })
    )

    const button = screen.getByRole('link', { name: 'View check details' })
    const image = view.container.querySelector('.ci-check-run-no-steps img')

    assert.ok(
      screen.getByText('There are no steps to display for this check.', {
        exact: false,
      })
    )
    assert.notEqual(image, null)
    assert.equal(image?.getAttribute('alt'), '')

    fireEvent.click(button)

    assert.equal(externalViewCount, 1)
  })

  it('renders the cli-installed dialog and dismisses through the default button', async () => {
    let dismissedCount = 0

    function onDismissed() {
      dismissedCount++
    }

    mock.module('fs-admin', {
      namedExports: {
        unlink: () => {},
        makeTree: () => {},
        symlink: () => {},
      },
    })

    const electron = await import('electron')
    const previousSend = electron.ipcRenderer.send
    electron.ipcRenderer.send = () => {}

    const { CLIInstalled } = await import('../../../src/ui/cli-installed/cli-installed')

    render(React.createElement(CLIInstalled, { onDismissed }))

    const title = screen.getByText(
      __DARWIN__
        ? 'Command Line Tool Installed'
        : 'Command line tool installed'
    )
    const okButton = screen.getByRole('button', { name: 'Ok', hidden: true })

    assert.ok(title)
    assert.ok(screen.getByText('/usr/local/bin/github'))

    fireEvent.click(okButton)

    assert.equal(dismissedCount, 1)

    electron.ipcRenderer.send = previousSend
  })
})