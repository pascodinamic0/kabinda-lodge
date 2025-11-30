#!/bin/bash

# Card Reader Bridge Service Launcher
# Double-click this file or run from terminal to start the service

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    osascript -e 'display dialog "Node.js is not installed. Please install Node.js first." buttons {"OK"} default button "OK"'
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    osascript -e 'display dialog "npm is not installed. Please install npm first." buttons {"OK"} default button "OK"'
    exit 1
fi

# Check if node_modules exists, if not, install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the service
echo "Starting Card Reader Bridge Service..."
echo "Service will run on http://localhost:3001"
echo "Keep this window open while using card programming."
echo ""
echo "Press Ctrl+C to stop the service."
echo ""

# Open a new Terminal window on macOS
osascript -e 'tell application "Terminal" to do script "cd \"'"$SCRIPT_DIR"'\" && npm start"'

echo "Service started in a new Terminal window."

