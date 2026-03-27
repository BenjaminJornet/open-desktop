# Testing Library Adoption Checklist

This document tracks the incremental rollout of `@testing-library` for UI
component tests in GitHub Desktop.

## Goals

- [x] Add a supported path for DOM-based component tests without replacing the
      existing Node.js unit test runner.
- [x] Keep all changes compatible with the current React 16.8.4 stack.
- [x] Make `-test.tsx` component tests discoverable through the existing
      `yarn test:unit` workflow.
- [x] Add a reusable helper layer for Testing Library based tests.
- [x] Land representative coverage for at least 3 presentational UI components.
- [x] Land at least 1 moderate-complexity container or composition component if
      the helper layer proves stable.
- [x] Document the pattern well enough that future UI tests can follow the same
      approach without re-solving setup problems.

## Non-Goals

- [x] Do not replace `node:test` with Jest or Vitest in the first rollout.
- [x] Do not migrate existing non-UI unit tests unless a helper refactor makes
      that necessary.
- [x] Do not attempt broad integration coverage of `app.tsx`, sign-in flows, or
      Electron-heavy top-level surfaces in the first pass.
- [x] Do not mass-convert the UI test surface in one change.

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
- [x] Pin a compatible `@testing-library/react` version for React 16.8.4.
- [x] Decide whether global DOM cleanup should live in
      [app/test/globals.mts](app/test/globals.mts) or in a dedicated helper.
- [x] Scope DOM cleanup to the Testing Library helper path rather than the
      global test bootstrap so existing non-UI tests are unaffected.
- [x] Keep Testing Library dependencies in [app/package.json](app/package.json)
      and [app/yarn.lock](app/yarn.lock) so they resolve against the same React
      installation as the UI code under `app/`.
- [x] Add `@testing-library/dom` directly because it is a peer dependency of
      `@testing-library/user-event` and part of the shared helper surface.
- [x] Decide whether `@testing-library/jest-dom` should be skipped entirely to
      keep assertions aligned with `node:assert`.

- [x] Skip `@testing-library/jest-dom` for this rollout. DOM assertions remain
      explicit through `node:assert`, DOM APIs, and Testing Library queries.

## Phases

### Phase 0: Tracking and Baseline

- [x] Create this checklist file.
- [x] Record the current test runner, jsdom status, dependency gaps, and TSX
      discovery gap.
- [x] Record the proposed rollout order and commit strategy.
- [x] Keep this document updated after every meaningful implementation commit.

### Phase 1: Harness Preparation

- [x] Update [script/test.mjs](script/test.mjs) so directory-based discovery
      includes `-test.tsx` and `-test.jsx`.
- [x] Preserve support for the currently discovered test extensions.
- [x] Verify explicit file execution still works for TSX test files.
- [x] Evaluate whether any globals or module mocks in
      [app/test/globals.mts](app/test/globals.mts) need to expand for early UI
      tests.
- [x] Add DOM cleanup in the least invasive place that still guarantees test
      isolation.
- [x] Verify the runner does not hang when UI tests mount timer-driven
      components.

### Phase 2: Dependency Setup

- [x] Add a React-16-compatible `@testing-library/react` dependency in
      [app/package.json](app/package.json).
- [x] Add `@testing-library/user-event` in [app/package.json](app/package.json).
- [x] Add `@testing-library/dom` in [app/package.json](app/package.json).
- [x] Update [app/yarn.lock](app/yarn.lock).
- [x] Verify install and type resolution through the existing TypeScript test
      execution path.

### Phase 3: Shared Test Helpers

- [x] Create a shared helper area under
      [app/test/helpers](app/test/helpers) for UI test utilities.
- [x] Add a common render helper that wraps Testing Library `render()`.
- [x] Add a common `userEvent` setup helper if repeated configuration appears.
- [x] Add a pattern for targeted Electron mocks instead of over-expanding the
      global Electron mock.
- [x] Add timer helper utilities only if repetition appears across multiple
      tests.
- [x] Document the preferred helper import path in this file.

### Phase 4: Pilot Presentational Components

#### RelativeTime

- [x] Add a UI test file for [app/src/ui/relative-time.tsx](app/src/ui/relative-time.tsx).
- [x] Cover the default tooltip-enabled path.
- [x] Cover the `tooltip={false}` path.
- [x] Cover relative text for recent timestamps.
- [x] Cover future or date-boundary behavior if practical.
- [x] Cover timer-driven refresh behavior with mock timers.
- [x] Cover prop updates when `date` changes.

