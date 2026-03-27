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

## Phase 8: Second-Wave Small Components

- [x] Add a second-wave batch focused on the smallest remaining low-coupling
      components.
- [x] Cover tiny wrapper and badge components without introducing new harness
      requirements.
- [x] Cover inline dialog status surfaces with accessibility assertions.
- [x] Cover input description wrappers, including error and warning semantics.
- [x] Keep the second wave in `app/test/unit/ui` with shared RTL helpers only.
- [x] Validate the new tests with focused runs, the UI directory target, and
      lint.

### Phase 8 Targets

- [x] [app/src/ui/lib/loading.tsx](app/src/ui/lib/loading.tsx)
- [x] [app/src/ui/lib/horizontal-rule.tsx](app/src/ui/lib/horizontal-rule.tsx)
- [x] [app/src/ui/dialog/footer.tsx](app/src/ui/dialog/footer.tsx)
- [x] [app/src/ui/lib/ref.tsx](app/src/ui/lib/ref.tsx)
- [x] [app/src/ui/toolbar/toolbar.tsx](app/src/ui/toolbar/toolbar.tsx)
- [x] [app/src/ui/changes/files-changed-badge.tsx](app/src/ui/changes/files-changed-badge.tsx)
- [x] [app/src/ui/dialog/error.tsx](app/src/ui/dialog/error.tsx)
- [x] [app/src/ui/dialog/success.tsx](app/src/ui/dialog/success.tsx)
- [x] [app/src/ui/lib/input-description/input-caption.tsx](app/src/ui/lib/input-description/input-caption.tsx)
- [x] [app/src/ui/lib/input-description/input-error.tsx](app/src/ui/lib/input-description/input-error.tsx)
- [x] [app/src/ui/lib/input-description/input-warning.tsx](app/src/ui/lib/input-description/input-warning.tsx)

## Phase 9: Third-Wave Structural and Text Components

- [x] Add a third-wave batch focused on structural wrappers and deterministic
      text-rendering components.
- [x] Cover wrapper and composition components without introducing new helper
      infrastructure.
- [x] Cover pure text and attribution surfaces with deterministic markup
      assertions.
- [x] Cover dialog header and default-footer composition behavior, including
      close and loading states.
- [x] Keep the third wave in `app/test/unit/ui` with shared RTL helpers only.
- [x] Validate the new tests with focused runs, the UI directory target, and
      lint.

### Phase 9 Targets

- [x] [app/src/ui/lib/form.tsx](app/src/ui/lib/form.tsx)
- [x] [app/src/ui/dialog/content.tsx](app/src/ui/dialog/content.tsx)
- [x] [app/src/ui/ui-view.tsx](app/src/ui/ui-view.tsx)
- [x] [app/src/ui/lib/commit-attribution.tsx](app/src/ui/lib/commit-attribution.tsx)
- [x] [app/src/ui/lib/access-text.tsx](app/src/ui/lib/access-text.tsx)
- [x] [app/src/ui/lib/highlight-text.tsx](app/src/ui/lib/highlight-text.tsx)
- [x] [app/src/ui/lib/call-to-action.tsx](app/src/ui/lib/call-to-action.tsx)
- [x] [app/src/ui/dialog/header.tsx](app/src/ui/dialog/header.tsx)
- [x] [app/src/ui/dialog/default-dialog-footer.tsx](app/src/ui/dialog/default-dialog-footer.tsx)
- [x] [app/src/ui/lib/toggle-button.tsx](app/src/ui/lib/toggle-button.tsx)

## Phase 10: Empty-State and Message Components

- [x] Add a fourth-wave batch focused on empty-state components and tiny
      message/layout surfaces.
- [x] Cover deterministic layout and message primitives without introducing
      new helper infrastructure.
- [x] Cover empty-state branching and callback flows for the branches and pull
      request placeholders.
- [x] Keep the fourth wave in `app/test/unit/ui` with shared RTL helpers only.
- [x] Validate the new tests with focused runs, the UI directory target, and
      lint.

### Phase 10 Targets

- [x] [app/src/ui/lib/row.tsx](app/src/ui/lib/row.tsx)
- [x] [app/src/ui/keyboard-shortcut/keyboard-shortcut.tsx](app/src/ui/keyboard-shortcut/keyboard-shortcut.tsx)
- [x] [app/src/ui/lib/errors.tsx](app/src/ui/lib/errors.tsx)
- [x] [app/src/ui/changes/commit-warning.tsx](app/src/ui/changes/commit-warning.tsx)
- [x] [app/src/ui/branches/no-branches.tsx](app/src/ui/branches/no-branches.tsx)
- [x] [app/src/ui/branches/no-pull-requests.tsx](app/src/ui/branches/no-pull-requests.tsx)

## Phase 11: Static Status and Small Action Surfaces

- [x] Add a fifth-wave batch focused on tiny status, link, and explanatory
      surfaces.
- [x] Cover stateless render-only components with deterministic text, class,
      and href assertions.
- [x] Cover one small action row and one simple dialog surface without adding
      new helper infrastructure.
- [x] Keep the fifth wave in `app/test/unit/ui` with shared RTL helpers only.
- [x] Validate the new tests with focused runs, the UI directory target, and
      lint.

### Phase 11 Targets

- [x] [app/src/ui/repository-rules/repo-ruleset-link.tsx](app/src/ui/repository-rules/repo-ruleset-link.tsx)
- [x] [app/src/ui/repository-settings/fork-contribution-target-description.tsx](app/src/ui/repository-settings/fork-contribution-target-description.tsx)
- [x] [app/src/ui/lib/action-status-icon.tsx](app/src/ui/lib/action-status-icon.tsx)
- [x] [app/src/ui/lib/vertical-segmented-control/segmented-item.tsx](app/src/ui/lib/vertical-segmented-control/segmented-item.tsx)
- [x] [app/src/ui/check-runs/ci-check-run-no-steps.tsx](app/src/ui/check-runs/ci-check-run-no-steps.tsx)
- [x] [app/src/ui/cli-installed/cli-installed.tsx](app/src/ui/cli-installed/cli-installed.tsx)

## Phase 12: Link, Publish, and Banner Surfaces

- [x] Add a sixth-wave batch focused on small link, publish, and banner
      surfaces.
- [x] Cover link and publish helper surfaces with deterministic href and
      callback assertions.
- [x] Cover banner family behavior including focus, dismissal, and message
      variants with timer control.
- [x] Keep the sixth wave in `app/test/unit/ui` with shared RTL helpers only.
- [x] Validate the new tests with focused runs, the UI directory target, and
      lint.

### Phase 12 Targets

- [x] [app/src/ui/repository-rules/repo-rulesets-for-branch-link.tsx](app/src/ui/repository-rules/repo-rulesets-for-branch-link.tsx)
- [x] [app/src/ui/repository-settings/no-remote.tsx](app/src/ui/repository-settings/no-remote.tsx)
- [x] [app/src/ui/banners/banner.tsx](app/src/ui/banners/banner.tsx)
- [x] [app/src/ui/banners/success-banner.tsx](app/src/ui/banners/success-banner.tsx)
- [x] [app/src/ui/banners/branch-already-up-to-date-banner.tsx](app/src/ui/banners/branch-already-up-to-date-banner.tsx)
- [x] [app/src/ui/banners/cherry-pick-undone.tsx](app/src/ui/banners/cherry-pick-undone.tsx)

## Phase 13: Visual and Warning Helper Surfaces

- [x] Add a seventh-wave batch focused on visual helper components and warning
      render surfaces.
