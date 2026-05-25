#!/usr/bin/env bash
set -euo pipefail

DEFAULT_BRANCH="development"
CURRENT_BRANCH="$(git branch --show-current)"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash your changes before syncing."
  git status --short
  exit 1
fi

echo "Current branch: ${CURRENT_BRANCH}"
echo "Fetching origin and upstream..."
git fetch origin
git fetch upstream

echo "Switching to ${DEFAULT_BRANCH}..."
git checkout "${DEFAULT_BRANCH}"

echo "Merging upstream/${DEFAULT_BRANCH}..."
git merge --ff-only "upstream/${DEFAULT_BRANCH}" || {
  echo ""
  echo "Fast-forward failed. Falling back to a normal merge."
  echo "Resolve conflicts if Git asks you to."
  git merge "upstream/${DEFAULT_BRANCH}"
}

echo "Pushing ${DEFAULT_BRANCH} to origin..."
git push origin "${DEFAULT_BRANCH}"

if [[ "${CURRENT_BRANCH}" != "${DEFAULT_BRANCH}" ]]; then
  echo "Switching back to ${CURRENT_BRANCH}..."
  git checkout "${CURRENT_BRANCH}"

  echo "Merging updated ${DEFAULT_BRANCH} into ${CURRENT_BRANCH}..."
  git merge "${DEFAULT_BRANCH}"
fi

echo "Sync complete."