#### TabBarItem

- [x] Add a UI test file for [app/src/ui/tab-bar-item.tsx](app/src/ui/tab-bar-item.tsx).
- [x] Cover click behavior.
- [x] Cover `onMouseEnter` and `onMouseLeave` behavior.
- [x] Cover horizontal keyboard navigation.
- [x] Cover vertical keyboard navigation.
- [x] Assert `role`, `aria-selected`, and `tabIndex` behavior.

#### CopyButton

- [x] Add a UI test file for [app/src/ui/copy-button.tsx](app/src/ui/copy-button.tsx).
- [x] Add a targeted mock for `clipboard.writeText`.
- [x] Cover click-to-copy behavior.
- [x] Cover the temporary copied state.
- [x] Cover the state reset after the async delay.
- [x] Assert the aria-live announcement behavior at least once.

### Phase 5: Data-Driven UI Components

#### RepositoryListItem

- [x] Add a UI test file for
      [app/src/ui/repositories-list/repository-list-item.tsx](app/src/ui/repositories-list/repository-list-item.tsx).
- [x] Add minimal fixture creation for `Repository`-backed props.
- [x] Cover name rendering without alias.
- [x] Cover alias rendering.
- [x] Cover owner prefix rendering when disambiguation is enabled.
- [x] Cover ahead and behind indicator combinations.
- [x] Cover changed-files indicator rendering.
- [x] Cover tooltip content rendering.
- [x] Decide whether feature-flag behavior for accessible tooltips requires a
      deterministic test double.

- [x] Current tests do not need a dedicated feature-flag test double because
      `enableAccessibleListToolTips()` resolves to `false` under the shared
      test bootstrap (`__DEV__ === false`, release channel `development`).

- [x] Evaluate one more data-driven, mostly presentational component after the
      repository list item lands cleanly.

#### BranchListItem Follow-up

- [x] Add a UI test file for [app/src/ui/branches/branch-list-item.tsx](app/src/ui/branches/branch-list-item.tsx).
- [x] Cover relative-time rendering for the author date.
- [x] Cover commit drag/drop callbacks for current and non-current branches.

### Phase 6: First Moderate Container

- [x] Choose one moderate container or composition component after the helper
      layer and pilot tests are stable.
- [x] Prefer a component with prop-driven callbacks over one tightly coupled to
      AppStore subscriptions, IPC, or authentication flows.
- [x] Reuse [app/test/helpers/in-memory-dispatcher.ts](app/test/helpers/in-memory-dispatcher.ts)
      if dispatcher-driven props are needed.
- [x] Avoid introducing new store or dispatcher doubles unless existing helpers
      are clearly insufficient.
- [x] Cover user-visible behavior instead of implementation details.

- [x] Chose [app/src/ui/tab-bar.tsx](app/src/ui/tab-bar.tsx) as the first
      moderate composition component because it is prop-driven and exercises
      focus management plus drag-over switching without new store doubles.

### Phase 7: Documentation and Rollout Quality

- [x] Decide whether this checklist is sufficient or whether a stable guide
      should be added under [docs/technical](docs/technical).
- [x] Document where UI tests live and how to run them.
- [x] Document how to add shared helpers and targeted Electron mocks.
- [x] Document the preferred timer pattern for timer-driven components.
- [x] Document the test file naming and discovery rule so TSX support does not
      regress.
- [x] Run focused UI test files individually.
- [x] Run the UI test directory target once TSX discovery is in place.
- [x] Run the full unit test suite.
- [x] Run linting for all touched files.
- [x] Confirm no lingering DOM or timer state causes hangs.

## Candidate Rollout Order

- [x] `RelativeTime`
- [x] `TabBarItem`
- [x] `CopyButton`
- [x] `RepositoryListItem`
- [x] One moderate container after the helper layer proves stable.

## Candidate Inventory

These are good follow-up targets for future Testing Library coverage. They are
inventory, not remaining rollout tasks for this adoption pass.

### Smallest Components

- [app/src/ui/lib/loading.tsx](app/src/ui/lib/loading.tsx): tiny loading
      indicator component with deterministic DOM output.
- [app/src/ui/lib/horizontal-rule.tsx](app/src/ui/lib/horizontal-rule.tsx):
      minimal structural component suited to smoke-level rendering assertions.
