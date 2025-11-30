#!/bin/bash

# Install Card Reader Bridge Service as macOS LaunchAgent
# This will make the service start automatically on login

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Find Node.js path
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "Error: Node.js is not installed or not in PATH."
    exit 1
fi

# Create LaunchAgent directory if it doesn't exist
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
mkdir -p "$LAUNCH_AGENTS_DIR"

# Create the plist file
PLIST_FILE="$LAUNCH_AGENTS_DIR/com.kabindalodge.cardreader.plist"

cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.kabindalodge.cardreader</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$SCRIPT_DIR/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/cardreader.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/cardreader.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PORT</key>
        <string>3001</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
EOF

# Load the service
launchctl load "$PLIST_FILE" 2>/dev/null || launchctl load -w "$PLIST_FILE"

echo "Card Reader Bridge Service installed as LaunchAgent!"
echo "The service will now start automatically when you log in."
echo ""
echo "To start it now, run: launchctl start com.kabindalodge.cardreader"
echo "To stop it, run: launchctl stop com.kabindalodge.cardreader"
echo "To uninstall, run: launchctl unload $PLIST_FILE && rm $PLIST_FILE"

