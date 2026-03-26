# Testing Library Adoption Checklist

This document tracks the incremental rollout of `@testing-library` for UI
component tests in GitHub Desktop.

## Goals

- [ ] Add a supported path for DOM-based component tests without replacing the
      existing Node.js unit test runner.
- [ ] Keep all changes compatible with the current React 16.8.4 stack.
- [ ] Make `-test.tsx` component tests discoverable through the existing
      `yarn test:unit` workflow.
- [ ] Add a reusable helper layer for Testing Library based tests.
- [ ] Land representative coverage for at least 3 presentational UI components.
- [ ] Land at least 1 moderate-complexity container or composition component if
      the helper layer proves stable.
- [ ] Document the pattern well enough that future UI tests can follow the same
      approach without re-solving setup problems.

## Non-Goals

- [ ] Do not replace `node:test` with Jest or Vitest in the first rollout.
- [ ] Do not migrate existing non-UI unit tests unless a helper refactor makes
      that necessary.
- [ ] Do not attempt broad integration coverage of `app.tsx`, sign-in flows, or
      Electron-heavy top-level surfaces in the first pass.
- [ ] Do not mass-convert the UI test surface in one change.

## Current Baseline

- [x] Confirmed the unit test runner is the Node.js built-in test runner via
      [script/test.mjs](script/test.mjs).
- [x] Confirmed jsdom is already registered globally via
      [app/test/globals.mts](app/test/globals.mts).
- [x] Confirmed the repo currently has no `@testing-library/react`,
      `@testing-library/dom`, or `@testing-library/user-event` dependency.
- [x] Confirmed the repo currently has no existing `*-test.tsx` UI component
      tests under [app/test/unit](app/test/unit).
- [x] Confirmed directory-based test discovery currently misses `-test.tsx`
      files in [script/test.mjs](script/test.mjs).
- [x] Confirmed existing unit tests already use Node mock timers, which gives a
      path to deterministic timer-based component tests.

## Decisions

- [x] Keep the existing test runner centered on
      [script/test.mjs](script/test.mjs).
- [x] Reuse the existing jsdom setup in
      [app/test/globals.mts](app/test/globals.mts).
- [x] Adopt Testing Library incrementally, beginning with low-coupling,
      presentational components.
- [x] Treat TSX test discovery as required harness work, not optional cleanup.
- [ ] Pin a compatible `@testing-library/react` version for React 16.8.4.
- [ ] Decide whether global DOM cleanup should live in
      [app/test/globals.mts](app/test/globals.mts) or in a dedicated helper.
- [ ] Decide whether `@testing-library/dom` adds enough value to justify a
      separate dependency beyond what `@testing-library/react` already exposes.
- [ ] Decide whether `@testing-library/jest-dom` should be skipped entirely to
      keep assertions aligned with `node:assert`.

## Phases

### Phase 0: Tracking and Baseline

- [x] Create this checklist file.
- [x] Record the current test runner, jsdom status, dependency gaps, and TSX
      discovery gap.
- [x] Record the proposed rollout order and commit strategy.
- [ ] Keep this document updated after every meaningful implementation commit.

### Phase 1: Harness Preparation

- [ ] Update [script/test.mjs](script/test.mjs) so directory-based discovery
      includes `-test.tsx` and `-test.jsx`.
- [ ] Preserve support for the currently discovered test extensions.
- [ ] Verify explicit file execution still works for TSX test files.
- [ ] Evaluate whether any globals or module mocks in
      [app/test/globals.mts](app/test/globals.mts) need to expand for early UI
      tests.
- [ ] Add DOM cleanup in the least invasive place that still guarantees test
      isolation.
- [ ] Verify the runner does not hang when UI tests mount timer-driven
      components.

### Phase 2: Dependency Setup

- [ ] Add a React-16-compatible `@testing-library/react` dependency in
      [package.json](package.json).
- [ ] Add `@testing-library/user-event` in [package.json](package.json).
- [ ] Add `@testing-library/dom` only if direct usage proves necessary.
- [ ] Update [yarn.lock](yarn.lock).
- [ ] Verify install and type resolution through the existing TypeScript test
      execution path.

### Phase 3: Shared Test Helpers

- [ ] Create a shared helper area under
      [app/test/helpers](app/test/helpers) for UI test utilities.
- [ ] Add a common render helper that wraps Testing Library `render()`.
- [ ] Add a common `userEvent` setup helper if repeated configuration appears.
- [ ] Add a pattern for targeted Electron mocks instead of over-expanding the
      global Electron mock.
- [ ] Add timer helper utilities only if repetition appears across multiple
      tests.
- [ ] Document the preferred helper import path in this file.

### Phase 4: Pilot Presentational Components

#### RelativeTime

- [ ] Add a UI test file for [app/src/ui/relative-time.tsx](app/src/ui/relative-time.tsx).
- [ ] Cover the default tooltip-enabled path.
- [ ] Cover the `tooltip={false}` path.
- [ ] Cover relative text for recent timestamps.
- [ ] Cover future or date-boundary behavior if practical.
- [ ] Cover timer-driven refresh behavior with mock timers.
- [ ] Cover prop updates when `date` changes.

#### TabBarItem