- [x] Cover tiny visual components with deterministic DOM, class, and wrapper
      assertions.
- [x] Cover branch warning and email-attribution warning surfaces with
      realistic model fixtures.
- [x] Keep the seventh wave in `app/test/unit/ui` with shared RTL helpers
      only.
- [x] Validate the new tests with focused runs, the UI directory target, and
      lint.

### Phase 13 Targets

- [x] [app/src/ui/octicons/octicon.tsx](app/src/ui/octicons/octicon.tsx)
- [x] [app/src/ui/donut.tsx](app/src/ui/donut.tsx)
- [x] [app/src/ui/lib/branch-name-warnings.tsx](app/src/ui/lib/branch-name-warnings.tsx)
- [x] [app/src/ui/lib/git-email-not-found-warning.tsx](app/src/ui/lib/git-email-not-found-warning.tsx)

## Phase 14: Control Primitives and Live Regions

- [x] Add an eighth-wave batch focused on shared control primitives and the
      aria-live helper.
- [x] Cover deterministic button, checkbox, radio, and select behavior without
      tooltip-specific wiring.
- [x] Cover the live-region helper with direct message and tracked-input
      reread behavior.
- [x] Keep the eighth wave in `app/test/unit/ui` with shared RTL helpers and
      existing timer helpers only.
- [x] Validate the new tests with focused runs, the UI directory target, and
      lint.

### Phase 14 Targets

- [x] [app/src/ui/lib/button.tsx](app/src/ui/lib/button.tsx)
- [x] [app/src/ui/lib/checkbox.tsx](app/src/ui/lib/checkbox.tsx)
- [x] [app/src/ui/lib/radio-button.tsx](app/src/ui/lib/radio-button.tsx)
- [x] [app/src/ui/lib/radio-group.tsx](app/src/ui/lib/radio-group.tsx)
- [x] [app/src/ui/lib/select.tsx](app/src/ui/lib/select.tsx)
- [x] [app/src/ui/accessibility/aria-live-container.tsx](app/src/ui/accessibility/aria-live-container.tsx)

## Phase 15: Text Entry and Description Surfaces

- [x] Add a ninth-wave batch focused on shared text-entry controls and the
      base input-description surface.
- [x] Cover textarea and input-description behavior with deterministic DOM,
      role, and callback assertions.
- [x] Cover text-box search, clear, and keyboard behavior without introducing
      new global mocks.
- [x] Keep the ninth wave in `app/test/unit/ui` with shared RTL helpers and
      existing timer helpers only.
- [x] Validate the new tests with focused runs, the UI directory target, and
      lint.

### Phase 15 Targets

- [x] [app/src/ui/lib/input-description/input-description.tsx](app/src/ui/lib/input-description/input-description.tsx)
- [x] [app/src/ui/lib/text-area.tsx](app/src/ui/lib/text-area.tsx)
- [x] [app/src/ui/lib/text-box.tsx](app/src/ui/lib/text-box.tsx)

## Phase 16: Path and Helper Surfaces

- [x] Add a tenth-wave batch focused on small path-display surfaces and a pair
      of low-coupling helper components.
- [x] Cover static path and empty-selection surfaces with deterministic DOM and
      copy assertions.
- [x] Cover theme and config-lock helper behavior with targeted side-effect
      assertions only.
- [x] Keep the tenth wave in `app/test/unit/ui` with shared RTL helpers and
      narrow local mocks only.
- [x] Validate the new tests with focused runs, the UI directory target, and
      lint.

### Phase 16 Targets

- [x] [app/src/ui/lib/path-label.tsx](app/src/ui/lib/path-label.tsx)
- [x] [app/src/ui/changes/multiple-selection.tsx](app/src/ui/changes/multiple-selection.tsx)
- [x] [app/src/ui/app-theme.tsx](app/src/ui/app-theme.tsx)
- [x] [app/src/ui/lib/config-lock-file-exists.tsx](app/src/ui/lib/config-lock-file-exists.tsx)

## Phase 17: Path Text and Link Helpers

- [x] Add an eleventh-wave batch focused on small path-text and link-oriented
      helper surfaces.
- [x] Cover path-text rendering and exported truncation helpers with
      deterministic assertions.
- [x] Cover link-button and password-text-box behavior with targeted click,
      role, and focus assertions.
- [x] Keep the eleventh wave in `app/test/unit/ui` with shared RTL helpers and
      narrow local mocks only.
- [x] Validate the new tests with focused runs, the UI directory target, and
      lint.

### Phase 17 Targets

- [x] [app/src/ui/lib/path-text.tsx](app/src/ui/lib/path-text.tsx)
- [x] [app/src/ui/lib/link-button.tsx](app/src/ui/lib/link-button.tsx)
- [x] [app/src/ui/lib/password-text-box.tsx](app/src/ui/lib/password-text-box.tsx)

## Phase 18: Dialog Action Wrappers

- [x] Add a twelfth-wave batch focused on small dialog wrapper and button-group
      surfaces.
- [x] Cover dialog content and footer wrappers with deterministic structure,
      class, and ref assertions.
- [x] Cover ok-cancel button-group behavior with platform order, button type,
      and destructive submit or reset dispatch assertions.
- [x] Keep the twelfth wave in `app/test/unit/ui` with shared RTL helpers and
      narrow DOM listeners only.
- [x] Validate the new tests with focused runs, the UI directory target, and
      lint.

### Phase 18 Targets

- [x] [app/src/ui/dialog/content.tsx](app/src/ui/dialog/content.tsx)
- [x] [app/src/ui/dialog/footer.tsx](app/src/ui/dialog/footer.tsx)
- [x] [app/src/ui/dialog/ok-cancel-button-group.tsx](app/src/ui/dialog/ok-cancel-button-group.tsx)

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
- [app/src/ui/lib/form.tsx](app/src/ui/lib/form.tsx): tiny form wrapper with
      straightforward submit behavior.
- [app/src/ui/cli-installed/cli-installed.tsx](app/src/ui/cli-installed/cli-installed.tsx):
      compact installed-success dialog with fixed copy.
- [app/src/ui/lib/vertical-segmented-control/segmented-item.tsx](app/src/ui/lib/vertical-segmented-control/segmented-item.tsx):
      minimal segmented item renderer with simple selected-state output.
- [app/src/ui/lib/access-text.tsx](app/src/ui/lib/access-text.tsx): tiny text
      renderer for access-key highlighting with deterministic markup.
- [app/src/ui/lib/path-label.tsx](app/src/ui/lib/path-label.tsx): compact path
      display component with bounded truncation behavior.
- [app/src/ui/lib/action-status-icon.tsx](app/src/ui/lib/action-status-icon.tsx):
      tiny icon renderer mapping status values to stable output.
- [app/src/ui/lib/git-email-not-found-warning.tsx](app/src/ui/lib/git-email-not-found-warning.tsx):
      very small warning surface with deterministic text.
- [app/src/ui/ui-view.tsx](app/src/ui/ui-view.tsx): lightweight layout shell
      for cloning and repository views.
- [app/src/ui/banners/os-version-no-longer-supported-banner.tsx](app/src/ui/banners/os-version-no-longer-supported-banner.tsx):
      dismissible warning banner with a bounded help-link flow.
- [app/src/ui/check-runs/ci-check-run-no-steps.tsx](app/src/ui/check-runs/ci-check-run-no-steps.tsx):
      compact empty-state row with open-details behavior.