- [app/src/ui/lib/ref.tsx](app/src/ui/lib/ref.tsx): tiny ref-forwarding helper
      component that is useful for focused render and children assertions.
- [app/src/ui/toolbar/toolbar.tsx](app/src/ui/toolbar/toolbar.tsx): compact
      wrapper component with simple structural and children rendering behavior.
- [app/src/ui/dialog/error.tsx](app/src/ui/dialog/error.tsx): static inline
      banner with `role="alert"`; good for a minimal accessibility assertion.
- [app/src/ui/dialog/success.tsx](app/src/ui/dialog/success.tsx):
      success-banner sibling to `DialogError`; same low-cost test surface.
- [app/src/ui/diff/image-diffs/new-image-diff.tsx](app/src/ui/diff/image-diffs/new-image-diff.tsx):
      small image-diff state component with stable text and layout.
- [app/src/ui/lib/errors.tsx](app/src/ui/lib/errors.tsx): compact error message
      rendering component with deterministic copy.
- [app/src/ui/changes/files-changed-badge.tsx](app/src/ui/changes/files-changed-badge.tsx):
      tiny badge component with stable count-driven output.
- [app/src/ui/lib/input-description/input-caption.tsx](app/src/ui/lib/input-description/input-caption.tsx):
      very small form-caption component with predictable text rendering.
- [app/src/ui/lib/input-description/input-error.tsx](app/src/ui/lib/input-description/input-error.tsx):
      very small form-error component with stable semantics.
- [app/src/ui/lib/input-description/input-warning.tsx](app/src/ui/lib/input-description/input-warning.tsx):
      very small form-warning component with stable semantics.
- [app/src/ui/banners/cherry-pick-undone.tsx](app/src/ui/banners/cherry-pick-undone.tsx):
      compact banner component with fixed messaging and action affordances.
- [app/src/ui/diff/image-diffs/deleted-image-diff.tsx](app/src/ui/diff/image-diffs/deleted-image-diff.tsx):
      small image-diff state component paired with the new-image variant.
- [app/src/ui/repository-rules/repo-ruleset-link.tsx](app/src/ui/repository-rules/repo-ruleset-link.tsx):
      tiny link-style component with stable URL and label rendering.
- [app/src/ui/banners/successful-cherry-pick.tsx](app/src/ui/banners/successful-cherry-pick.tsx):
      compact success banner with predictable messaging and action callbacks.
- [app/src/ui/banners/successful-merge.tsx](app/src/ui/banners/successful-merge.tsx):
      small banner variant with stable success copy.
- [app/src/ui/banners/successful-rebase.tsx](app/src/ui/banners/successful-rebase.tsx):
      small banner variant with deterministic text and actions.
- [app/src/ui/lib/call-to-action.tsx](app/src/ui/lib/call-to-action.tsx):
      concise composition component with visible content plus a button callback.
- [app/src/ui/welcome/configure-git.tsx](app/src/ui/welcome/configure-git.tsx):
      small welcome-step wrapper with a bounded cancel flow.
- [app/src/ui/dialog/footer.tsx](app/src/ui/dialog/footer.tsx): simple
      composition wrapper; useful for documenting children-based render
      assertions.
- [app/src/ui/dialog/content.tsx](app/src/ui/dialog/content.tsx): another very
      small structural wrapper suited to smoke-level render tests.
- [app/src/ui/dialog/header.tsx](app/src/ui/dialog/header.tsx): small header
      component with title/description semantics.
- [app/src/ui/dialog/default-dialog-footer.tsx](app/src/ui/dialog/default-dialog-footer.tsx):
      small button-group composition component with stable visible output.
- [app/src/ui/lib/highlight-text.tsx](app/src/ui/lib/highlight-text.tsx): pure
      render helper with deterministic markup (`mark` vs `span`).
- [app/src/ui/lib/button.tsx](app/src/ui/lib/button.tsx): foundational button
      wrapper with tooltip wiring, aria props, and click behavior.
- [app/src/ui/app-menu/menu-list-item.tsx](app/src/ui/app-menu/menu-list-item.tsx):
      compact interactive row component with selection and keyboard behavior.

### Small Presentational Components

- [app/src/ui/changes/multiple-selection.tsx](app/src/ui/changes/multiple-selection.tsx):
      concise selection-state component with stable text output.
- [app/src/ui/lib/row.tsx](app/src/ui/lib/row.tsx): small layout component
      suited to structural and class-based assertions.
