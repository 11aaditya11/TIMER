class TinyTimer {
    constructor() {
        this.timeLeft = 1500; // Default 25 minutes
        this.totalTime = 1500;
        this.isRunning = false;
        this.interval = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupIpcListeners();
        this.updateDisplay();
        this.startSync();
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('tinyTimeDisplay');
        this.closeBtn = document.getElementById('tinyCloseBtn');
    }

    setupEventListeners() {
        this.closeBtn.addEventListener('click', () => this.closeTinyWindow());
    }

    setupIpcListeners() {
        try {
            // Listen for updates from main window
            window.electronAPI.onMainTimerUpdate((event, timerState) => {
                console.log('Tiny window received timer update:', timerState);
                this.updateFromMainWindow(timerState);
            });
        } catch (error) {
            console.log('Could not set up main window update listener:', error);
        }
    }

    startSync() {
        // Initial sync only - don't keep polling
        this.syncWithMainWindow();
    }

    async syncWithMainWindow() {
        try {
            // Only do initial sync, real updates come via IPC
            console.log('Initial tiny window sync');
        } catch (error) {
            console.log('Could not sync with main window:', error);
        }
    }

    updateFromMainWindow(timerState) {
        console.log('Tiny window updating from main:', timerState);
        
        if (!timerState || typeof timerState !== 'object') {
            console.log('Invalid timer state received');
            return;
        }
        
        const wasRunning = this.isRunning;
        
        this.timeLeft = timerState.timeLeft || 0;
        this.totalTime = timerState.totalTime || 0;
        this.isRunning = timerState.isRunning || false;
        
        console.log('Tiny window new state:', { timeLeft: this.timeLeft, isRunning: this.isRunning });
        
        this.updateDisplay();
        this.updateButtonStates();
        
        // Handle timer state changes
        if (this.isRunning && !wasRunning) {
            console.log('Starting local timer in tiny window');
            this.startLocalTimer();
        } else if (!this.isRunning && wasRunning) {
            console.log('Stopping local timer in tiny window');
            this.stopLocalTimer();
        }
    }

    startLocalTimer() {
        if (this.interval) return; // Already running
        
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
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

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateButtonStates() {
        // No buttons to update in tiny mode
    }

    timerComplete() {
        this.stopLocalTimer();
        this.timeDisplay.classList.add('tiny-timer-complete');
        
        // Play notification sound
        this.playNotificationSound();
        
        setTimeout(() => {
            this.timeDisplay.classList.remove('tiny-timer-complete');
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

    closeTinyWindow() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        
        try {
            window.electronAPI.closeTinyWindow();
        } catch (error) {
            window.close();
        }
    }

    // Method to set time from external source
    setTime(minutes, seconds) {
        this.timeLeft = minutes * 60 + seconds;
        this.totalTime = this.timeLeft;
        this.updateDisplay();
        this.resetTimer();
    }

    resetTimer() {
        this.stopLocalTimer();
        this.timeLeft = this.totalTime;
        this.updateDisplay();
    }
}

// Initialize the tiny timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tinyTimer = new TinyTimer();
});

// Handle window close
window.addEventListener('beforeunload', () => {
    if (window.tinyTimer) {
        window.tinyTimer.closeTinyWindow();
    }
});