- [app/src/ui/banners/branch-already-up-to-date-banner.tsx](app/src/ui/banners/branch-already-up-to-date-banner.tsx):
      narrow status banner with simple branch-name interpolation.
- [app/src/ui/repository-settings/fork-contribution-target-description.tsx](app/src/ui/repository-settings/fork-contribution-target-description.tsx):
      short explanatory text surface with a GitHub link.
- [app/src/ui/cloning-repository.tsx](app/src/ui/cloning-repository.tsx):
      compact cloning progress and status view.
- [app/src/ui/welcome/sign-in-enterprise.tsx](app/src/ui/welcome/sign-in-enterprise.tsx):
      small enterprise sign-in CTA surface.
- [app/src/ui/banners/successful-cherry-pick.tsx](app/src/ui/banners/successful-cherry-pick.tsx):
      compact success banner with predictable messaging and action callbacks.
- [app/src/ui/banners/successful-merge.tsx](app/src/ui/banners/successful-merge.tsx):
      small banner variant with stable success copy.
- [app/src/ui/banners/successful-rebase.tsx](app/src/ui/banners/successful-rebase.tsx):
      small banner variant with deterministic text and actions.
- [app/src/ui/banners/merge-conflicts-banner.tsx](app/src/ui/banners/merge-conflicts-banner.tsx):
      compact conflicts banner with a reopen action.
- [app/src/ui/diff/image-diffs/difference-blend.tsx](app/src/ui/diff/image-diffs/difference-blend.tsx):
      small image-diff presentation mode with deterministic rendering.
- [app/src/ui/banners/success-banner.tsx](app/src/ui/banners/success-banner.tsx):
      generic success banner with optional action-link behavior.
- [app/src/ui/banners/cherry-pick-conflicts-banner.tsx](app/src/ui/banners/cherry-pick-conflicts-banner.tsx):
      compact conflicts banner variant with link action coverage.
- [app/src/ui/lib/commit-attribution.tsx](app/src/ui/lib/commit-attribution.tsx):
      short attribution renderer with deterministic author and committer text.
- [app/src/ui/banners/rebase-conflicts-banner.tsx](app/src/ui/banners/rebase-conflicts-banner.tsx):
      compact conflicts banner variant with reopen handling.
- [app/src/ui/lib/call-to-action.tsx](app/src/ui/lib/call-to-action.tsx):
      concise composition component with visible content plus a button callback.
- [app/src/ui/welcome/configure-git.tsx](app/src/ui/welcome/configure-git.tsx):
      small welcome-step wrapper with a bounded cancel flow.
- [app/src/ui/dialog/footer.tsx](app/src/ui/dialog/footer.tsx): simple
      composition wrapper; useful for documenting children-based render
      assertions.
- [app/src/ui/dialog/content.tsx](app/src/ui/dialog/content.tsx): another very
      small structural wrapper suited to smoke-level render tests.
- [app/src/ui/dialog/ok-cancel-button-group.tsx](app/src/ui/dialog/ok-cancel-button-group.tsx):
      platform-aware dialog button group with bounded destructive-submit
      behavior.
- [app/src/ui/generate-commit-message/generate-commit-message-disclaimer.tsx](app/src/ui/generate-commit-message/generate-commit-message-disclaimer.tsx):
      warning dialog with stable copy, a help link, and a narrow dispatcher
      submit flow.
- [app/src/ui/generate-commit-message/generate-commit-message-override-warning.tsx](app/src/ui/generate-commit-message/generate-commit-message-override-warning.tsx):
      warning dialog with checkbox state and a bounded override action.
- [app/src/ui/welcome/sign-in-enterprise.tsx](app/src/ui/welcome/sign-in-enterprise.tsx):
      small welcome-step wrapper with a cancel flow and sign-in child slot.
- [app/src/ui/welcome/configure-git.tsx](app/src/ui/welcome/configure-git.tsx):
      small welcome-step wrapper around git configuration with a bounded cancel
      path.
- [app/src/ui/lib/sign-in.tsx](app/src/ui/lib/sign-in.tsx): multi-step sign-in
      wrapper with a small number of state-driven render branches.
- [app/src/ui/dialog/header.tsx](app/src/ui/dialog/header.tsx): small header
      component with title/description semantics.
- [app/src/ui/dialog/default-dialog-footer.tsx](app/src/ui/dialog/default-dialog-footer.tsx):
      small button-group composition component with stable visible output.
- [app/src/ui/lib/highlight-text.tsx](app/src/ui/lib/highlight-text.tsx): pure
      render helper with deterministic markup (`mark` vs `span`).
- [app/src/ui/lib/button.tsx](app/src/ui/lib/button.tsx): foundational button
      wrapper with tooltip wiring, aria props, and click behavior.
- [app/src/ui/lib/checkbox.tsx](app/src/ui/lib/checkbox.tsx): core checkbox
      control with mixed-state behavior and label wiring.
- [app/src/ui/lib/radio-button.tsx](app/src/ui/lib/radio-button.tsx): small
      radio option component with straightforward aria and focus behavior.
- [app/src/ui/lib/radio-group.tsx](app/src/ui/lib/radio-group.tsx): compact
      radiogroup container with prop-driven selection handling.
- [app/src/ui/accessibility/aria-live-container.tsx](app/src/ui/accessibility/aria-live-container.tsx):
      tiny accessibility wrapper with deterministic aria-live behavior.
- [app/src/ui/app-theme.tsx](app/src/ui/app-theme.tsx): compact theme wrapper
      with predictable class and children rendering.
- [app/src/ui/changes/oversized-files-warning.tsx](app/src/ui/changes/oversized-files-warning.tsx):
      small warning surface with stable file-size copy.
- [app/src/ui/diff/image-diffs/swipe.tsx](app/src/ui/diff/image-diffs/swipe.tsx):
      compact image-diff view mode with bounded structural output.
- [app/src/ui/diff/image-diffs/two-up.tsx](app/src/ui/diff/image-diffs/two-up.tsx):
      compact image-diff comparison mode with deterministic layout.
- [app/src/ui/editor/editor-error.tsx](app/src/ui/editor/editor-error.tsx):
      small error renderer with deterministic message output.
- [app/src/ui/generate-commit-message/generate-commit-message-override-warning.tsx](app/src/ui/generate-commit-message/generate-commit-message-override-warning.tsx):
      concise warning surface with predictable override copy.
- [app/src/ui/installing-update/installing-update.tsx](app/src/ui/installing-update/installing-update.tsx):
      compact progress surface with stable updating text.
- [app/src/ui/lfs/initialize-lfs.tsx](app/src/ui/lfs/initialize-lfs.tsx):
      small initialization dialog with bounded action behavior.
- [app/src/ui/lib/enterprise-server-entry.tsx](app/src/ui/lib/enterprise-server-entry.tsx):
      small form entry component with deterministic validation display.
- [app/src/ui/lib/fancy-text-box.tsx](app/src/ui/lib/fancy-text-box.tsx):
      lightweight text box variant with predictable input behavior.
- [app/src/ui/lib/sign-in.tsx](app/src/ui/lib/sign-in.tsx): concise sign-in
      CTA surface with stable button and copy rendering.
- [app/src/ui/move-to-applications-folder.tsx](app/src/ui/move-to-applications-folder.tsx):
      small prompt surface with explicit move and cancel actions.
- [app/src/ui/repository-rules/repo-rules-failure-list.tsx](app/src/ui/repository-rules/repo-rules-failure-list.tsx):
      compact failure list component with deterministic item rendering.
