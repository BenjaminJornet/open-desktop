#Requires -Version 5.1
<#
.SYNOPSIS
    Open Desktop - PowerShell build script (Windows equivalent of the Makefile)
.EXAMPLE
    .\make.ps1 setup
    .\make.ps1 dev
    .\make.ps1 install-win
#>
param(
    [Parameter(Position = 0)]
    [string]$Target = "help"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Bootstrap PATH: add mise binaries if not yet available
# ---------------------------------------------------------------------------
function Initialize-MisePath {
    # Resolve yarn/node/python directly from mise installs, bypassing shims and
    # any PowerShell functions that mise activation may have injected into the
    # session (which can intercept bare "yarn" calls and mis-route them).
    $miseInstalls = "$env:LOCALAPPDATA\mise\installs"
    if (-not (Test-Path $miseInstalls)) { return }

    $nodeDir = Get-ChildItem "$miseInstalls\node" -Directory -ErrorAction SilentlyContinue |
               Sort-Object Name -Descending | Select-Object -First 1
    if ($nodeDir) { $env:PATH = $nodeDir.FullName + ";" + $env:PATH }

    $yarnDir = Get-ChildItem "$miseInstalls\yarn" -Directory -ErrorAction SilentlyContinue |
               Sort-Object Name -Descending | Select-Object -First 1
    if ($yarnDir) {
        $env:PATH = $yarnDir.FullName + "\bin;" + $env:PATH
        # Store the absolute path so Invoke-Yarn bypasses any PS function named "yarn".
        $script:YarnExe = Join-Path $yarnDir.FullName "bin\yarn.cmd"
    }

    $pyDir = Get-ChildItem "$miseInstalls\python" -Directory -ErrorAction SilentlyContinue |
             Sort-Object Name -Descending | Select-Object -First 1
    if ($pyDir) { $env:PATH = $pyDir.FullName + ";" + $env:PATH }
}

$script:YarnExe = "yarn"   # fallback if mise not found

Initialize-MisePath

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------
function Write-Ok  { param($m) Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Inf { param($m) Write-Host "  [..] $m" -ForegroundColor Cyan }
function Write-Wrn { param($m) Write-Host "  [!!] $m" -ForegroundColor Yellow }
function Write-Err { param($m) Write-Host "  [ERR] $m" -ForegroundColor Red }
function Write-Sep { Write-Host ("-" * 60) -ForegroundColor DarkGray }

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Test-Cmd { param($c) return $null -ne (Get-Command $c -ErrorAction SilentlyContinue) }

function Invoke-Cmd {
    # NOTE: Do NOT name this parameter $Args — that conflicts with PowerShell's
    # automatic $args variable and causes @CmdArgs splatting to silently expand
    # an empty array, so no arguments reach the target process.
    param([string]$Cmd, [string[]]$CmdArgs)
    & $Cmd @CmdArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Err "'$Cmd $($CmdArgs -join ' ')' failed (exit code $LASTEXITCODE)"
        exit $LASTEXITCODE
    }
}

function Invoke-Yarn {
    # Use the absolute path to yarn.cmd to bypass any PowerShell function or
    # mise shim that may be defined in the session under the name "yarn".
    # NOTE: Parameter named $YarnArgs (not $Args) to avoid splatting conflict.
    param([string[]]$YarnArgs)
    & $script:YarnExe @YarnArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Err "'yarn $($YarnArgs -join ' ')' failed (exit code $LASTEXITCODE)"
        exit $LASTEXITCODE
    }
}

function Compare-Version {
    param([string]$got, [string]$want)
    try {
        return ([System.Version]$got).CompareTo([System.Version]$want)
    } catch { return 0 }
}

# ---------------------------------------------------------------------------
# Dependency checks
# ---------------------------------------------------------------------------
$REQ_NODE = "24.15.0"
$REQ_YARN = "1.21.1"

function Assert-Deps {
    Write-Sep
    Write-Inf "Checking dependencies..."
    $ok = $true

    # Node
    if (-not (Test-Cmd "node")) {
        Write-Err "node not found - install Node.js $REQ_NODE from https://nodejs.org"
        $ok = $false
    } else {
        $nv = (node --version 2>&1) -replace '^v', ''
        if ((Compare-Version $nv $REQ_NODE) -lt 0) {
            Write-Wrn "node $nv found, required >= $REQ_NODE"
        } else {
            Write-Ok "node $nv"
        }
    }

    # Yarn
    if (-not (Test-Cmd "yarn")) {
        Write-Err "yarn not found - run: npm install -g yarn@$REQ_YARN"
        $ok = $false
    } else {
        $yv = (yarn --version 2>&1)
        if ((Compare-Version $yv $REQ_YARN) -lt 0) {
            Write-Wrn "yarn $yv found, required >= $REQ_YARN"
        } else {
            Write-Ok "yarn $yv"
        }
    }

    # Git
    if (-not (Test-Cmd "git")) {
        Write-Err "git not found - install Git for Windows: https://git-scm.com/download/win"
        $ok = $false
    } else {
        Write-Ok (git --version 2>&1)
    }

    # Python (optional)
    if (-not (Test-Cmd "python")) {
        Write-Wrn "python not found (optional, may be needed for native modules)"
    } else {
        Write-Ok (python --version 2>&1)
    }

    Write-Sep
    if (-not $ok) {
        Write-Err "Missing required dependencies - install them and try again."
        exit 1
    }
}

