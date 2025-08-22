class PiPTimer {
    constructor() {
        this.timeLeft = 1500; // Default 25 minutes
        this.totalTime = 1500;
        this.isRunning = false;
        this.interval = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupIpcListeners();
        this.updateDisplay();
        this.updateProgress();
        this.startSync();
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('pipTimeDisplay');
        this.progressBar = document.getElementById('pipProgressBar');
        this.startBtn = document.getElementById('pipStartBtn');
        this.pauseBtn = document.getElementById('pipPauseBtn');
        this.resetBtn = document.getElementById('pipResetBtn');
        this.closeBtn = document.getElementById('pipCloseBtn');
        this.tinyToggle = document.getElementById('pipTinyToggle');
        this.pipHeader = document.querySelector('.pip-header');
        this.pipControls = document.querySelector('.pip-controls');
        this.pipProgress = document.querySelector('.pip-progress');
        this.pipContainer = document.querySelector('.pip-container');
        
        // Initialize tiny mode state
        this.isTinyMode = false;
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.closeBtn.addEventListener('click', () => this.closePiP());
        this.tinyToggle.addEventListener('click', () => this.toggleTinyMode());
    }

    setupIpcListeners() {
        try {
            // Listen for updates from main window
            window.electronAPI.onMainTimerUpdate((event, timerState) => {
                this.updateFromMainWindow(timerState);
            });
        } catch (error) {
            console.log('Could not set up main window update listener');
        }
    }

    startSync() {
        // Initial sync only - don't keep polling
        this.syncWithMainWindow();
    }

    async syncWithMainWindow() {
        try {
            // Only do initial sync, real updates come via IPC
            console.log('Initial PiP sync');
        } catch (error) {
            console.log('Could not sync with main window:', error);
        }
    }

    updateFromMainWindow(timerState) {
        if (!timerState || typeof timerState !== 'object') return;
        
        const wasRunning = this.isRunning;
        
        this.timeLeft = timerState.timeLeft || 0;
        this.totalTime = timerState.totalTime || 0;
        this.isRunning = timerState.isRunning || false;
        
        this.updateDisplay();
        this.updateProgress();
        this.updateButtonStates();
        
        // Handle timer state changes
        if (this.isRunning && !wasRunning) {
            this.startLocalTimer();
        } else if (!this.isRunning && wasRunning) {
            this.stopLocalTimer();
        }
    }

    startLocalTimer() {
        if (this.interval) return; // Already running
        
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgress();
            
            if (this.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    stopLocalTimer() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    startTimer() {
        if (this.timeLeft <= 0) return;
        
        this.isRunning = true;
        this.updateButtonStates();
        this.startLocalTimer();
        
        // Notify main window
        this.notifyMainWindow('start');
    }

    pauseTimer() {
        this.isRunning = false;
        this.updateButtonStates();
        this.stopLocalTimer();
        
        // Notify main window
        this.notifyMainWindow('pause');
    }

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        this.updateProgress();
        this.updateButtonStates();
        
        // Notify main window
        this.notifyMainWindow('reset');
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateProgress() {
        if (this.totalTime === 0) return;
        
        const progress = (this.totalTime - this.timeLeft) / this.totalTime;
        this.progressBar.style.width = `${progress * 100}%`;
    }

    updateButtonStates() {
        this.startBtn.disabled = this.isRunning;
        this.pauseBtn.disabled = !this.isRunning;
    }

    timerComplete() {
        this.pauseTimer();
        this.timeDisplay.classList.add('pip-timer-complete');
        
        // Play notification sound
        this.playNotificationSound();
        
        setTimeout(() => {
            this.timeDisplay.classList.remove('pip-timer-complete');
        }, 1000);
    }

    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    async notifyMainWindow(action) {
        try {
            await window.electronAPI.updateTimerFromPip({ action });
        } catch (error) {
            console.log('Could not notify main window:', error);
        }
    }

    closePiP() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        
        try {
            window.electronAPI.closePip();
        } catch (error) {
            window.close();
        }
    }

    // Method to set time from external source
    setTime(minutes, seconds) {
        this.timeLeft = minutes * 60 + seconds;
        this.totalTime = this.timeLeft;
        this.updateDisplay();
        this.updateProgress();
        this.resetTimer();
    }

    // Toggle tiny mode - show only the time
    toggleTinyMode() {
        this.isTinyMode = !this.isTinyMode;
        
        if (this.isTinyMode) {
            // Hide all elements except time display
            this.pipHeader.style.display = 'none';
            this.pipControls.style.display = 'none';
            this.pipProgress.style.display = 'none';
            this.tinyToggle.textContent = '🔍';
            this.tinyToggle.title = 'Show Full Mode';
            
            // Add tiny mode class to container
            this.pipContainer.classList.add('tiny-mode');
            
            // Make the window smaller and centered
            this.resizeForTinyMode();
        } else {
            // Show all elements
            this.pipHeader.style.display = 'flex';
            this.pipControls.style.display = 'flex';
            this.pipProgress.style.display = 'block';
            this.tinyToggle.textContent = '🔍';
            this.tinyToggle.title = 'Toggle Tiny Mode';
            
            // Remove tiny mode class from container
            this.pipContainer.classList.remove('tiny-mode');
            
            // Restore normal size
            this.restoreNormalSize();
        }
    }

    // Resize window for tiny mode
    resizeForTinyMode() {
        try {
            // Request main process to resize window - make it much smaller
            window.electronAPI.resizePipWindow(80, 60);
        } catch (error) {
            console.log('Could not resize window for tiny mode');
        }
    }

    // Restore normal window size
    restoreNormalSize() {
        try {
            // Request main process to restore normal size
            window.electronAPI.resizePipWindow(200, 130);
        } catch (error) {
            console.log('Could not restore normal window size');
        }
    }
}

// Initialize the PiP timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.pipTimer = new PiPTimer();
});

// Handle window close
window.addEventListener('beforeunload', () => {
    if (window.pipTimer) {
        window.pipTimer.closePiP();
    }
});
