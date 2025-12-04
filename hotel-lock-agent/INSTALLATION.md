# Installation Instructions

## For End Users

### Windows

1. Download `Hotel-Lock-Agent-Setup-x.x.x.exe` from releases
2. Run the installer
3. Follow the installation wizard
4. Launch "Hotel Lock Agent" from Start Menu
5. Pair the agent using a token from the admin panel

### macOS

1. Download `Hotel-Lock-Agent-x.x.x.dmg` from releases
2. Open the DMG file
3. Drag "Hotel Lock Agent" to Applications
4. Open Applications and launch "Hotel Lock Agent"
5. If you see a security warning:
   - Go to System Preferences → Security & Privacy
   - Click "Open Anyway"
6. Pair the agent using a token from the admin panel

### Linux

1. Download `Hotel-Lock-Agent-x.x.x.AppImage` from releases
2. Make it executable:
   ```bash
   chmod +x Hotel-Lock-Agent-x.x.x.AppImage
   ```
3. Run the AppImage:
   ```bash
   ./Hotel-Lock-Agent-x.x.x.AppImage
   ```
4. Pair the agent using a token from the admin panel

## Auto-Start Setup

### Windows
1. Press `Win + R`
2. Type `shell:startup` and press Enter
3. Create a shortcut to the agent executable
4. Agent will start on boot

### macOS
1. System Preferences → Users & Groups
2. Select your user → Login Items
3. Click "+" and add "Hotel Lock Agent"
4. Agent will start on login

### Linux (systemd)
Create `/etc/systemd/system/hotel-lock-agent.service`:
```ini
[Unit]
Description=Hotel Lock Agent
After=network.target

[Service]
Type=simple
User=your-user
ExecStart=/path/to/Hotel-Lock-Agent
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable hotel-lock-agent
sudo systemctl start hotel-lock-agent
```

## USB Permissions

### Linux
Add your user to the `plugdev` group:
```bash
sudo usermod -a -G plugdev $USER
```
Log out and back in for changes to take effect.

### macOS
No special permissions needed for USB devices.

### Windows
May require running as Administrator for some USB devices.




