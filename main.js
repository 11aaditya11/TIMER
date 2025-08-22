const { app, BrowserWindow, ipcMain, globalShortcut, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let pipWindow;
let tinyWindows = []; // Track all tiny windows

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    resizable: true,
    minimizable: true,
    maximizable: true,
    title: 'Timer App',
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createPipWindow() {
  if (pipWindow) {
    pipWindow.focus();
    return;
  }

  pipWindow = new BrowserWindow({
    width: 200,
    height: 130,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    resizable: true,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    title: 'Timer - PiP',
    frame: false,
    transparent: true,
    minWidth: 180,
    minHeight: 110
  });

  pipWindow.loadFile('pip.html');

  pipWindow.on('closed', () => {
    pipWindow = null;
  });

  // Make PiP window draggable
  pipWindow.setMovable(true);
}

function createTinyWindow() {
  // Create a new tiny window (not reusing PiP window)
  const tinyWindow = new BrowserWindow({
    width: 80,
    height: 60,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    title: 'Timer - Tiny',
    frame: false,
    transparent: true,
    minWidth: 80,
    minHeight: 60,
    maxWidth: 80,
    maxHeight: 60
  });

  tinyWindow.loadFile('tiny.html');

  tinyWindow.on('closed', () => {
    // Remove from tracking array when closed
    const index = tinyWindows.indexOf(tinyWindow);
    if (index > -1) {
      tinyWindows.splice(index, 1);
    }
  });

  // Add to tracking array
  tinyWindows.push(tinyWindow);

  // Send initial timer state to the new tiny window after a short delay
  setTimeout(() => {
    // Get current timer state from main window and send to tiny window
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('request-timer-state');
    }
  }, 1000); // Delay to ensure window is fully loaded

  // Make tiny window draggable
  tinyWindow.setMovable(true);
  
  // Center the window on screen
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const x = Math.round((screenWidth - 80) / 2);
  const y = Math.round((screenHeight - 60) / 2);
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

// IPC handlers for timer functionality
ipcMain.handle('open-pip-window', () => {
  createPipWindow();
  return true;
});

ipcMain.handle('open-tiny-window', () => {
  createTinyWindow();
  return true;
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
    { name: 'Quick Break', minutes: 5 },
    { name: 'Pomodoro', minutes: 25 },
    { name: 'Long Break', minutes: 15 },
    { name: 'Deep Work', minutes: 90 }
  ];
}

// Save preferred times to file
function savePreferredTimes(times) {
  try {
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(times, null, 2));
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
    currentTimes.push(timeData);
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
  // Close the window that sent this message
  if (event.sender) {
    event.sender.close();
  }
  return true;
});

ipcMain.handle('resize-pip-window', (event, width, height) => {
  if (pipWindow) {
    pipWindow.setSize(width, height);
    // Center the window on screen
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const x = Math.round((screenWidth - width) / 2);
    const y = Math.round((screenHeight - height) / 2);
    pipWindow.setPosition(x, y);
  }
  return true;
});

// New IPC handlers for timer synchronization
ipcMain.handle('get-timer-state', () => {
  // Return a safe default state instead of trying to execute JavaScript
  return { timeLeft: 0, totalTime: 0, isRunning: false };
});

// New IPC handler to request timer state from main window
ipcMain.handle('request-timer-state-from-main', () => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('request-timer-state');
  }
  return true;
});

ipcMain.handle('update-timer-from-pip', (event, update) => {
  // Send update to main window
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('pip-timer-update', update);
  }
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
