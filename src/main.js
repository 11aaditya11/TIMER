require('../public/js/log-config');
const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Notification } = require('electron');
const TimerCore = require('./timerCore');
const path = require('path');
const fs = require('fs');

let mainWindow;
let pipWindow;
let tinyWindows = []; // Track all tiny windows
let currentThemePayload = null;

const WINDOW_EDGE_PADDING = 12;
// setLog(true);
function getBottomRightPosition(width, height, offset = WINDOW_EDGE_PADDING) {
  const { screen } = require('electron');
  const display = screen.getPrimaryDisplay();
  const workArea = display.workArea || display.bounds;
  const x = Math.round(workArea.x + workArea.width - width - offset);
  const y = Math.round(workArea.y + workArea.height - height - offset);
  return { x, y };
}

// Ensure Chromium does not throttle timers or background renderers when windows are unfocused/minimized
// This keeps the main renderer's 1s tick accurate even when the main window is minimized
try {
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
} catch (_) { /* ignore */ }


// Single instance lock to prevent multiple app instances
const gotTheLock = app.requestSingleInstanceLock();
const lockFilePath = path.join(app.getPath('userData'), 'app.lock');

function getAnalyticsPath() {
  try {
    return path.join(app.getPath('userData'), 'analytics.json');
  } catch (_) {
    return path.join(__dirname, '..', 'analytics.json');
  }
}

function loadAnalytics() {
  const analyticsPath = getAnalyticsPath();
  try {
    if (!fs.existsSync(analyticsPath)) {
      return { sessions: [] };
    }
    const raw = fs.readFileSync(analyticsPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { sessions: [] };
    if (!Array.isArray(parsed.sessions)) parsed.sessions = [];
    return parsed;
  } catch (_) {
    return { sessions: [] };
  }
}

function saveAnalytics(data) {
  const analyticsPath = getAnalyticsPath();
  try {
    const safe = data && typeof data === 'object' ? data : { sessions: [] };
    if (!Array.isArray(safe.sessions)) safe.sessions = [];
    fs.writeFileSync(analyticsPath, JSON.stringify(safe, null, 2));
    return true;
  } catch (_) {
    return false;
  }
}

function createSessionId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function recordCompletedSession(timerState) {
  try {
    const totalTime = Number(timerState && timerState.totalTime) || 0;
    const completedAt = Date.now();
    const durationSeconds = Math.max(0, Math.floor(totalTime));
    const startedAt = completedAt - durationSeconds * 1000;
    const entry = {
      id: createSessionId(),
      durationSeconds,
      startedAt,
      completedAt,
    };
    const analytics = loadAnalytics();
    analytics.sessions.unshift(entry);
    analytics.sessions = analytics.sessions.slice(0, 500);
    saveAnalytics(analytics);
    try {
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('analytics:updated', entry);
      }
    } catch (_) {}
    return entry;
  } catch (_) {
    return null;
  }
}

