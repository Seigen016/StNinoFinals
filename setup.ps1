# Setup script for Sto Niño Portal (Windows PowerShell)
# This script verifies Node is installed, enables corepack (if available), installs pnpm, and runs pnpm install.

# Exit on errors
$ErrorActionPreference = 'Stop'

# Check if Node is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed or not on PATH." -ForegroundColor Yellow
    Write-Host "Please install Node.js (Recommended: 18.17.0 or 20.x). Visit https://nodejs.org/ to download the Windows installer." -ForegroundColor White
    exit 1
}

# Show Node and npm versions
Write-Host "Node version:" -NoNewline; node --version

if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "npm version:" -NoNewline; npm --version
}

# Try to enable corepack (Node 18+) and prepare pnpm
if (Get-Command corepack -ErrorAction SilentlyContinue) {
    Write-Host "Enabling corepack and activating pnpm..."
    corepack enable
    corepack prepare pnpm@latest --activate
}

# If pnpm is not found, try to install it globally via npm
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Write-Host "Installing pnpm globally with npm..."
        npm install -g pnpm
    } else {
        Write-Host "pnpm not found and npm not found, cannot auto-install pnpm." -ForegroundColor Yellow
        exit 1
    }
}

# Verify pnpm
Write-Host "pnpm version:" -NoNewline; pnpm -v

# Install dependencies with pnpm using the lockfile
Write-Host "Installing dependencies with pnpm..."
pnpm install --frozen-lockfile

Write-Host "All done. Run 'pnpm dev' to start the app." -ForegroundColor Green
