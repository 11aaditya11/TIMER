# Electron Timer App

A beautiful, feature-rich timer application built with Electron that includes Picture-in-Picture mode, preset timers, and custom time settings.

## Features

### 🕒 Timer Functionality
- **Start/Pause/Reset** controls
- **Visual progress ring** showing timer completion
- **Custom time input** (minutes and seconds)
- **Preset timers** for quick access
- **Add custom presets** to favorites

### 🖼️ Picture-in-Picture Mode
- **Compact floating window** (200x120px)
- **Always on top** for easy visibility
- **Draggable** window
- **Synchronized** with main timer
- **Global shortcut**: `Ctrl+Shift+P`

### 🎨 Modern UI
- **Beautiful gradient design** with glassmorphism effects
- **Responsive layout** that works on all screen sizes
- **Smooth animations** and transitions
- **Professional color scheme**

### 🔔 Notifications
- **Desktop notifications** when timer completes
- **Audio alerts** with custom beep sounds
- **Visual feedback** with animations

## Installation

### Option 1: Download Packaged App (Recommended)
1. **Download** the AppImage from the `dist/` folder
2. **Make executable**: `chmod +x "Timer App-1.0.0.AppImage"`
3. **Run**: `./Timer\ App-1.0.0.AppImage`

### Option 2: Build from Source
1. **Clone or download** the project files
2. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the App

### Packaged Application
```bash
./Timer\ App-1.0.0.AppImage
```

### Development Mode
```bash
npm run dev
```
This will open the app with DevTools enabled.

### Production Mode
```bash
npm start
```

## Building the App

### Build for Your Platform
```bash
npm run build
```

### Build for Specific Platforms
```bash
npm run build-linux    # Linux AppImage and .deb
npm run build-win      # Windows installer and portable
npm run build-mac      # macOS .dmg
```

### Build for All Platforms
```bash
./build-all.sh
```

## Usage

### Basic Timer
1. **Set time** using the custom time inputs or preset buttons
2. **Click Start** to begin the countdown
3. **Use Pause/Reset** as needed
4. **Timer will notify** you when complete

### Preset Timers
- **Quick Break**: 5 minutes
- **Pomodoro**: 25 minutes  
- **Long Break**: 15 minutes
- **Deep Work**: 90 minutes

### Adding Custom Presets
1. Enter a **name** for your timer
2. Set the **duration** in minutes
3. Click **"Add"** to save to favorites

### Picture-in-Picture Mode
- **Menu**: File → Picture in Picture
- **Keyboard**: `Ctrl+Shift+P`
- **Button**: Click the PiP button in the header
- **Close**: Click the × button in PiP window

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

### Security
- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled
- **Preload Script**: Secure API exposure

### Cross-Platform
- **Windows**: Full support
- **macOS**: Full support  
- **Linux**: Full support

## Customization

### Colors
Edit `styles.css` to change the color scheme:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}
```

### Timer Sounds
Replace the Web Audio API beep with custom audio files in the `timerComplete()` method.

### Window Sizes
Modify window dimensions in `main.js`:
```javascript
width: 400,    // Main window width
height: 600,   // Main window height
width: 200,    // PiP window width  
height: 120    // PiP window height
```

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

Feel free to submit issues, feature requests, or pull requests to improve the application.

## License

ISC License - see package.json for details.

---

**Enjoy your productive timing!** ⏰✨

