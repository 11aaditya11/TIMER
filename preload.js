const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Timer functionality
  getPreferredTimes: () => ipcRenderer.invoke('get-preferred-times'),
  savePreferredTime: (timeData) => ipcRenderer.invoke('save-preferred-time', timeData),
  deletePreferredTime: (index) => ipcRenderer.invoke('delete-preferred-time', index),
  
  // PiP functionality
  openPipWindow: () => ipcRenderer.invoke('open-pip-window'),
  openTinyWindow: () => ipcRenderer.invoke('open-tiny-window'),
  closePip: () => ipcRenderer.invoke('close-pip'),
  closeTinyWindow: () => ipcRenderer.invoke('close-tiny-window'),
  resizePipWindow: (width, height) => ipcRenderer.invoke('resize-pip-window', width, height),
  
  // Timer synchronization
  getTimerState: () => ipcRenderer.invoke('get-timer-state'),
  requestTimerStateFromMain: () => ipcRenderer.invoke('request-timer-state-from-main'),
  updateTimerFromPip: (update) => ipcRenderer.invoke('update-timer-from-pip', update),
  sendTimerUpdateToPip: (timerState) => ipcRenderer.invoke('send-timer-update-to-pip', timerState),
  
  // Window management
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body),
  
  // Listeners for timer updates
  onMainTimerUpdate: (callback) => ipcRenderer.on('main-timer-update', callback),
  onPipTimerUpdate: (callback) => ipcRenderer.on('pip-timer-update', callback),
  onRequestTimerState: (callback) => ipcRenderer.on('request-timer-state', callback)
});
