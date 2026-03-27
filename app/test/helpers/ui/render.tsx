import * as React from 'react'
import './setup'
import {
  fireEvent,
  render as rtlRender,
  type RenderOptions,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

type UIErrorRenderOptions = Omit<RenderOptions, 'queries'>

export function render(
  element: React.ReactElement,
  options?: UIErrorRenderOptions
) {
  return rtlRender(element, options)
}

export function createUserEvent() {
  return userEvent.setup()
}

export { fireEvent, screen, waitFor, within }