// Function to handle cleanup
function cleanup() {
  try {
    if (fs.existsSync(lockFilePath)) {
      fs.unlinkSync(lockFilePath);
      console.log('Lock file released');
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Function to acquire lock file
function acquireLockFile() {
  try {
    // Try to create lock file exclusively
    fs.writeFileSync(lockFilePath, process.pid.toString(), { flag: 'wx' });
    console.log('Lock file created successfully at:', lockFilePath);
    
    // Ensure cleanup happens on exit
    const events = ['exit', 'SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'];
    events.forEach(event => {
      process.on(event, (err) => {
        cleanup();
        if (err && err.stack) console.error('Uncaught exception:', err);
        if (event !== 'exit') process.exit(0);
      });
    });
    
    return true;
  } catch (error) {
    if (error.code === 'EEXIST') {
      console.log('Lock file already exists at:', lockFilePath);
      try {
        const existingPid = fs.readFileSync(lockFilePath, 'utf8');
        console.log('Existing PID in lock file:', existingPid);
        
        // Check if the process is still running
        try {
          process.kill(parseInt(existingPid), 0);
          console.log('Process with PID', existingPid, 'is still running');
        } catch (e) {
          console.log('Process with PID', existingPid, 'is not running, removing stale lock');
          fs.unlinkSync(lockFilePath);
          return acquireLockFile(); // Try again
        }
      } catch (readError) {
        console.error('Error reading existing lock file:', readError);
      }
      return false;
    }
    console.error('Error creating lock file:', error);
    return false;
  }
}

// Check if another instance is running
if (!gotTheLock) {
  console.log('Another instance is already running, focusing it...');
  app.quit();
  process.exit(0);
}

// Set up lock file as additional protection
if (!acquireLockFile()) {
  console.log('Could not acquire lock, another instance might be running');
  app.quit();
  process.exit(0);
}

console.log('This is the first instance, continuing...');

// Handle second instance - focus existing window instead of creating new one
app.on('second-instance', (event, commandLine, workingDirectory) => {
  console.log('Second instance detected, focusing existing window...');
  
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    mainWindow.show();
  }
});

// Window control handlers
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

function createMainWindow() {
  // Determine best available icon (prefer PNG timer-icon, fallback to others). If none, omit.

  mainWindow = new BrowserWindow({
    width: 500,
    height: 650,
    minWidth: 500,
    minHeight: 650,
    maxWidth: 500,
    maxHeight: 650,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
    },
    resizable: false,
    minimizable: true,
    maximizable: false,
    frame: false,
    title: 'Timer App',
    icon: path.join(__dirname, '../public/assets', 'icon.png'),
    backgroundColor: '#00000000', // fully transparent to remove corner artifacts
    transparent: true,
    hasShadow: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'public', 'index.html'));

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Hide menu bar for main window
  mainWindow.setMenuBarVisibility(false);
}

// ============================
// Timer Core (single source of truth)
// ============================
const timerCore = new TimerCore();
// Set a sensible default so initial UI has non-zero time
try { timerCore.setTime(15, 0); } catch (_) {}

function broadcastTimerUpdate(state) {
  try {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('main-timer-update', state);
    }
  } catch (_) {}
  try {
    if (pipWindow && pipWindow.webContents) {
      pipWindow.webContents.send('main-timer-update', state);
    }
  } catch (_) {}
  try {
    tinyWindows.forEach(tw => {
      if (tw && !tw.isDestroyed() && tw.webContents) {
        tw.webContents.send('main-timer-update', state);
      }
    });
  } catch (_) {}
}

timerCore.on('update', (state) => {
  broadcastTimerUpdate(state);
});

timerCore.on('complete', (state) => {
  // Send a native notification safely
  try {
    if (Notification && Notification.isSupported()) {
      const n = new Notification({ title: 'Timer Complete!', body: 'Your timer has finished!' });
      n.show();
    }
  } catch (_) {}
  try { recordCompletedSession(state); } catch (_) {}
  broadcastTimerUpdate(state);
});

// IPC to control TimerCore from renderers
ipcMain.handle('timer-core:get-state', () => timerCore.getState());
ipcMain.handle('timer-core:start', () => { timerCore.start(); return true; });
ipcMain.handle('timer-core:pause', () => { timerCore.pause(); return true; });
ipcMain.handle('timer-core:reset', () => { timerCore.reset(); return true; });
ipcMain.handle('timer-core:set-time', (_e, minutes, seconds) => { timerCore.setTime(minutes, seconds); return true; });

