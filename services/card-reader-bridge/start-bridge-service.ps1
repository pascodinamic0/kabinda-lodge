# Card Reader Bridge Service Launcher for Windows (PowerShell)
# This script starts the bridge service

Write-Host "Starting Card Reader Bridge Service..." -ForegroundColor Green
Write-Host ""

# Get the directory where this script is located
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start the service
Write-Host "Starting service on port 3001..." -ForegroundColor Green
Write-Host ""
npm start

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Error: Failed to start service" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

