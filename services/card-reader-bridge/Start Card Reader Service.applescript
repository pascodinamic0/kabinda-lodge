-- AppleScript to start Card Reader Bridge Service
-- This can be saved as an application and double-clicked

tell application "Terminal"
    activate
    do script "cd \"/Users/Pascal Digny/Github Lab/Kabinda Lodge/services/card-reader-bridge\" && ./start-bridge-service.sh"
end tell