- [app/src/ui/banners/successful-squash.tsx](app/src/ui/banners/successful-squash.tsx):
      compact status banner with predictable visible text.
- [app/src/ui/keyboard-shortcut/keyboard-shortcut.tsx](app/src/ui/keyboard-shortcut/keyboard-shortcut.tsx):
      small rendering component with deterministic keycap output.
- [app/src/ui/diff/binary-file.tsx](app/src/ui/diff/binary-file.tsx):
      compact diff surface with a single open-file action.
- [app/src/ui/tutorial/confirm-exit-tutorial.tsx](app/src/ui/tutorial/confirm-exit-tutorial.tsx):
      bounded confirmation dialog with predictable submit and dismiss paths.
- [app/src/ui/open-pull-request/pull-request-merge-status.tsx](app/src/ui/open-pull-request/pull-request-merge-status.tsx):
      small state-description component with finite rendering branches.
- [app/src/ui/lib/avatar-stack.tsx](app/src/ui/lib/avatar-stack.tsx):
      small compositional component with threshold-driven avatar rendering.
- [app/src/ui/branches/branch-list-item.tsx](app/src/ui/branches/branch-list-item.tsx):
      branch row with current-branch state, relative time, and drag/drop
      affordances.
- [app/src/ui/history/compare-branch-list-item.tsx](app/src/ui/history/compare-branch-list-item.tsx):
      small branch comparison renderer with status-driven output.
- [app/src/ui/branches/pull-request-list-item.tsx](app/src/ui/branches/pull-request-list-item.tsx):
      mostly prop-driven pull request row rendering.
- [app/src/ui/history/commit-list-item.tsx](app/src/ui/history/commit-list-item.tsx):
      commit row with relative time, selection, and rich text fragments.
- [app/src/ui/check-runs/ci-check-run-actions-job-step-item.tsx](app/src/ui/check-runs/ci-check-run-actions-job-step-item.tsx):
      compact list item with deterministic text and icon states.
- [app/src/ui/check-runs/ci-check-run-list-item.tsx](app/src/ui/check-runs/ci-check-run-list-item.tsx):
      richer data-driven row once list-item test patterns are mature.
- [app/src/ui/lib/list/list-item-insertion-overlay.tsx](app/src/ui/lib/list/list-item-insertion-overlay.tsx):
      tiny visual-state component with CSS-class assertions.

### Composition and Moderate Containers

- [app/src/ui/tab-bar.tsx](app/src/ui/tab-bar.tsx): moderate composition
      component that manages focus, adjacent selection, and drag-over switching.
- [app/src/ui/dialog/dialog.tsx](app/src/ui/dialog/dialog.tsx): reusable
      dialog container with focus and portal behavior once the helper layer is
      mature enough.
- [app/src/ui/suggested-actions/suggested-action.tsx](app/src/ui/suggested-actions/suggested-action.tsx):
      prop-driven action panel with optional description, image, and button.
- [app/src/ui/lib/link-button.tsx](app/src/ui/lib/link-button.tsx): shared
      interactive control with click behavior, external-link behavior, and
      tooltip wiring.
- [app/src/ui/check-runs/ci-check-re-run-button.tsx](app/src/ui/check-runs/ci-check-re-run-button.tsx):
      moderate action component with conditional menu behavior.
- [app/src/ui/diff/diff-header.tsx](app/src/ui/diff/diff-header.tsx):
      moderate composition component for path display and diff actions.
- [app/src/ui/lib/vertical-segmented-control/vertical-segmented-control.tsx](app/src/ui/lib/vertical-segmented-control/vertical-segmented-control.tsx):
      moderate compositional control with keyboard and selection behavior.
- [app/src/ui/banners/banner.tsx](app/src/ui/banners/banner.tsx): reusable
      banner base component with focus management and dismissal timing.
- [app/src/ui/preferences/custom-integration-form.tsx](app/src/ui/preferences/custom-integration-form.tsx):
      bounded form component with controlled input behavior.
- [app/src/ui/repositories-list/repositories-list.tsx](app/src/ui/repositories-list/repositories-list.tsx):
      container-level candidate for filtering and grouped rendering behavior.
- [app/src/ui/octicons/icon-preview-dialog.tsx](app/src/ui/octicons/icon-preview-dialog.tsx):
      small dialog composition candidate without major store coupling.

### Dialog Candidates After the First Container