function createPipWindow() {
  // Prevent opening PiP if tiny windows exist
  if (tinyWindows.length > 0) {
    console.log('Cannot open PiP mode: Tiny mode is already active');
    return;
  }
  
  if (pipWindow) {
    pipWindow.focus();
    return;
  }

  pipWindow = new BrowserWindow({
    width: 110,
    height: 54,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
    },
    useContentSize: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    title: 'Timer - PiP',
    frame: false,
    transparent: true,
    minWidth: 100,
    minHeight: 43,
    maxWidth: 180,
    maxHeight: 150,
    cornerRadius: 12 // Round the Electron window itself
  });

  pipWindow.loadFile(path.join(__dirname, '..', 'public', 'pip.html'));

  // After load, measure content size and size window tightly to remove any extra bars/side gaps
  pipWindow.webContents.on('did-finish-load', () => {
    try {
      const sizeScript = `({
        w: Math.ceil(document.body.scrollWidth),
        h: Math.ceil(document.body.scrollHeight)
      })`;
      pipWindow.webContents.executeJavaScript(sizeScript).then((dim) => {
        const contentWidth = Number(dim && dim.w) || 140;
        const contentHeight = Number(dim && dim.h) || 60;
        const safeW = Math.max(100, Math.min(180, contentWidth));
        const safeH = Math.max(38, Math.min(150, contentHeight));
        const { x, y } = getBottomRightPosition(safeW, safeH);
        pipWindow.setBounds({ x, y, width: safeW, height: safeH });
      }).catch(() => {});
      // Push current timer state immediately
      try {
        if (pipWindow && pipWindow.webContents) {
          pipWindow.webContents.send('main-timer-update', timerCore.getState());
        }
      } catch (_) {}
      // Provide initial theme payload if available
      if (currentThemePayload) {
        pipWindow.webContents.send('theme:sync', currentThemePayload);
      }
    } catch (_) {}
  });

  // Forward focus/blur state to the PiP renderer so it can show/hide close button
  pipWindow.on('focus', () => {
    try {
      if (pipWindow && pipWindow.webContents) {
        pipWindow.webContents.send('window-active', true);
        console.log('PiP window is active');
      }
    } catch (_) {}
  });
  pipWindow.on('blur', () => {
    try {
      if (pipWindow && pipWindow.webContents) {
        pipWindow.webContents.send('window-active', false);
        console.log('PiP window is inactive');
      }
    } catch (_) {}
  });

  pipWindow.on('closed', () => {
    pipWindow = null;
    console.log('PiP window closed');
  });

  // Make PiP window draggable
  pipWindow.setMovable(true);

  // Position at bottom-right corner with minimal margin
  const { width: initialWidth, height: initialHeight } = pipWindow.getBounds();
  const { x, y } = getBottomRightPosition(initialWidth, initialHeight);
  pipWindow.setPosition(x, y);

  // Minimize main window when PiP opens
  if (mainWindow) {
    mainWindow.minimize();
  }

  // Request and forward current timer state from main window to PiP
  setTimeout(() => {
    if (mainWindow && mainWindow.webContents) {
      // Request timer state and forward to PiP when received
      mainWindow.webContents.send('request-timer-state-for-pip');
    }
  }, 20);
}

function createTinyWindow() {
  // Prevent opening tiny mode if PiP window exists
  if (pipWindow) {
    console.log('Cannot open Tiny mode: PiP mode is already active');
    return;
  }
  
  // Prevent multiple tiny windows
  if (tinyWindows.length > 0) {
    console.log('Tiny mode window already exists, focusing existing window');
    tinyWindows[0].focus();
    return;
  }
  
  // Create a new tiny window (not reusing PiP window)
  const tinyWindow = new BrowserWindow({
    width: 85,
    height: 60,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
    },
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    title: 'Timer - Tiny',
    frame: false,
    transparent: true,
    focusable: true,
    acceptFirstMouse: true,
    minWidth: 85,
    minHeight: 65,
    maxWidth: 85,
    maxHeight: 65,
    cornerRadius: 12 // Round the Electron window itself
  });

  tinyWindow.loadFile(path.join(__dirname, '..', 'public', 'tiny.html'));

  // After the tiny window finishes loading, send its current focus state
  tinyWindow.webContents.on('did-finish-load', () => {
    try {
      const isFocused = tinyWindow.isFocused();
      if (tinyWindow && tinyWindow.webContents) {
        tinyWindow.webContents.send('window-active', isFocused);
        // Provide initial theme payload if available
        if (currentThemePayload) {
          tinyWindow.webContents.send('theme:sync', currentThemePayload);
        }
        console.log('Tiny window initial focus state sent:', isFocused);
        // Also push current timer state immediately
        try { tinyWindow.webContents.send('main-timer-update', timerCore.getState()); } catch (_) {}
      }
    } catch (_) {}
  });

  tinyWindow.on('closed', () => {
    // Remove from tracking array when closed
    const index = tinyWindows.indexOf(tinyWindow);
    if (index > -1) {
      tinyWindows.splice(index, 1);
      console.log('Tiny window closed, remaining windows:', tinyWindows.length);
    }
  });

  // Add to tracking array
  tinyWindows.push(tinyWindow);

  // Forward focus/blur state to the tiny renderer so it can show/hide controls
  tinyWindow.on('focus', () => {
    try {
      if (tinyWindow && tinyWindow.webContents) {
        tinyWindow.webContents.send('window-active', true);
        console.log('Tiny window is active');
      }
    } catch (_) {}
  });
  tinyWindow.on('blur', () => {
    try {
      if (tinyWindow && tinyWindow.webContents) {
        tinyWindow.webContents.send('window-active', false);
        console.log('Tiny window is inactive');
      }
    } catch (_) {}
  });

  // Send initial timer state to the new tiny window after a short delay
  setTimeout(() => {
    // Get current timer state from main window and send to tiny window
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('request-timer-state-for-tiny');
    }
  }, 20); // Reduced delay to match PiP timing

  // Make tiny window draggable
  tinyWindow.setMovable(true);

  // Minimize main window when Tiny mode opens
  if (mainWindow) {
    mainWindow.minimize();
    // Auto-start timer when tiny mode opens
    setTimeout(() => {
      if (mainWindow && mainWindow.webContents) {
        console.log('Sending auto-start-timer command to main window');
        mainWindow.webContents.send('auto-start-timer');
      }
    }, 500);
  }
  
  // Position at bottom-right corner with minimal margin
  const { width: tinyWidth, height: tinyHeight } = tinyWindow.getBounds();
  const { x, y } = getBottomRightPosition(tinyWidth, tinyHeight);
  tinyWindow.setPosition(x, y);
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Picture in Picture',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            createPipWindow();
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  app.setName('Timer App');
  // On Linux, set desktop name so DEs can associate the running app with the .desktop entry
  try {
    if (process.platform === 'linux' && typeof app.setDesktopName === 'function') {
      // Match the desktop file name installed by PKGBUILD
      app.setDesktopName('timer-app.desktop');
    }
  } catch (_) { /* ignore */ }
  createMainWindow();
  createMenu();

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    createPipWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  try { globalShortcut.unregister('CommandOrControl+Shift+P'); } catch (_) {}
  try { globalShortcut.unregisterAll(); } catch (_) {}
});