- [app/src/ui/saml-reauth-required/saml-reauth-required.tsx](app/src/ui/saml-reauth-required/saml-reauth-required.tsx):
      small re-authentication prompt with clear action text.
- [app/src/ui/shell/shell-error.tsx](app/src/ui/shell/shell-error.tsx):
      compact shell-error surface with deterministic message content.
- [app/src/ui/terminal.tsx](app/src/ui/terminal.tsx): small terminal output
      surface suited to render-only assertions.
- [app/src/ui/tutorial/tutorial-step-instruction.tsx](app/src/ui/tutorial/tutorial-step-instruction.tsx):
      compact instructional text component with bounded copy rendering.
- [app/src/ui/upstream-already-exists/upstream-already-exists.tsx](app/src/ui/upstream-already-exists/upstream-already-exists.tsx):
      small warning prompt with explicit next-step messaging.
- [app/src/ui/window/zoom-info.tsx](app/src/ui/window/zoom-info.tsx):
      tiny info surface with stable zoom-level text.
- [app/src/ui/workflow-push-rejected/workflow-push-rejected.tsx](app/src/ui/workflow-push-rejected/workflow-push-rejected.tsx):
      tiny rejection dialog with one clear remediation action.
- [app/src/ui/toolbar/revert-progress.tsx](app/src/ui/toolbar/revert-progress.tsx):
      compact toolbar progress surface with deterministic disabled-state output.
- [app/src/ui/multi-commit-operation/dialog/confirm-abort-dialog.tsx](app/src/ui/multi-commit-operation/dialog/confirm-abort-dialog.tsx):
      very small confirm and cancel dialog with bounded actions.
- [app/src/ui/multi-commit-operation/dialog/warn-force-push-dialog.tsx](app/src/ui/multi-commit-operation/dialog/warn-force-push-dialog.tsx):
      concise warning dialog with checkbox-driven state.
- [app/src/ui/welcome/start.tsx](app/src/ui/welcome/start.tsx): compact
      onboarding step with clear call-to-action coverage.
- [app/src/ui/lib/focus-container.tsx](app/src/ui/lib/focus-container.tsx):
      compact focus wrapper with deterministic `focus-within` state behavior.
- [app/src/ui/dialog/ok-cancel-button-group.tsx](app/src/ui/dialog/ok-cancel-button-group.tsx):
      small dialog-button group with platform-specific ordering behavior.
- [app/src/ui/app-menu/menu-list-item.tsx](app/src/ui/app-menu/menu-list-item.tsx):
      compact interactive row component with selection and keyboard behavior.

### Small Presentational Components

- [app/src/ui/lib/toggle-button.tsx](app/src/ui/lib/toggle-button.tsx):
      small switch-style control with checked-state assertions.
- [app/src/ui/lib/tooltipped-content.tsx](app/src/ui/lib/tooltipped-content.tsx):
      compact wrapper for tooltip-backed content and accessible markup.
- [app/src/ui/lib/toggletipped-content.tsx](app/src/ui/lib/toggletipped-content.tsx):
      compact toggletip wrapper with tooltip visibility and aria-live behavior.
- [app/src/ui/lib/text-box.tsx](app/src/ui/lib/text-box.tsx): shared text
      input wrapper with validation and focus behavior.
- [app/src/ui/lib/text-area.tsx](app/src/ui/lib/text-area.tsx): small textarea
      control with predictable input and styling behavior.
- [app/src/ui/lib/select.tsx](app/src/ui/lib/select.tsx): bounded select
      component with prop-driven option rendering.
- [app/src/ui/lib/input-description/input-description.tsx](app/src/ui/lib/input-description/input-description.tsx):
      shared input-description component for caption, warning, and error states.
- [app/src/ui/lib/popover-dropdown.tsx](app/src/ui/lib/popover-dropdown.tsx):
      compact dropdown wrapper combining button and popover behavior.
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
- [app/src/ui/history/committed-file-item.tsx](app/src/ui/history/committed-file-item.tsx):
      compact committed-file row with path and status display.
- [app/src/ui/banners/conflicts-found-banner.tsx](app/src/ui/banners/conflicts-found-banner.tsx):
      small banner prompting the user to resolve conflicts.
- [app/src/ui/tutorial/welcome.tsx](app/src/ui/tutorial/welcome.tsx):
      static tutorial welcome surface with bounded copy and assets.
- [app/src/ui/changes/commit-warning.tsx](app/src/ui/changes/commit-warning.tsx):
      concise warning renderer with icon and message output.
- [app/src/ui/lfs/attribute-mismatch.tsx](app/src/ui/lfs/attribute-mismatch.tsx):
      small confirmation dialog for updating LFS filters.
- [app/src/ui/suggested-actions/suggested-action-group.tsx](app/src/ui/suggested-actions/suggested-action-group.tsx):
      compact animated wrapper around suggested actions.
- [app/src/ui/branches/no-branches.tsx](app/src/ui/branches/no-branches.tsx):
      empty-state surface with a create-branch action.
- [app/src/ui/diff/whitespace-hint-popover.tsx](app/src/ui/diff/whitespace-hint-popover.tsx):
      isolated popover explaining whitespace mode.
- [app/src/ui/lib/config-lock-file-exists.tsx](app/src/ui/lib/config-lock-file-exists.tsx):
      small lock-file notice with retry and help behavior.
- [app/src/ui/generate-commit-message/generate-commit-message-disclaimer.tsx](app/src/ui/generate-commit-message/generate-commit-message-disclaimer.tsx):
      small disclaimer surface with deterministic copy and link behavior.
- [app/src/ui/lib/tooltipped-commit-sha.tsx](app/src/ui/lib/tooltipped-commit-sha.tsx):
      compact commit-SHA renderer with tooltip-backed content.
- [app/src/ui/check-runs/ci-check-run-step-list-header.tsx](app/src/ui/check-runs/ci-check-run-step-list-header.tsx):
      small header surface with stable check-run metadata output.
- [app/src/ui/diff/image-diffs/image-container.tsx](app/src/ui/diff/image-diffs/image-container.tsx):
      bounded image wrapper suited to structural render assertions.
- [app/src/ui/diff/image-diffs/onion-skin.tsx](app/src/ui/diff/image-diffs/onion-skin.tsx):
      small image-diff presentation variant with deterministic markup.
- [app/src/ui/merge-conflicts/commit-conflicts-warning.tsx](app/src/ui/merge-conflicts/commit-conflicts-warning.tsx):
      compact warning surface with predictable conflict text.
- [app/src/ui/diff/diff-contents-warning.tsx](app/src/ui/diff/diff-contents-warning.tsx):
      concise warning component with stable message rendering.
- [app/src/ui/branches/pull-request-badge.tsx](app/src/ui/branches/pull-request-badge.tsx):
      compact PR status badge with bounded click behavior.
- [app/src/ui/history/merge-call-to-action.tsx](app/src/ui/history/merge-call-to-action.tsx):
      small action surface with conflict guidance and button flows.
- [app/src/ui/changes/no-changes.tsx](app/src/ui/changes/no-changes.tsx):
      empty-state component with deterministic messaging.
- [app/src/ui/branches/no-pull-requests.tsx](app/src/ui/branches/no-pull-requests.tsx):
      empty-state surface with create action callbacks.
- [app/src/ui/repository-settings/no-remote.tsx](app/src/ui/repository-settings/no-remote.tsx):
      compact publish CTA shown when a repository has no remote.
