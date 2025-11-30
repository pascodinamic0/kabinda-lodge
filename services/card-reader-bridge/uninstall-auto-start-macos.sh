#!/bin/bash

# Uninstall Card Reader Bridge Service LaunchAgent

PLIST_FILE="$HOME/Library/LaunchAgents/com.kabindalodge.cardreader.plist"

if [ -f "$PLIST_FILE" ]; then
    # Stop and unload the service
    launchctl stop com.kabindalodge.cardreader 2>/dev/null
    launchctl unload "$PLIST_FILE" 2>/dev/null
    
    # Remove the plist file
    rm "$PLIST_FILE"
    
    echo "Card Reader Bridge Service LaunchAgent uninstalled successfully!"
else
    echo "LaunchAgent not found. Nothing to uninstall."
fi