function Assert-RepoRoot {
    if (-not (Test-Path "package.json") -or -not (Test-Path "app\package.json")) {
        Write-Err "Run this script from the repository root (where package.json and app\package.json are)."
        exit 1
    }
}

function Assert-NodeModules {
    if (-not (Test-Path "node_modules") -or -not (Test-Path "app\node_modules")) {
        Write-Err "Dependencies not installed. Run first: .\make.ps1 setup"
        exit 1
    }
}

# ---------------------------------------------------------------------------
# .env loader
# ---------------------------------------------------------------------------
function Import-DotEnv {
    if (Test-Path ".env") {
        Write-Inf "Loading .env..."
        Get-Content ".env" | Where-Object { $_ -match '^\s*[^#\s]' -and $_ -match '=' } | ForEach-Object {
            $parts = $_ -split '=', 2
            $key   = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    } else {
        Write-Wrn "No .env file found - copy .env.example to .env to enable BYOK variables."
    }
}

# ---------------------------------------------------------------------------
# Targets
# ---------------------------------------------------------------------------

function Invoke-Help {
    Write-Host ""
    Write-Host "Open Desktop - PowerShell build script (Windows)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\make.ps1 <target>"
    Write-Host ""
    Write-Host "Available targets:"
    $rows = @(
        ("setup",         "Check dependencies and install packages (yarn install)"),
        ("dev",           "Build dev bundle and start the app"),
        ("build-dev",     "Build dev bundle only (without starting)"),
        ("start",         "Start the app without rebuilding"),
        ("test",          "Run unit tests"),
        ("lint",          "Run ESLint checks"),
        ("check",         "lint + tests + dev build (local CI)"),
        ("byok-dev",      "Load .env then build dev + start (BYOK mode)"),
        ("install-win",   "Build and install Open Desktop to %LOCALAPPDATA%"),
        ("sync-upstream", "Sync fork with upstream/development"),
        ("clean-node",    "Remove node_modules and app\node_modules")
    )
    foreach ($r in $rows) {
        Write-Host ("  {0,-18} {1}" -f $r[0], $r[1])
    }
    Write-Host ""
}

function Invoke-Setup {
    Assert-RepoRoot
    Assert-Deps
    Write-Inf "Installing dependencies..."
    Invoke-Yarn @("install")
    Write-Ok "Setup complete."
}

function Invoke-BuildDev {
    Assert-RepoRoot
    Assert-Deps
    Assert-NodeModules
    Write-Inf "Building dev bundle..."
    Invoke-Yarn @("build:dev")
    Write-Ok "Dev build complete."
}

function Invoke-Start {
    Assert-RepoRoot
    Assert-Deps
    Assert-NodeModules
    Write-Inf "Starting the app..."
    Invoke-Yarn @("start")
}

function Invoke-Dev {
    Assert-RepoRoot
    Assert-Deps
    Assert-NodeModules
    Write-Inf "Building dev bundle..."
    Invoke-Yarn @("build:dev")
    Write-Inf "Starting the app..."
    Invoke-Yarn @("start")
}

function Invoke-Test {
    Assert-RepoRoot
    Assert-Deps
    Assert-NodeModules
    Write-Inf "Running unit tests..."
    Invoke-Yarn @("test:unit")
}

function Invoke-Lint {
    Assert-RepoRoot
    Assert-Deps
    Assert-NodeModules
    Write-Inf "Running ESLint checks..."
    Invoke-Yarn @("test:eslint")
}

function Invoke-Check {
    Assert-RepoRoot
    Assert-Deps
    Assert-NodeModules
    Write-Inf "Lint..."
    Invoke-Yarn @("test:eslint")
    Write-Inf "Unit tests..."
    Invoke-Yarn @("test:unit")
    Write-Inf "Dev build..."
    Invoke-Yarn @("build:dev")
    Write-Ok "All checks passed."
}

function Invoke-ByokDev {
    Assert-RepoRoot
    Assert-Deps
    Assert-NodeModules
    Import-DotEnv
    Write-Inf "Building dev bundle..."
    Invoke-Yarn @("build:dev")
    Write-Inf "Starting the app..."
    Invoke-Yarn @("start")
}

function Invoke-InstallWin {
    Assert-RepoRoot
    Assert-Deps
    Assert-NodeModules

    $distDir    = "dist\OpenDesktop-dev-win32-x64"
    $distExe    = "$distDir\OpenDesktop-dev.exe"
    $installDir = "$env:LOCALAPPDATA\Programs\Open Desktop"
    $tsnode     = if (Test-Path "node_modules\.bin\ts-node.cmd") { "node_modules\.bin\ts-node.cmd" } else { "node_modules\.bin\ts-node" }

    # Check for running app BEFORE the build — a running exe locks files in dist/
    # and causes Node.js rmSync to fail with EPERM on Windows.
    $running = Get-Process -Name "OpenDesktop-dev" -ErrorAction SilentlyContinue
    if ($running) {
        Write-Err "Open Desktop is already running. Close it before building."
        exit 1
    }

    # Pre-delete dist/ from PowerShell so that build.ts's rmSync never hits a
    # locked-directory EPERM.  Windows Defender / Explorer can hold handles on a
    # freshly-created dist tree; deleting it here (before Node touches it) avoids
    # the race.  Errors are ignored — build.ts will recreate the directory anyway.
    if (Test-Path "dist") {
        Write-Inf "Clearing previous dist directory..."
        Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
    }

    if (Test-Path ".env") { Import-DotEnv }

    # Mirror install-mac.sh step 1: "yarn compile:prod"
    # The yarn script sets NODE_ENV, TS_NODE_PROJECT, and NODE_OPTIONS via cross-env before
    # calling webpack, so ts-node can load app/webpack.production.ts correctly.
    Write-Inf "Step 1/2 - Production webpack (compile:prod)..."
    Invoke-Yarn @("compile:prod")

    # Mirror install-mac.sh step 2: dev-channel packaging.
    # Env vars set here because we can't use cross-env directly in PowerShell.
    Write-Inf "Step 2/2 - Packaging (build.ts)..."
    $env:NODE_ENV        = "development"
    $env:RELEASE_CHANNEL = "development"
    Invoke-Cmd $tsnode @("-P", "script/tsconfig.json", "script/build.ts")

    if (-not (Test-Path $distExe)) {
        Write-Err "Executable not found: $distExe"
        exit 1
    }

    Write-Host ""
    Write-Host "Build successful: $distDir" -ForegroundColor Green
    Write-Host "Install location: $installDir"
    Write-Host ""
    $ans = Read-Host "Install Open Desktop now? [y/N]"
    if ($ans -notmatch '^[yY]') {
        Write-Wrn "Installation cancelled."
        return
    }

    if (Test-Path $installDir) {
        Write-Inf "Replacing existing installation..."
        Remove-Item -Recurse -Force $installDir
    }

    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    Copy-Item -Recurse -Force "$distDir\*" $installDir
    Write-Ok "Installed to: $installDir"

    $launch = Read-Host "Launch Open Desktop now? [y/N]"
    if ($launch -match '^[yY]') {
        Start-Process "$installDir\OpenDesktop-dev.exe"
    }
}

function Invoke-SyncUpstream {
    Assert-RepoRoot

    $status = git status --porcelain 2>&1
    if ($status) {
        Write-Err "Working tree is not clean. Commit or stash your changes first."
        git status --short
        exit 1
    }

    $defaultBranch = "development"
    $currentBranch = git branch --show-current

    Write-Inf "Current branch: $currentBranch"
    Write-Inf "Fetching origin and upstream..."
    Invoke-Cmd "git" @("fetch", "origin")
    Invoke-Cmd "git" @("fetch", "upstream")

    Write-Inf "Switching to $defaultBranch..."
    Invoke-Cmd "git" @("checkout", $defaultBranch)

    Write-Inf "Merging upstream/$defaultBranch..."
    & git merge --ff-only "upstream/$defaultBranch"
    if ($LASTEXITCODE -ne 0) {
        Write-Wrn "Fast-forward failed, attempting regular merge..."
        Invoke-Cmd "git" @("merge", "upstream/$defaultBranch")
    }

    Write-Inf "Pushing $defaultBranch to origin..."
    Invoke-Cmd "git" @("push", "origin", $defaultBranch)

    if ($currentBranch -ne $defaultBranch) {
        Write-Inf "Switching back to $currentBranch..."
        Invoke-Cmd "git" @("checkout", $currentBranch)
        Write-Inf "Merging $defaultBranch into $currentBranch..."
        Invoke-Cmd "git" @("merge", $defaultBranch)
    }

    Write-Ok "Sync complete."
}

function Invoke-CleanNode {
    Assert-RepoRoot
    $ans = Read-Host "Remove node_modules and app\node_modules? [y/N]"
    if ($ans -notmatch '^[yY]') {
        Write-Wrn "Cancelled."
        return
    }
    foreach ($dir in @("node_modules", "app\node_modules")) {
        if (Test-Path $dir) {
            Write-Inf "Removing $dir..."
            Remove-Item -Recurse -Force $dir
            Write-Ok "$dir removed."
        } else {
            Write-Wrn "$dir not found, nothing to do."
        }
    }
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
switch ($Target.ToLower()) {
    "help"           { Invoke-Help }
    "setup"          { Invoke-Setup }
    "dev"            { Invoke-Dev }
    "build-dev"      { Invoke-BuildDev }
    "start"          { Invoke-Start }
    "test"           { Invoke-Test }
    "lint"           { Invoke-Lint }
    "check"          { Invoke-Check }
    "byok-dev"       { Invoke-ByokDev }
    "install-win"    { Invoke-InstallWin }
    "sync-upstream"  { Invoke-SyncUpstream }
    "clean-node"     { Invoke-CleanNode }
    default {
        Write-Err "Unknown target: '$Target'"
        Invoke-Help
        exit 1
    }
}