// IPC handlers for timer functionality
ipcMain.handle('open-pip-window', () => {
  createPipWindow();
  return true;
});

ipcMain.handle('open-tiny-window', () => {
  createTinyWindow();
  return true;
});

ipcMain.handle('theme:update-aux-windows', (_event, payload) => {
  currentThemePayload = payload;
  if (pipWindow && !pipWindow.isDestroyed()) {
    try { pipWindow.webContents.send('theme:sync', payload); } catch (_) {}
  }
  tinyWindows.forEach((tiny) => {
    if (tiny && !tiny.isDestroyed()) {
      try { tiny.webContents.send('theme:sync', payload); } catch (_) {}
    }
  });
  return true;
});

ipcMain.handle('theme:request-current', () => currentThemePayload);

ipcMain.handle('theme:cycle', (_event, direction = 1) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try { mainWindow.webContents.send('cycle-theme', direction); } catch (_) {}
  }
  return true;
});

ipcMain.handle('analytics:get', () => {
  return loadAnalytics();
});

ipcMain.handle('analytics:delete-session', (_event, payload) => {
  try {
    const id = payload && payload.id;
    if (!id || typeof id !== 'string') return false;
    const analytics = loadAnalytics();
    const before = analytics.sessions.length;
    analytics.sessions = analytics.sessions.filter(s => s && s.id !== id);
    if (analytics.sessions.length === before) return false;
    saveAnalytics(analytics);
    return true;
  } catch (_) {
    return false;
  }
});

// Get the path to the config file
function getConfigPath() {
  return path.join(app.getPath('userData'), 'preferred-times.json');
}

// Load preferred times from file
function loadPreferredTimes() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading preferred times:', error);
  }
  
  // Return default times if file doesn't exist or is corrupted
  return [
    { name: 'Fifteen', minutes: 15 },
    { name: 'Hour', minutes: 60 },
    { name: 'TwentyFive', minutes: 25 },
    { name: 'FortyFive', minutes: 45 }
  ];
}

function normalizePreferredTimeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const nameRaw = entry.name;
  const minutesRaw = entry.minutes;

  const name = String(nameRaw ?? '').trim().slice(0, 40);
  const minutes = Math.max(1, Math.min(999, parseInt(minutesRaw, 10) || 0));

  if (!name) return null;
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return { name, minutes };
}