- [app/src/ui/repository-rules/repo-rulesets-for-branch-link.tsx](app/src/ui/repository-rules/repo-rulesets-for-branch-link.tsx):
      small rulesets link with a bounded null or missing-data path.
- [app/src/ui/repository-settings/remote.tsx](app/src/ui/repository-settings/remote.tsx):
      compact remote URL surface with simple edit and display behavior.
- [app/src/ui/repository-settings/git-ignore.tsx](app/src/ui/repository-settings/git-ignore.tsx):
      small gitignore settings surface with stable help-link behavior.
- [app/src/ui/branches/branch-select.tsx](app/src/ui/branches/branch-select.tsx):
      compact branch picker with bounded popover and selection behavior.
- [app/src/ui/changes/changed-file.tsx](app/src/ui/changes/changed-file.tsx):
      presentational changed-file row with checkbox and status rendering.
- [app/src/ui/choose-fork-settings/choose-fork-settings-dialog.tsx](app/src/ui/choose-fork-settings/choose-fork-settings-dialog.tsx):
      small settings dialog with deterministic option rendering.
- [app/src/ui/clone-repository/clone-github-repository.tsx](app/src/ui/clone-repository/clone-github-repository.tsx):
      bounded clone form with simple submit flow.
- [app/src/ui/delete-branch/delete-branch-dialog.tsx](app/src/ui/delete-branch/delete-branch-dialog.tsx):
      compact delete dialog with predictable confirmation messaging.
- [app/src/ui/diff/diff-options.tsx](app/src/ui/diff/diff-options.tsx):
      small option surface with bounded toggles and callbacks.
- [app/src/ui/donut.tsx](app/src/ui/donut.tsx): small visual status component
      with deterministic class and percent rendering.
- [app/src/ui/generic-git-auth/generic-git-auth.tsx](app/src/ui/generic-git-auth/generic-git-auth.tsx):
      compact authentication surface with controlled inputs.
- [app/src/ui/history/file-list.tsx](app/src/ui/history/file-list.tsx):
      bounded file list with straightforward row rendering behavior.
- [app/src/ui/no-repositories/create-tutorial-repository-dialog.tsx](app/src/ui/no-repositories/create-tutorial-repository-dialog.tsx):
      focused create-tutorial dialog with simple action coverage.
- [app/src/ui/open-pull-request/open-pull-request-header.tsx](app/src/ui/open-pull-request/open-pull-request-header.tsx):
      compact header component with deterministic title and state output.
- [app/src/ui/remove-repository/confirm-remove-repository.tsx](app/src/ui/remove-repository/confirm-remove-repository.tsx):
      small confirmation dialog with bounded remove flow.
- [app/src/ui/secret-scanning/bypass-push-protection-dialog.tsx](app/src/ui/secret-scanning/bypass-push-protection-dialog.tsx):
      focused secret-scanning dialog with explicit decision actions.
- [app/src/ui/secret-scanning/push-protection-error-location.tsx](app/src/ui/secret-scanning/push-protection-error-location.tsx):
      small location renderer with deterministic secret-scanning text.
- [app/src/ui/ssh/ssh-key-passphrase.tsx](app/src/ui/ssh/ssh-key-passphrase.tsx):
      bounded credential dialog with controlled input behavior.
- [app/src/ui/ssh/ssh-user-password.tsx](app/src/ui/ssh/ssh-user-password.tsx):
      small password dialog with predictable submit and cancel flows.
- [app/src/ui/stashing/stash-diff-header.tsx](app/src/ui/stashing/stash-diff-header.tsx):
      compact header surface for stash diff metadata.
- [app/src/ui/stash-changes/stash-and-switch-branch-dialog.tsx](app/src/ui/stash-changes/stash-and-switch-branch-dialog.tsx):
      bounded stash-or-move dialog with a finite selection matrix and
      overwrite-warning state.
- [app/src/ui/suggested-actions/menu-backed-suggested-action.tsx](app/src/ui/suggested-actions/menu-backed-suggested-action.tsx):
      small action surface with menu-trigger behavior.
- [app/src/ui/branches/pull-request-list-item-context-menu.tsx](app/src/ui/branches/pull-request-list-item-context-menu.tsx):
      compact context-menu surface once menu-invocation helpers are expanded.
- [app/src/ui/branches/branch-list-item-context-menu.tsx](app/src/ui/branches/branch-list-item-context-menu.tsx):
      sibling branch context-menu component with a bounded action matrix.
- [app/src/ui/notifications/pull-request-comment-like.tsx](app/src/ui/notifications/pull-request-comment-like.tsx):
      dialog surface with deterministic timeline copy once avatar and markdown
      dependencies are acceptable in tests.
- [app/src/ui/terms-and-conditions/terms-and-conditions.tsx](app/src/ui/terms-and-conditions/terms-and-conditions.tsx):
      long but deterministic legal-text dialog suited to structural and link
      coverage.
- [app/src/ui/thank-you/thank-you.tsx](app/src/ui/thank-you/thank-you.tsx):
      bounded thank-you surface with stable text and links.
- [app/src/ui/tutorial/done.tsx](app/src/ui/tutorial/done.tsx):
      compact completion surface with deterministic next-step copy.
- [app/src/ui/window/title-bar.tsx](app/src/ui/window/title-bar.tsx):
      small title-bar surface with bounded structural behavior.
- [app/src/ui/window/window-controls.tsx](app/src/ui/window/window-controls.tsx):
      compact window-control strip with predictable button output.
- [app/src/ui/rename-branch/rename-branch-dialog.tsx](app/src/ui/rename-branch/rename-branch-dialog.tsx):
      focused rename dialog with controlled input and validation copy.
- [app/src/ui/acknowledgements/acknowledgements.tsx](app/src/ui/acknowledgements/acknowledgements.tsx):
      bounded acknowledgements surface with deterministic section rendering.
- [app/src/ui/changes/changes.tsx](app/src/ui/changes/changes.tsx):
      presentational changes pane with bounded empty and populated states.
- [app/src/ui/pull-request-quick-view.tsx](app/src/ui/pull-request-quick-view.tsx):
      mid-sized PR detail surface with deterministic state sections once data
      fixtures are in place.
- [app/src/ui/commit-message/commit-message-dialog.tsx](app/src/ui/commit-message/commit-message-dialog.tsx):
      bounded dialog surface for commit message editing with controlled input
      behavior.
- [app/src/ui/resizable/resizable.tsx](app/src/ui/resizable/resizable.tsx):
      reusable resizable wrapper with clear drag-handle and persistence seams.
- [app/src/ui/changes/changes-list-filter-options.tsx](app/src/ui/changes/changes-list-filter-options.tsx):
      compact filter-options surface with finite toggle combinations.
- [app/src/ui/app-menu/app-menu-bar-button.tsx](app/src/ui/app-menu/app-menu-bar-button.tsx):
      bounded menu-trigger button with keyboard and expanded-state coverage.
- [app/src/ui/multi-commit-operation/dialog/conflicts-dialog.tsx](app/src/ui/multi-commit-operation/dialog/conflicts-dialog.tsx):
      bounded conflict dialog with explicit continue and abort affordances.
- [app/src/ui/tutorial/tutorial-panel.tsx](app/src/ui/tutorial/tutorial-panel.tsx):
      mid-sized instructional panel with stable step and CTA rendering.
- [app/src/ui/clone-repository/cloneable-repository-filter-list.tsx](app/src/ui/clone-repository/cloneable-repository-filter-list.tsx):
      list-plus-filter surface with deterministic empty and populated states.
