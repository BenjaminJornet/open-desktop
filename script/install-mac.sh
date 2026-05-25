#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Open Desktop.app"
DIST_APP="dist/Open Desktop-darwin-arm64/${APP_NAME}"
INSTALL_DIR="/Applications"
INSTALL_APP="${INSTALL_DIR}/${APP_NAME}"

fail_prerequisite() {
  echo "Missing prerequisite: $1"
  echo "Fix: $2"
  exit 1
}

require_command() {
  local command_name="$1"
  local install_hint="$2"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    fail_prerequisite "${command_name}" "${install_hint}"
  fi
}

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This installer is only supported on macOS."
  exit 1
fi

require_command "xcode-select" "Install Xcode Command Line Tools with: xcode-select --install"
if ! xcode-select -p >/dev/null 2>&1; then
  fail_prerequisite "Xcode Command Line Tools" "Install them with: xcode-select --install"
fi

require_command "node" "Install Node.js, then run: yarn install"
require_command "yarn" "Install Yarn 1.x, then run: yarn install"
require_command "git" "Install Git, for example with: xcode-select --install"

if [[ ! -f "package.json" || ! -f "app/package.json" ]]; then
  echo "Run this script from the repository root."
  echo "Expected files: package.json and app/package.json"
  exit 1
fi

if [[ ! -d "node_modules" || ! -d "app/node_modules" ]]; then
  fail_prerequisite "project dependencies" "Run: yarn install"
fi

if [[ ! -w "${INSTALL_DIR}" ]]; then
  fail_prerequisite "write access to ${INSTALL_DIR}" "Run from an account that can write to /Applications, or adjust permissions."
fi

echo "Rebuilding Open Desktop..."
if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi
yarn compile:prod
yarn cross-env NODE_ENV=development RELEASE_CHANNEL=development ts-node -P script/tsconfig.json script/build.ts

if [[ ! -d "${DIST_APP}" ]]; then
  echo "Built app not found at: ${DIST_APP}"
  exit 1
fi

echo ""
echo "Open Desktop was built successfully:"
echo "  ${DIST_APP}"
echo ""
echo "Install location:"
echo "  ${INSTALL_APP}"
echo ""
read -r -p "Install Open Desktop in /Applications now? [y/N] " answer

case "${answer}" in
  [yY]|[yY][eE][sS])
    ;;
  *)
    echo "Installation skipped."
    exit 0
    ;;
esac

if pgrep -x "Open Desktop" >/dev/null 2>&1; then
  echo "Open Desktop is currently running. Quit it before installing."
  exit 1
fi

if [[ -d "${INSTALL_APP}" ]]; then
  echo "Replacing existing ${INSTALL_APP}..."
  rm -rf "${INSTALL_APP}"
fi

cp -R "${DIST_APP}" "${INSTALL_DIR}/"

echo "Installed Open Desktop to ${INSTALL_APP}"
read -r -p "Open Open Desktop now? [y/N] " open_answer

case "${open_answer}" in
  [yY]|[yY][eE][sS])
    open -n -a "${INSTALL_APP}"
    osascript -e 'tell application "Open Desktop" to reopen' \
      -e 'tell application "Open Desktop" to activate' >/dev/null 2>&1 || true
    ;;
esac
