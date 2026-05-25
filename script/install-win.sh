#!/usr/bin/env bash
set -euo pipefail

APP_DIR_NAME="Open Desktop"
DIST_DIR="dist/GitHubDesktop-dev-win32-x64"
DIST_EXE="${DIST_DIR}/GitHubDesktop-dev.exe"

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

case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    ;;
  *)
    echo "This installer is only supported on Windows."
    exit 1
    ;;
esac

if [[ -z "${LOCALAPPDATA:-}" ]]; then
  echo "LOCALAPPDATA is not set. Cannot determine install location."
  exit 1
fi

require_command "node" "Install Node.js, then run: yarn install"
require_command "yarn" "Install Yarn 1.x, then run: yarn install"
require_command "git" "Install Git for Windows, then reopen Git Bash"
require_command "powershell.exe" "Install or enable Windows PowerShell"
require_command "tasklist" "Run this script from Git Bash, MSYS2, or a Windows shell with tasklist available"

if [[ ! -f "package.json" || ! -f "app/package.json" ]]; then
  echo "Run this script from the repository root."
  echo "Expected files: package.json and app/package.json"
  exit 1
fi

if [[ ! -d "node_modules" || ! -d "app/node_modules" ]]; then
  fail_prerequisite "project dependencies" "Run: yarn install"
fi

INSTALL_DIR="${LOCALAPPDATA}\\Programs\\${APP_DIR_NAME}"

echo "Rebuilding Open Desktop..."
if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi
yarn compile:prod
yarn cross-env NODE_ENV=development RELEASE_CHANNEL=development ts-node -P script/tsconfig.json script/build.ts

if [[ ! -f "${DIST_EXE}" ]]; then
  echo "Built app not found at: ${DIST_EXE}"
  exit 1
fi

echo ""
echo "Open Desktop was built successfully:"
echo "  ${DIST_DIR}"
echo ""
echo "Install location:"
echo "  ${INSTALL_DIR}"
echo ""
read -r -p "Install Open Desktop on Windows now? [y/N] " answer

case "${answer}" in
  [yY]|[yY][eE][sS])
    ;;
  *)
    echo "Installation skipped."
    exit 0
    ;;
esac

if tasklist //FI "IMAGENAME eq GitHubDesktop-dev.exe" 2>/dev/null | grep -q "GitHubDesktop-dev.exe"; then
  echo "Open Desktop is currently running. Quit it before installing."
  exit 1
fi

if [[ -d "${INSTALL_DIR}" ]]; then
  echo "Replacing existing ${INSTALL_DIR}..."
  rm -rf "${INSTALL_DIR}"
fi

mkdir -p "${INSTALL_DIR}"
cp -R "${DIST_DIR}/." "${INSTALL_DIR}/"

echo "Installed Open Desktop to ${INSTALL_DIR}"
read -r -p "Open Open Desktop now? [y/N] " open_answer

case "${open_answer}" in
  [yY]|[yY][eE][sS])
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process \"${INSTALL_DIR}\\GitHubDesktop-dev.exe\""
    ;;
esac
