import assert from 'node:assert'
import { afterEach, describe, it } from 'node:test'
import * as React from 'react'

import { shell } from '../../../src/lib/app-shell'
import { LinkButton } from '../../../src/ui/lib/link-button'
import {
  extract,
  PathText,
  truncateMid,
  truncatePath,
} from '../../../src/ui/lib/path-text'
import { fireEvent, render, screen } from '../../helpers/ui/render'

const originalOpenExternal = shell.openExternal

afterEach(() => {
  shell.openExternal = originalOpenExternal
})

describe('path text and link button surfaces', () => {
  it('truncates text and paths using the exported helpers', () => {
    assert.equal(truncateMid('abcdef', 4), 'a…ef')
    assert.equal(truncateMid('abcdef', 1), '…')
    assert.equal(truncatePath('src/components/file.tsx', 12), 'sr…/file.tsx')
    assert.deepEqual(extract('src/components/file.tsx'), {
      normalizedFileName: 'file.tsx',
      normalizedDirectory: 'src/components/',
    })
  })

  it('renders path text without a tooltip when the full path fits', () => {
    const view = render(
      <PathText path="src/components/file.tsx" availableWidth={500} />
    )

    const dirname = view.container.querySelector('.dirname')
    const filename = view.container.querySelector('.filename')

    assert.equal(dirname?.textContent, 'src/components/')
    assert.equal(filename?.textContent, 'file.tsx')
    assert.equal(view.container.querySelector('[role="tooltip"]'), null)
  })

  it('treats uri links as links and callback-only links as buttons', async () => {
    const openedUrls: Array<string> = []
    let callbackClicks = 0
    let hoverCount = 0

    shell.openExternal = async (url: string) => {
      openedUrls.push(url)
      return true
    }

    function onClick() {
      callbackClicks++
    }

    function onMouseOver() {
      hoverCount++
    }

    render(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          LinkButton,
          {
            uri: 'https://example.com/docs',
            onMouseOver,
          },
          'Documentation'
        ),
        React.createElement(
          LinkButton,
          {
            onClick,
            ariaLabel: 'Retry action',
          },
          'Retry'
        ),
        React.createElement(
          LinkButton,
          {
            uri: 'https://example.com/disabled',
            disabled: true,
          },
          'Disabled link'
        )
      )
    )

    const link = screen.getByRole('link', { name: 'Documentation' })
    const button = screen.getByRole('button', { name: 'Retry action' })
    const disabledLink = screen.getByRole('link', { name: 'Disabled link' })

    fireEvent.mouseOver(link)
    fireEvent.click(link)
    fireEvent.click(button)
    fireEvent.click(disabledLink)

    await Promise.resolve()

    assert.equal(link.getAttribute('href'), 'https://example.com/docs')
    assert.equal(button.getAttribute('role'), 'button')
    assert.equal(hoverCount, 1)
    assert.deepEqual(openedUrls, ['https://example.com/docs'])
    assert.equal(callbackClicks, 1)
  })
})
