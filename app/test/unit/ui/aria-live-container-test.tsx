import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import * as React from 'react'
import { act } from 'react-dom/test-utils'

import { AriaLiveContainer } from '../../../src/ui/accessibility/aria-live-container'
import {
  advanceTimersBy,
  enableTestTimers,
  resetTestTimers,
} from '../../helpers/ui/timers'
import { render } from '../../helpers/ui/render'

describe('AriaLiveContainer', () => {
  beforeEach(() => {
    enableTestTimers(['Date', 'setTimeout'])
  })

  afterEach(() => {
    resetTestTimers()
  })

  it('renders a polite live region with the provided id and message', () => {
    const view = render(
      <AriaLiveContainer id="branch-status" message="3 branches found" />
    )

    const container = view.container.querySelector('#branch-status.sr-only')

    assert.notEqual(container, null)
    assert.equal(container?.getAttribute('aria-live'), 'polite')
    assert.equal(container?.getAttribute('aria-atomic'), 'true')
    assert.equal(container?.textContent, '3 branches found')

    view.rerender(<AriaLiveContainer id="branch-status" message={null} />)

    assert.equal(container?.textContent, '')
  })

  it('rebuilds the message after tracked user input changes', () => {
    const liveRegionRef = React.createRef<AriaLiveContainer>()
    const view = render(
      <AriaLiveContainer
        ref={liveRegionRef}
        message="1 result"
        trackedUserInput="m"
      />
    )

    const container = view.container.querySelector('.sr-only')
    const initialMessage = liveRegionRef.current?.state.message

    view.rerender(
      <AriaLiveContainer
        ref={liveRegionRef}
        message="1 result"
        trackedUserInput="ma"
      />
    )

    assert.equal(liveRegionRef.current?.state.message, initialMessage)

    act(() => {
      advanceTimersBy(1001)
    })

    const updatedMessage = liveRegionRef.current?.state.message
    const updatedText = container?.textContent ?? ''

    assert.notEqual(updatedMessage, initialMessage)
    assert.ok(updatedText.startsWith('1 result'))
  })
})
