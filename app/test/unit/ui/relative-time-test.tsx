import assert from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import * as React from 'react'

import { render, screen } from '../../helpers/ui/render'
import { RelativeTime } from '../../../src/ui/relative-time'

const now = Date.parse('2026-03-26T12:00:00.000Z')

describe('RelativeTime', () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ['Date', 'setTimeout'] })
    mock.timers.setTime(now)
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('renders recent relative text without a tooltip wrapper when disabled', () => {
    render(
      <RelativeTime date={new Date(now - 30 * 1000)} tooltip={false} />
    )

    const text = screen.getByText('just now')

    assert.equal(text.tagName, 'SPAN')
    assert.equal(text.textContent, 'just now')
  })

  it('renders recent relative text with the default tooltip-enabled path', () => {
    render(<RelativeTime date={new Date(now - 30 * 1000)} />)

    const text = screen.getByText('just now')

    assert.equal(text.textContent, 'just now')
  })

  it('updates its rendered text when the date prop changes', () => {
    const view = render(
      <RelativeTime date={new Date(now - 2 * 60 * 1000)} tooltip={false} />
    )

    assert.equal(screen.getByText('2 minutes ago').textContent, '2 minutes ago')

    view.rerender(
      <RelativeTime date={new Date(now - 2 * 60 * 60 * 1000)} tooltip={false} />
    )

    assert.equal(screen.getByText('2 hours ago').textContent, '2 hours ago')
  })

  it('refreshes once the scheduled timeout elapses', () => {
    render(
      <RelativeTime date={new Date(now - 44 * 1000)} tooltip={false} />
    )

    assert.equal(screen.getByText('just now').textContent, 'just now')

    mock.timers.tick(16 * 1000)

    assert.equal(screen.getByText('1 minute ago').textContent, '1 minute ago')
  })
})