- [app/src/ui/stashing/confirm-discard-stash.tsx](app/src/ui/stashing/confirm-discard-stash.tsx):
      compact confirm dialog with predictable button text.
- [app/src/ui/checkout/confirm-checkout-commit.tsx](app/src/ui/checkout/confirm-checkout-commit.tsx):
      similarly bounded confirmation dialog.
- [app/src/ui/discard-changes/discard-changes-retry-dialog.tsx](app/src/ui/discard-changes/discard-changes-retry-dialog.tsx):
      small retry dialog with inline message assertions.
- [app/src/ui/local-changes-overwritten/local-changes-overwritten-dialog.tsx](app/src/ui/local-changes-overwritten/local-changes-overwritten-dialog.tsx):
      another bounded dialog candidate once dialog helpers are established.

## Recommended File Layout

- [x] Use [app/test/unit](app/test/unit) as the base test tree.
- [x] Create a dedicated UI subdirectory such as `app/test/unit/ui` when the
      first TSX tests land.
- [x] Place shared UI helpers under `app/test/helpers/ui` if that directory is
      needed.
- [x] Keep production component changes minimal and only refactor when testing
      reveals a real seam problem.

## Helper Import Path

- [x] Preferred Testing Library helper import path: `app/test/helpers/ui/render`.
- [x] The helper currently owns Testing Library cleanup through
      [app/test/helpers/ui/setup.ts](app/test/helpers/ui/setup.ts), so UI tests
      should import the shared render helper rather than `@testing-library/react`
      directly unless they have a specific reason not to.

## Verification Checklist

- [x] `yarn test:unit`
- [x] `yarn test:unit app/test/unit/ui`
- [x] Focused direct run of each new TSX test file.
- [x] Focused lint and type-check validation for the shared helper files.
- [x] `yarn lint:src`
- [x] Direct `markdownlint` validation for
      [docs/technical/testing-library-adoption-checklist.md](docs/technical/testing-library-adoption-checklist.md)
      and [docs/technical/ui-component-testing.md](docs/technical/ui-component-testing.md).

## Commit Plan

- [x] `docs(test): add testing-library adoption checklist`
- [x] `test(ui): enable testing-library component test discovery`
- [x] `test(ui): add shared testing-library helpers`
- [x] `test(ui): cover relative-time with testing-library`
- [x] `test(ui): cover tab-bar-item keyboard behavior`
- [x] `test(ui): cover copy-button clipboard feedback`
- [x] `test(ui): cover repository list item rendering states`
- [x] `test(ui): add tab-bar coverage and shared ui test utilities`
- [x] `docs(test): document ui component testing pattern`

## Commit Log

- [x] Commit 1: add the checklist document.
- [x] Commit 2: land runner and discovery changes.
- [x] Commit 3: land shared Testing Library helpers.
- [x] Commit 4: land the `RelativeTime` tests.
- [x] Commit 5: land the `TabBarItem` tests.
- [x] Commit 6: land the `CopyButton` tests.
- [x] Commit 7: land the `RepositoryListItem` tests.
- [x] Commit 8: land the first container-level test.
- [x] Commit 9: land follow-up documentation if still needed.

## Risks and Notes

- [x] React 16.8.4 compatibility must be validated before choosing the final
      Testing Library version.
- [x] The `node:test` runner plus jsdom setup should be retained unless a hard
      limitation is found during pilot tests.
- [x] Testing Library dependencies must resolve from the `app` package because
      the UI code and its React installation live there.
- [x] Tooltip behavior may require deterministic mocks or test-friendly query
      strategies.
- [x] Timer-driven components should use Node mock timers to avoid flakiness.
- [x] Tooltip-backed UI tests currently rely on the shared UI setup to provide
      a minimal `ResizeObserver` shim under jsdom.
- [x] Tooltip-backed click flows currently rely on the shared UI setup to align
      `CustomEvent` with jsdom's event implementation.
- [x] The global Electron mock now exposes a minimal `clipboard.writeText`
      implementation for UI tests that need clipboard behavior.
- [x] Electron-heavy components should be deferred until the helper patterns are
      stable.
- [x] `@testing-library/react@12.1.5` on React 16.8.4 emits the known
      non-failing warning about non-awaitable `act`; the tests still pass.
- [x] The repo-wide `yarn markdownlint` script still reports unrelated legacy
      violations outside this rollout, so the two rollout docs were validated
      directly with the local `markdownlint` binary.
