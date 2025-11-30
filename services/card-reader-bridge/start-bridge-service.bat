@echo off
REM Card Reader Bridge Service Launcher for Windows
REM This script starts the bridge service

echo Starting Card Reader Bridge Service...
echo.

REM Get the directory where this script is located
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the service
echo Starting service on port 3001...
echo.
call npm start

if errorlevel 1 (
    echo.
    echo Error: Failed to start service
    pause
    exit /b 1
)