- [app/src/ui/dropdown-select-button.tsx](app/src/ui/dropdown-select-button.tsx):
      split-button selector with bounded option and keyboard state coverage.
- [app/src/ui/preferences/prompts.tsx](app/src/ui/preferences/prompts.tsx):
      settings pane with finite checkbox and radio preference branches.
- [app/src/ui/check-runs/ci-check-run-popover.tsx](app/src/ui/check-runs/ci-check-run-popover.tsx):
      check-run summary popover with list, rerun, and empty-state branches.
- [app/src/ui/app-menu/menu-pane.tsx](app/src/ui/app-menu/menu-pane.tsx):
      keyboard-driven menu surface with finite navigation and selection rules.
- [app/src/ui/open-pull-request/pull-request-files-changed.tsx](app/src/ui/open-pull-request/pull-request-files-changed.tsx):
      bounded diff-and-file-list surface with clear empty and context-menu seams.
- [app/src/ui/branches/pull-request-list.tsx](app/src/ui/branches/pull-request-list.tsx):
      filtered list surface with loading, search, and empty-state branches.
- [app/src/ui/lib/sandboxed-markdown.tsx](app/src/ui/lib/sandboxed-markdown.tsx):
      iframe-backed markdown renderer with bounded link, tooltip, and rerender
      seams.
- [app/src/ui/lib/filter-list.tsx](app/src/ui/lib/filter-list.tsx):
      reusable filtered-list container with deterministic selection and
      empty-state behavior.
- [app/src/ui/lib/augmented-filter-list.tsx](app/src/ui/lib/augmented-filter-list.tsx):
      reusable multi-selection filter surface with bounded keyboard and
      no-results behavior.
- [app/src/ui/lib/path-text.tsx](app/src/ui/lib/path-text.tsx):
      path truncation renderer with deterministic filename, directory, and
      truncation branches.
- [app/src/ui/lib/avatar.tsx](app/src/ui/lib/avatar.tsx):
      avatar surface with bounded fallback rendering and account-aware
      resolution seams.
- [app/src/ui/lib/git-config-user-form.tsx](app/src/ui/lib/git-config-user-form.tsx):
      account-aware git user form with bounded email selection and fallback
      textbox behavior.
- [app/src/ui/lib/branch-name-rule-validation.tsx](app/src/ui/lib/branch-name-rule-validation.tsx):
      repo-rule validation helper surface with deterministic warning or error
      rendering.
- [app/src/ui/lib/rich-text.tsx](app/src/ui/lib/rich-text.tsx):
      rich-text renderer with emoji, link, and overflow behavior.
- [app/src/ui/stashing/stash-diff-viewer.tsx](app/src/ui/stashing/stash-diff-viewer.tsx):
      bounded stash diff surface with deterministic metadata output.
- [app/src/ui/octicons/octicon.tsx](app/src/ui/octicons/octicon.tsx):
      small icon wrapper with stable symbol and accessibility rendering.
- [app/src/ui/suggested-actions/dropdown-suggested-action.tsx](app/src/ui/suggested-actions/dropdown-suggested-action.tsx):
      compact suggested-action variant with dropdown behavior.
- [app/src/ui/lib/author-input/author-handle.tsx](app/src/ui/lib/author-input/author-handle.tsx):
      small author-handle renderer with predictable output.
- [app/src/ui/lib/branch-name-warnings.tsx](app/src/ui/lib/branch-name-warnings.tsx):
      small warning render helpers for remote-tracking and duplicate-name
      states.
- [app/src/ui/branches/push-branch-commits.tsx](app/src/ui/branches/push-branch-commits.tsx):
      compact commit-push surface with bounded action states.
- [app/src/ui/missing-repository.tsx](app/src/ui/missing-repository.tsx):
      focused missing-repository view with explicit remediation actions.
- [app/src/ui/diff/image-diffs/modified-image-diff.tsx](app/src/ui/diff/image-diffs/modified-image-diff.tsx):
      image-diff variant with deterministic comparison rendering.
- [app/src/ui/publish-repository/publish-repository.tsx](app/src/ui/publish-repository/publish-repository.tsx):
      bounded publish dialog with clear controlled input states.
- [app/src/ui/release-notes/release-notes-dialog.tsx](app/src/ui/release-notes/release-notes-dialog.tsx):
      small release-notes dialog with stable content rendering.
- [app/src/ui/check-runs/ci-check-run-list.tsx](app/src/ui/check-runs/ci-check-run-list.tsx):
      compact list surface for check-run rows and empty states.
- [app/src/ui/diff/submodule-diff.tsx](app/src/ui/diff/submodule-diff.tsx):
      bounded diff surface for submodule metadata display.
- [app/src/ui/notifications/pull-request-comment.tsx](app/src/ui/notifications/pull-request-comment.tsx):
      small notification card with bounded repository and PR actions.
- [app/src/ui/notifications/pull-request-review.tsx](app/src/ui/notifications/pull-request-review.tsx):
      compact review notification variant with similar action coverage.
- [app/src/ui/window/full-screen-info.tsx](app/src/ui/window/full-screen-info.tsx):
      small transient info surface with deterministic copy.
- [app/src/ui/banners/update-available.tsx](app/src/ui/banners/update-available.tsx):
      concise update banner with release and download actions.
- [app/src/ui/acknowledgements/acknowledgements.tsx](app/src/ui/acknowledgements/acknowledgements.tsx):
      bounded acknowledgements surface with deterministic section rendering.
- [app/src/ui/changes/changes.tsx](app/src/ui/changes/changes.tsx):
      presentational changes pane with bounded empty and populated states.
- [app/src/ui/lib/rich-text.tsx](app/src/ui/lib/rich-text.tsx):
      rich-text renderer with emoji, link, and overflow behavior.
- [app/src/ui/stashing/stash-diff-viewer.tsx](app/src/ui/stashing/stash-diff-viewer.tsx):
      bounded stash diff surface with deterministic metadata output.
- [app/src/ui/octicons/octicon.tsx](app/src/ui/octicons/octicon.tsx):
      small icon wrapper with stable symbol and accessibility rendering.
- [app/src/ui/suggested-actions/dropdown-suggested-action.tsx](app/src/ui/suggested-actions/dropdown-suggested-action.tsx):
      compact suggested-action variant with dropdown behavior.
- [app/src/ui/lib/author-input/author-handle.tsx](app/src/ui/lib/author-input/author-handle.tsx):
      small author-handle renderer with predictable output.
- [app/src/ui/branches/push-branch-commits.tsx](app/src/ui/branches/push-branch-commits.tsx):
      compact commit-push surface with bounded action states.
- [app/src/ui/missing-repository.tsx](app/src/ui/missing-repository.tsx):
      focused missing-repository view with explicit remediation actions.
- [app/src/ui/diff/image-diffs/modified-image-diff.tsx](app/src/ui/diff/image-diffs/modified-image-diff.tsx):
      image-diff variant with deterministic comparison rendering.
- [app/src/ui/publish-repository/publish-repository.tsx](app/src/ui/publish-repository/publish-repository.tsx):
      bounded publish dialog with clear controlled input states.
- [app/src/ui/release-notes/release-notes-dialog.tsx](app/src/ui/release-notes/release-notes-dialog.tsx):
      small release-notes dialog with stable content rendering.
- [app/src/ui/check-runs/ci-check-run-list.tsx](app/src/ui/check-runs/ci-check-run-list.tsx):
      compact list surface for check-run rows and empty states.