// Save preferred times to file
function savePreferredTimes(times) {
  try {
    const configPath = getConfigPath();
    const normalized = Array.isArray(times)
      ? times.map(normalizePreferredTimeEntry).filter(Boolean)
      : [];
    fs.writeFileSync(configPath, JSON.stringify(normalized, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving preferred times:', error);
    return false;
  }
}

ipcMain.handle('get-preferred-times', () => {
  return loadPreferredTimes();
});

ipcMain.handle('save-preferred-time', (event, timeData) => {
  try {
    const currentTimes = loadPreferredTimes();
    const normalized = normalizePreferredTimeEntry(timeData);
    if (!normalized) return false;
    currentTimes.push(normalized);
    const success = savePreferredTimes(currentTimes);
    console.log('Saving preferred time:', timeData, 'Success:', success);
    return success;
  } catch (error) {
    console.error('Error saving preferred time:', error);
    return false;
  }
});

ipcMain.handle('delete-preferred-time', (event, index) => {
  try {
    const currentTimes = loadPreferredTimes();
    if (index >= 0 && index < currentTimes.length) {
      currentTimes.splice(index, 1);
      const success = savePreferredTimes(currentTimes);
      console.log('Deleting preferred time at index:', index, 'Success:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('Error deleting preferred time:', error);
    return false;
  }
});

ipcMain.handle('close-pip', () => {
  if (pipWindow) {
    pipWindow.close();
  }
});

ipcMain.handle('close-tiny-window', (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.close();
    }
  } catch (_) {}
  return true;
});

ipcMain.handle('resize-pip-window', (event, width, height) => {
  if (pipWindow) {
    const safeW = Math.max(80, Math.round(Number(width) || 0));
    const safeH = Math.max(60, Math.round(Number(height) || 0));
    pipWindow.setSize(safeW, safeH);
    const { x, y } = getBottomRightPosition(safeW, safeH);
    pipWindow.setPosition(x, y);
  }
  return true;
});

// New IPC handlers for timer synchronization
ipcMain.handle('get-timer-state', () => {
  // Return centralized core state
  return timerCore.getState();
});

// New IPC handler to request timer state from main window
ipcMain.handle('request-timer-state-from-main', () => {
  // Broadcast current core state to all windows
  try { broadcastTimerUpdate(timerCore.getState()); } catch (_) {}
  return true;
});

// (Removed duplicate window control IPC handlers to prevent conflicts)

// Notification IPC: show native notification from renderer
ipcMain.on('show-notification', (event, title, body) => {
  try {
    if (Notification && Notification.isSupported()) {
      const n = new Notification({ title: String(title || 'Notification'), body: String(body || '') });
      n.show();
    }
  } catch (err) {
    console.error('Failed to show notification:', err);
  }
});

ipcMain.handle('update-timer-from-pip', (event, update) => {
  try {
    if (!update || typeof update !== 'object') return true;
    const action = update.action;
    if (action === 'start') {
      timerCore.start();
    } else if (action === 'pause') {
      timerCore.pause();
    } else if (action === 'reset') {
      timerCore.reset();
    } else if (action === 'setTime') {
      const m = parseInt(update.minutes) || 0;
      const s = parseInt(update.seconds) || 0;
      timerCore.setTime(m, s);
    }
  } catch (_) {}
  return true;
});

// Send timer updates to PiP window when main timer changes
ipcMain.handle('send-timer-update-to-pip', (event, timerState) => {
  if (pipWindow && pipWindow.webContents) {
    pipWindow.webContents.send('main-timer-update', timerState);
  }
  
  // Also send updates to all tiny windows
  tinyWindows.forEach(tinyWindow => {
    if (tinyWindow && !tinyWindow.isDestroyed() && tinyWindow.webContents) {
      tinyWindow.webContents.send('main-timer-update', timerState);
    }
  });
  
  return true;
});

// Handle timer state forwarding to specific windows
ipcMain.handle('forward-timer-state-to-pip', (event, timerState) => {
  if (pipWindow && pipWindow.webContents) {
    pipWindow.webContents.send('main-timer-update', timerState);
  }
  return true;
});

ipcMain.handle('forward-timer-state-to-tiny', (event, timerState) => {
  // Send to all tiny windows
  tinyWindows.forEach(tinyWindow => {
    if (tinyWindow && !tinyWindow.isDestroyed() && tinyWindow.webContents) {
      tinyWindow.webContents.send('main-timer-update', timerState);
    }
  });
  return true;
});
