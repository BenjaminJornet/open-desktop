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

type UIErrorRenderOptions = Omit<RenderOptions, 'queries'>

export function render(
  element: React.ReactElement,
  options?: UIErrorRenderOptions
) {
  return rtlRender(element, options)
}

export { fireEvent, screen, waitFor, within }