- [app/src/ui/diff/submodule-diff.tsx](app/src/ui/diff/submodule-diff.tsx):
      bounded diff surface for submodule metadata display.
- [app/src/ui/discard-changes/discard-changes-dialog.tsx](app/src/ui/discard-changes/discard-changes-dialog.tsx):
      destructive-confirm dialog with bounded state transitions.
- [app/src/ui/secret-scanning/push-protection-error-dialog.tsx](app/src/ui/secret-scanning/push-protection-error-dialog.tsx):
      focused error dialog with bypass and help actions.
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
- [app/src/ui/check-runs/ci-check-run-actions-job-step-list.tsx](app/src/ui/check-runs/ci-check-run-actions-job-step-list.tsx):
      moderate workflow-step list with deterministic failure highlighting.
- [app/src/ui/lib/password-text-box.tsx](app/src/ui/lib/password-text-box.tsx):
      shared control with local visibility-toggle state and predictable input
      behavior.
- [app/src/ui/banners/open-thank-you-card.tsx](app/src/ui/banners/open-thank-you-card.tsx):
      interactive banner with open and dismiss action flows.
- [app/src/ui/invalidated-token/invalidated-token.tsx](app/src/ui/invalidated-token/invalidated-token.tsx):
      bounded re-authentication dialog with clear account-state messaging.
- [app/src/ui/delete-branch/delete-pull-request-dialog.tsx](app/src/ui/delete-branch/delete-pull-request-dialog.tsx):
      focused delete-branch warning dialog with pull-request guidance.
- [app/src/ui/hook-failed/hook-failed.tsx](app/src/ui/hook-failed/hook-failed.tsx):
      moderate failure dialog with embedded terminal output and recovery text.
- [app/src/ui/delete-tag/delete-tag-dialog.tsx](app/src/ui/delete-tag/delete-tag-dialog.tsx):
      async confirmation dialog with loading-state coverage opportunities.
- [app/src/ui/repository-settings/fork-settings.tsx](app/src/ui/repository-settings/fork-settings.tsx):
      moderate radio-group settings dialog built from small child controls.
- [app/src/ui/changes/undo-commit.tsx](app/src/ui/changes/undo-commit.tsx):
      moderate undo-commit surface with button-state transitions.
- [app/src/ui/commit-progress/commit-progress.tsx](app/src/ui/commit-progress/commit-progress.tsx):
      moderate progress dialog wrapping terminal output.
- [app/src/ui/lib/authentication-form.tsx](app/src/ui/lib/authentication-form.tsx):
      reusable sign-in form with clear submit and cancel behavior.
- [app/src/ui/diff/diff-search-input.tsx](app/src/ui/diff/diff-search-input.tsx):
      moderate search control with next and previous navigation actions.
- [app/src/ui/lib/popover.tsx](app/src/ui/lib/popover.tsx): anchored popover
      container with focus-trap and click-outside behavior.
- [app/src/ui/branches/branch-renderer.tsx](app/src/ui/branches/branch-renderer.tsx):
      state-driven branch row renderer covering several UI variants.
- [app/src/ui/branches/ci-status.tsx](app/src/ui/branches/ci-status.tsx):
      CI indicator component with stateful check-status behavior.
- [app/src/ui/history/commit-list.tsx](app/src/ui/history/commit-list.tsx):
      moderate history list with selection and delegation behavior.
- [app/src/ui/changes/confirm-commit-filtered-changes-dialog.tsx](app/src/ui/changes/confirm-commit-filtered-changes-dialog.tsx):
      focused confirmation dialog with filtered-file rendering and actions.
- [app/src/ui/multi-commit-operation/dialog/progress-dialog.tsx](app/src/ui/multi-commit-operation/dialog/progress-dialog.tsx):
      moderate progress dialog for long-running multi-commit operations.
- [app/src/ui/ssh/add-ssh-host.tsx](app/src/ui/ssh/add-ssh-host.tsx):
      bounded trust dialog with clear accept and cancel flows.
- [app/src/ui/clone-repository/clone-generic-repository.tsx](app/src/ui/clone-repository/clone-generic-repository.tsx):
      moderate cloning form with controlled inputs and submit behavior.
- [app/src/ui/push-needs-pull/push-needs-pull-warning.tsx](app/src/ui/push-needs-pull/push-needs-pull-warning.tsx):
      focused warning dialog with clear remediation actions.
- [app/src/ui/install-git/install.tsx](app/src/ui/install-git/install.tsx):
      bounded install flow surface with deterministic button states.
- [app/src/ui/reset/warning-before-reset.tsx](app/src/ui/reset/warning-before-reset.tsx):
      moderate warning dialog with explicit reset choices.
- [app/src/ui/changes/continue-rebase.tsx](app/src/ui/changes/continue-rebase.tsx):
      targeted rebase continuation surface with action-state coverage.
- [app/src/ui/account-picker.tsx](app/src/ui/account-picker.tsx):
      moderate picker surface with filtering and account-selection behavior.
- [app/src/ui/create-tag/create-tag-dialog.tsx](app/src/ui/create-tag/create-tag-dialog.tsx):
      bounded dialog with controlled inputs and validation opportunities.
- [app/src/ui/discard-changes/discard-selection-dialog.tsx](app/src/ui/discard-changes/discard-selection-dialog.tsx):
      moderate discard dialog with explicit selection-focused messaging.
- [app/src/ui/forks/create-fork-dialog.tsx](app/src/ui/forks/create-fork-dialog.tsx):
      moderate create-fork dialog with option and submit-state coverage.
- [app/src/ui/history/unreachable-commits-dialog.tsx](app/src/ui/history/unreachable-commits-dialog.tsx):
      bounded dialog for unreachable commits with deterministic list output.
- [app/src/ui/open-with-external-editor/open-with-external-editor.tsx](app/src/ui/open-with-external-editor/open-with-external-editor.tsx):
      moderate action surface for external-editor flows.
- [app/src/ui/preferences/accessibility.tsx](app/src/ui/preferences/accessibility.tsx):
      focused settings pane with simple control coverage.
- [app/src/ui/preferences/accounts.tsx](app/src/ui/preferences/accounts.tsx):
      moderate account settings pane with bounded list interactions.
- [app/src/ui/preferences/appearance.tsx](app/src/ui/preferences/appearance.tsx):
      settings pane with theme-oriented controls and deterministic copy.
- [app/src/ui/preferences/notifications.tsx](app/src/ui/preferences/notifications.tsx):
      bounded settings pane with toggle-focused behavior.
- [app/src/ui/check-runs/ci-check-run-rerun-dialog.tsx](app/src/ui/check-runs/ci-check-run-rerun-dialog.tsx):
      rerun dialog with rerunnable and non-rerunnable state coverage.
- [app/src/ui/multi-commit-operation/multi-commit-operation.tsx](app/src/ui/multi-commit-operation/multi-commit-operation.tsx):
      moderate multi-step operation surface with bounded flow states.
- [app/src/ui/repository-settings/git-config.tsx](app/src/ui/repository-settings/git-config.tsx):
      focused git-config settings pane with deterministic field rendering.
- [app/src/ui/toolbar/push-pull-button-dropdown.tsx](app/src/ui/toolbar/push-pull-button-dropdown.tsx):
      interaction-heavy dropdown surface with push or pull action states.
- [app/src/ui/undo/warn-local-changes-before-undo.tsx](app/src/ui/undo/warn-local-changes-before-undo.tsx):
      focused warning dialog for undo flows with explicit choices.