- [ ] Add a UI test file for [app/src/ui/tab-bar-item.tsx](app/src/ui/tab-bar-item.tsx).
- [ ] Cover click behavior.
- [ ] Cover `onMouseEnter` and `onMouseLeave` behavior.
- [ ] Cover horizontal keyboard navigation.
- [ ] Cover vertical keyboard navigation.
- [ ] Assert `role`, `aria-selected`, and `tabIndex` behavior.

#### CopyButton

- [ ] Add a UI test file for [app/src/ui/copy-button.tsx](app/src/ui/copy-button.tsx).
- [ ] Add a targeted mock for `clipboard.writeText`.
- [ ] Cover click-to-copy behavior.
- [ ] Cover the temporary copied state.
- [ ] Cover the state reset after the async delay.
- [ ] Assert the aria-live announcement behavior at least once.

### Phase 5: Data-Driven UI Components

#### RepositoryListItem

- [ ] Add a UI test file for
      [app/src/ui/repositories-list/repository-list-item.tsx](app/src/ui/repositories-list/repository-list-item.tsx).
- [ ] Add minimal fixture creation for `Repository`-backed props.
- [ ] Cover name rendering without alias.
- [ ] Cover alias rendering.
- [ ] Cover owner prefix rendering when disambiguation is enabled.
- [ ] Cover ahead and behind indicator combinations.
- [ ] Cover changed-files indicator rendering.
- [ ] Cover tooltip content rendering.
- [ ] Decide whether feature-flag behavior for accessible tooltips requires a
      deterministic test double.

- [ ] Evaluate one more data-driven, mostly presentational component after the
      repository list item lands cleanly.

### Phase 6: First Moderate Container

- [ ] Choose one moderate container or composition component after the helper
      layer and pilot tests are stable.
- [ ] Prefer a component with prop-driven callbacks over one tightly coupled to
      AppStore subscriptions, IPC, or authentication flows.
- [ ] Reuse [app/test/helpers/in-memory-dispatcher.ts](app/test/helpers/in-memory-dispatcher.ts)
      if dispatcher-driven props are needed.
- [ ] Avoid introducing new store or dispatcher doubles unless existing helpers
      are clearly insufficient.
- [ ] Cover user-visible behavior instead of implementation details.

### Phase 7: Documentation and Rollout Quality

- [ ] Decide whether this checklist is sufficient or whether a stable guide
      should be added under [docs/technical](docs/technical).
- [ ] Document where UI tests live and how to run them.
- [ ] Document how to add shared helpers and targeted Electron mocks.
- [ ] Document the preferred timer pattern for timer-driven components.
- [ ] Document the test file naming and discovery rule so TSX support does not
      regress.
- [ ] Run focused UI test files individually.
- [ ] Run the UI test directory target once TSX discovery is in place.
- [ ] Run the full unit test suite.
- [ ] Run linting for all touched files.
- [ ] Confirm no lingering DOM or timer state causes hangs.

## Candidate Rollout Order

- [x] `RelativeTime`
- [x] `TabBarItem`
- [x] `CopyButton`
- [x] `RepositoryListItem`
- [ ] One moderate container after the helper layer proves stable.

## Recommended File Layout

- [ ] Use [app/test/unit](app/test/unit) as the base test tree.
- [ ] Create a dedicated UI subdirectory such as `app/test/unit/ui` when the
      first TSX tests land.
- [ ] Place shared UI helpers under `app/test/helpers/ui` if that directory is
      needed.
- [ ] Keep production component changes minimal and only refactor when testing
      reveals a real seam problem.

## Verification Checklist

- [ ] `yarn test:unit`
- [ ] `yarn test:unit app/test/unit/ui`
- [ ] Focused direct run of each new TSX test file.
- [ ] `yarn lint:src`

## Commit Plan

- [x] `docs(test): add testing-library adoption checklist`
- [ ] `test(ui): enable testing-library component test discovery`
- [ ] `test(ui): add shared testing-library helpers`
- [ ] `test(ui): cover relative-time with testing-library`
- [ ] `test(ui): cover tab-bar-item keyboard behavior`
- [ ] `test(ui): cover copy-button clipboard feedback`
- [ ] `test(ui): cover repository list item rendering states`
- [ ] `test(ui): add first container-level testing-library coverage`
- [ ] `docs(test): document ui component testing pattern`

## Commit Log

- [ ] Commit 1: add the checklist document.
- [ ] Commit 2: land runner and discovery changes.
- [ ] Commit 3: land shared Testing Library helpers.
- [ ] Commit 4: land the `RelativeTime` tests.
- [ ] Commit 5: land the `TabBarItem` tests.
- [ ] Commit 6: land the `CopyButton` tests.
- [ ] Commit 7: land the `RepositoryListItem` tests.
- [ ] Commit 8: land the first container-level test.
- [ ] Commit 9: land follow-up documentation if still needed.

## Risks and Notes

- [ ] React 16.8.4 compatibility must be validated before choosing the final
      Testing Library version.
- [ ] The `node:test` runner plus jsdom setup should be retained unless a hard
      limitation is found during pilot tests.
- [ ] Tooltip behavior may require deterministic mocks or test-friendly query
      strategies.
- [ ] Timer-driven components should use Node mock timers to avoid flakiness.
- [ ] Electron-heavy components should be deferred until the helper patterns are
      stable.