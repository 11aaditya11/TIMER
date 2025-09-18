# Timer App

A minimalist yet powerful timer application with multiple window modes, built with Electron.

## Features

- Multiple window modes: Main, Picture-in-Picture (PiP), and Tiny windows
- Single instance enforcement to prevent multiple app instances
- Persistent settings and timer preferences
- System tray integration with basic controls
- Global shortcuts for quick access

## Installation

### Linux (Recommended)
```bash
# Clone the repository
git clone https://github.com/yourusername/timer-app.git
cd timer-app

# Simple installation (recommended)
chmod +x install-simple.sh
sudo ./install-simple.sh

# Or use PKGBUILD (Arch Linux)
makepkg -si
```

### Development
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Usage

- **Main Window**: Full-featured timer interface
- **PiP Mode**: Compact always-on-top window
- **Tiny Windows**: Multiple small timer instances
- **System Tray**: Quick access to controls
- **Global Shortcuts**: Configure in app settings

### Picture-in-Picture Mode
- **Menu**: File → Picture in Picture
- **Keyboard**: `Ctrl+Shift+P`
- **Button**: Click the PiP button in the header

## Keyboard Shortcuts

- `Ctrl+Shift+P`: Open Picture-in-Picture mode
- `Ctrl+Q` (Linux/Windows) or `Cmd+Q` (macOS): Quit application
- `Enter`: Submit forms (time inputs, preset inputs)

## File Structure

```
timer-app/
├── main.js              # Main Electron process
├── preload.js           # Secure API bridge
├── index.html           # Main window HTML
├── pip.html            # Picture-in-Picture HTML
├── styles.css          # Main window styles
├── pip-styles.css      # PiP window styles
├── renderer.js         # Main window logic
├── pip-renderer.js     # PiP window logic
├── package.json        # Project configuration
└── README.md           # This file
```

## Technical Details

### Architecture
- **Main Process**: Manages windows, IPC, and app lifecycle
- **Renderer Process**: Handles UI and timer logic
- **Preload Script**: Secure communication bridge
- **IPC**: Inter-process communication for timer sync

## Customization

- **Colors**: Edit `styles.css`
- **Sounds**: Replace Web Audio API beep in `timerComplete()`
- **Window Sizes**: Adjust in `main.js`

## Security

- Context Isolation: ✅ Enabled  
- Node Integration: ❌ Disabled

## Troubleshooting

### Common Issues

**Timer not syncing between windows**
- Ensure both windows are open
- Check browser console for errors
- Restart the application

**Picture-in-Picture not opening**
- Check if another PiP window is already open
- Verify keyboard shortcuts are working
- Try using the menu option instead

**Audio not playing**
- Check browser audio permissions
- Ensure system volume is not muted
- Try refreshing the window

### Development Tips

**Enable DevTools**
```bash
npm run dev
```

**Debug IPC Communication**
Check the main process console for IPC logs.

**Test PiP Mode**
Use `Ctrl+Shift+P` or the menu to test Picture-in-Picture functionality.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

ISC License - see package.json for details.

---

**Enjoy your productive timing!** ⏰✨