- [app/src/ui/sign-in/sign-in.tsx](app/src/ui/sign-in/sign-in.tsx):
      moderate sign-in surface with browser and enterprise branches.
- [app/src/ui/open-pull-request/open-pull-request-dialog.tsx](app/src/ui/open-pull-request/open-pull-request-dialog.tsx):
      medium pull-request form dialog with validation and action states.
- [app/src/ui/history/merge-call-to-action-with-conflicts.tsx](app/src/ui/history/merge-call-to-action-with-conflicts.tsx):
      conflict-aware merge CTA surface with option-state behavior.
- [app/src/ui/no-repositories/no-repositories-view.tsx](app/src/ui/no-repositories/no-repositories-view.tsx):
      empty-state screen with onboarding and create-repository actions.
- [app/src/ui/preferences/advanced.tsx](app/src/ui/preferences/advanced.tsx):
      settings pane with bounded advanced-option control coverage.
- [app/src/ui/drag-elements/commit-drag-element.tsx](app/src/ui/drag-elements/commit-drag-element.tsx):
      drag-preview surface with deterministic commit metadata rendering.
- [app/src/ui/lib/draggable.tsx](app/src/ui/lib/draggable.tsx):
      reusable draggable wrapper with bounded drag-state behavior.
- [app/src/ui/lib/ref-name-text-box.tsx](app/src/ui/lib/ref-name-text-box.tsx):
      shared ref-name input with validation and controlled text behavior.
- [app/src/ui/preferences/git.tsx](app/src/ui/preferences/git.tsx):
      moderate settings pane with bounded git configuration controls.
- [app/src/ui/multi-commit-operation/choose-branch/rebase-choose-branch-dialog.tsx](app/src/ui/multi-commit-operation/choose-branch/rebase-choose-branch-dialog.tsx):
      focused choose-branch dialog for rebase flows.
- [app/src/ui/preferences/custom-integration-form.tsx](app/src/ui/preferences/custom-integration-form.tsx):
      bounded form component with controlled input behavior.
- [app/src/ui/repositories-list/repositories-list.tsx](app/src/ui/repositories-list/repositories-list.tsx):
      container-level candidate for filtering and grouped rendering behavior.
- [app/src/ui/octicons/icon-preview-dialog.tsx](app/src/ui/octicons/icon-preview-dialog.tsx):
      small dialog composition candidate without major store coupling.

### Dialog and Flow Candidates

- [app/src/ui/publish-repository/publish.tsx](app/src/ui/publish-repository/publish.tsx):
      publish flow surface with dotcom and enterprise branching.
- [app/src/ui/repository-settings/repository-settings.tsx](app/src/ui/repository-settings/repository-settings.tsx):
      tabbed settings surface with several user-visible states.
- [app/src/ui/branches/branches-container.tsx](app/src/ui/branches/branches-container.tsx):
      container coordinating tab switching and merge or PR state.
- [app/src/ui/toolbar/branch-dropdown.tsx](app/src/ui/toolbar/branch-dropdown.tsx):
      interaction-heavy branch chooser with detached, rebase, and loading states.

### Dialog Candidates After the First Container

- [app/src/ui/stashing/confirm-discard-stash.tsx](app/src/ui/stashing/confirm-discard-stash.tsx):
      compact confirm dialog with predictable button text.
- [app/src/ui/checkout/confirm-checkout-commit.tsx](app/src/ui/checkout/confirm-checkout-commit.tsx):
      similarly bounded confirmation dialog.
- [app/src/ui/discard-changes/discard-changes-retry-dialog.tsx](app/src/ui/discard-changes/discard-changes-retry-dialog.tsx):
      small retry dialog with inline message assertions.
- [app/src/ui/local-changes-overwritten/local-changes-overwritten-dialog.tsx](app/src/ui/local-changes-overwritten/local-changes-overwritten-dialog.tsx):
      another bounded dialog candidate once dialog helpers are established.
- [app/src/ui/delete-branch/delete-remote-branch-dialog.tsx](app/src/ui/delete-branch/delete-remote-branch-dialog.tsx):
      compact remote-branch confirmation dialog with bounded actions.
- [app/src/ui/stash-changes/overwrite-stashed-changes-dialog.tsx](app/src/ui/stash-changes/overwrite-stashed-changes-dialog.tsx):
      focused overwrite confirmation dialog with predictable copy.
- [app/src/ui/unknown-authors/unknown-authors-dialog.tsx](app/src/ui/unknown-authors/unknown-authors-dialog.tsx):
      bounded dialog for author attribution decisions.
- [app/src/ui/untrusted-certificate/untrusted-certificate.tsx](app/src/ui/untrusted-certificate/untrusted-certificate.tsx):
      trust-decision dialog with clear warning and action states.
- [app/src/ui/change-repository-alias/change-repository-alias-dialog.tsx](app/src/ui/change-repository-alias/change-repository-alias-dialog.tsx):
      compact alias-edit dialog with controlled input behavior.
- [app/src/ui/rebase/confirm-force-push.tsx](app/src/ui/rebase/confirm-force-push.tsx):
      bounded force-push confirmation dialog with explicit choices.
- [app/src/ui/about/about-test-dialog.tsx](app/src/ui/about/about-test-dialog.tsx):
      small dialog surface useful for smoke-level dialog render coverage.

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
- [x] `test(ui): add second-wave primitive component coverage`
- [x] `test(ui): add dialog and input description coverage`
- [x] `test(ui): add structural and text component coverage`
- [x] `test(ui): add dialog composition and toggle coverage`
- [x] `test(ui): add layout and message component coverage`
- [x] `test(ui): add branch empty-state coverage`
- [x] `test(ui): add static status and link coverage`
- [x] `test(ui): add small action row and cli-installed coverage`
- [x] `test(ui): add rulesets and publish surface coverage`
- [x] `test(ui): add banner surface coverage`
- [x] `test(ui): add visual helper surface coverage`
- [x] `test(ui): add warning helper surface coverage`
- [x] `test(ui): add control primitive coverage`
- [x] `test(ui): add aria live container coverage`
- [x] `test(ui): add input description and textarea coverage`
- [x] `test(ui): add text box coverage`
- [x] `test(ui): add path and empty-selection coverage`
- [x] `test(ui): add helper side-effect coverage`
- [x] `test(ui): add path text and link button coverage`
- [x] `test(ui): add password text box coverage`
- [x] `test(ui): add dialog action wrapper coverage`

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
- [x] Commit 10: land the second-wave primitive component tests.
- [x] Commit 11: land the dialog and input description tests.
- [x] Commit 12: land the structural and text component tests.
- [x] Commit 13: land the dialog composition and toggle tests.
- [x] Commit 14: land the layout and message component tests.
- [x] Commit 15: land the branch empty-state tests.
- [x] Commit 16: land the static status and link tests.
- [x] Commit 17: land the action row and cli-installed tests.
- [x] Commit 18: land the rulesets and publish surface tests.
- [x] Commit 19: land the banner surface tests.
- [x] Commit 20: land the visual helper surface tests.
- [x] Commit 21: land the warning helper surface tests.
- [x] Commit 22: land the control primitive tests.
- [x] Commit 23: land the aria live container tests.
- [x] Commit 24: land the input description and textarea tests.
- [x] Commit 25: land the text box tests.
- [x] Commit 26: land the path and empty-selection tests.
- [x] Commit 27: land the helper side-effect tests.
- [x] Commit 28: land the path text and link button tests.
- [x] Commit 29: land the password text box tests.
- [x] Commit 30: land the dialog action wrapper tests.

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
