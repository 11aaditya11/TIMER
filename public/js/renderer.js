class Timer {
    constructor() {
        this.timeLeft = 0;
        this.totalTime = 0;
        this.isRunning = false;
        this.interval = null;
        this.preferredTimes = [];
        
        this.initializeElements();
        this.loadPreferredTimes();
        this.setupEventListeners();
        this.setDefaultTime(25, 0);
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('timeDisplay');
        this.progressCircle = document.getElementById('progressCircle');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.presetGrid = document.getElementById('presetGrid');
        this.minutesInput = document.getElementById('minutesInput');
        this.secondsInput = document.getElementById('secondsInput');
        this.setTimeBtn = document.getElementById('setTimeBtn');
        this.presetNameInput = document.getElementById('presetNameInput');
        this.presetMinutesInput = document.getElementById('presetMinutesInput');
        this.addPresetBtn = document.getElementById('addPresetBtn');
        this.pipBtn = document.getElementById('pipBtn');
        this.tinyBtn = document.getElementById('tinyBtn');
    }

    async loadPreferredTimes() {
        try {
            this.preferredTimes = await window.electronAPI.getPreferredTimes();
            this.renderPresetTimes();
        } catch (error) {
            console.error('Failed to load preferred times:', error);
            // Fallback to default times
            this.preferredTimes = [
                { name: 'Quick Break', minutes: 5 },
                { name: 'Pomodoro', minutes: 25 },
                { name: 'Long Break', minutes: 15 },
                { name: 'Deep Work', minutes: 90 }
            ];
            this.renderPresetTimes();
        }
    }

    renderPresetTimes() {
        this.presetGrid.innerHTML = '';
        this.preferredTimes.forEach((preset, index) => {
            const presetContainer = document.createElement('div');
            presetContainer.className = 'preset-container';
            
            const presetBtn = document.createElement('div');
            presetBtn.className = 'preset-btn';
            presetBtn.innerHTML = `
                <div class="preset-name">${preset.name}</div>
                <div class="preset-time">${preset.minutes}:00</div>
            `;
            presetBtn.addEventListener('click', () => {
                this.setTime(preset.minutes, 0);
                this.startTimer();
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'preset-delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Delete preset';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the preset button
                this.deletePreset(index);
            });
            
            presetContainer.appendChild(presetBtn);
            presetContainer.appendChild(deleteBtn);
            this.presetGrid.appendChild(presetContainer);
        });
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.setTimeBtn.addEventListener('click', () => this.setCustomTime());
        this.addPresetBtn.addEventListener('click', () => this.addPreferredTime());
        this.pipBtn.addEventListener('click', () => this.openPiP());
        this.tinyBtn.addEventListener('click', () => this.openTinyMode());

        // Enter key support for inputs
        this.minutesInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setCustomTime();
        });
        this.secondsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setCustomTime();
        });
        this.presetNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPreferredTime();
        });
        this.presetMinutesInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPreferredTime();
        });
    }

    setDefaultTime(minutes, seconds) {
        this.setTime(minutes, seconds);
    }

    setTime(minutes, seconds) {
        this.timeLeft = minutes * 60 + seconds;
        this.totalTime = this.timeLeft;
        this.updateDisplay();
        this.updateProgress();
        this.resetTimer();
        
        // Send update to PiP window
        this.sendUpdateToPip();
    }

    setCustomTime() {
        const minutes = parseInt(this.minutesInput.value) || 0;
        const seconds = parseInt(this.secondsInput.value) || 0;
        
        if (minutes === 0 && seconds === 0) {
            alert('Please enter a valid time');
            return;
        }
        
        this.setTime(minutes, seconds);
        this.minutesInput.value = '';
        this.secondsInput.value = '';
    }

    async addPreferredTime() {
        const name = this.presetNameInput.value.trim();
        const minutes = parseInt(this.presetMinutesInput.value);
        
        if (!name || !minutes || minutes <= 0) {
            alert('Please enter a valid name and time');
            return;
        }
        
        const newPreset = { name, minutes };
        this.preferredTimes.push(newPreset);
        
        try {
            await window.electronAPI.savePreferredTime(newPreset);
        } catch (error) {
            console.error('Failed to save preferred time:', error);
        }
        
        this.renderPresetTimes();
        this.presetNameInput.value = '';
        this.presetMinutesInput.value = '';
    }

    async deletePreset(index) {
        if (index < 0 || index >= this.preferredTimes.length) {
            console.error('Invalid preset index:', index);
            return;
        }
        
        const preset = this.preferredTimes[index];
        if (confirm(`Are you sure you want to delete "${preset.name}"?`)) {
            try {
                const success = await window.electronAPI.deletePreferredTime(index);
                if (success) {
                    this.preferredTimes.splice(index, 1);
                    this.renderPresetTimes();
                } else {
                    alert('Failed to delete preset');
                }
            } catch (error) {
                console.error('Failed to delete preferred time:', error);
                alert('Failed to delete preset');
            }
        }
    }

    startTimer() {
        if (this.timeLeft <= 0) return;
        
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        console.log('Timer started, timeLeft:', this.timeLeft);
        
        // Use a more precise timer implementation
        const startTime = Date.now();
        const targetTime = startTime + (this.timeLeft * 1000);
        
        this.interval = setInterval(() => {
            const currentTime = Date.now();
            const elapsed = Math.floor((currentTime - startTime) / 1000);
            this.timeLeft = Math.max(0, this.totalTime - elapsed);
            
            this.updateDisplay();
            this.updateProgress();
            
            // Send update to PiP window (only every 5 seconds to reduce IPC overhead)
            if (this.timeLeft % 5 === 0 || this.timeLeft <= 10) {
                this.sendUpdateToPip();
            }
            
            if (this.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        // Send update to PiP window
        this.sendUpdateToPip();
    }

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        this.updateProgress();
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        // Send update to PiP window
        this.sendUpdateToPip();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const displayText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.timeDisplay.textContent = displayText;
        
        // Debug: log every 10 seconds to check timing
        if (this.timeLeft % 10 === 0) {
            console.log('Timer update:', displayText, 'at', new Date().toLocaleTimeString());
        }
    }

    updateProgress() {
        if (this.totalTime === 0) return;
        
        const progress = (this.totalTime - this.timeLeft) / this.totalTime;
        const circumference = 2 * Math.PI * 90; // r = 90
        const offset = circumference - (progress * circumference);
        
        this.progressCircle.style.strokeDashoffset = offset;
    }

    timerComplete() {
        this.pauseTimer();
        this.timeDisplay.classList.add('timer-complete');
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
                body: 'Your timer has finished!',
                icon: '/assets/icon.png'
            });
        }
        
        // Play sound (you can add an audio file)
        this.playNotificationSound();
        
        setTimeout(() => {
            this.timeDisplay.classList.remove('timer-complete');
        }, 1000);
    }

    playNotificationSound() {
        // Create a simple beep sound
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
    }

    openPiP() {
        // Request the main process to open PiP window
        try {
            window.electronAPI.openPipWindow();
        } catch (error) {
            console.error('Failed to open PiP window:', error);
            // Fallback: show message to user
            alert('Use Ctrl+Shift+P or menu to open Picture in Picture');
        }
    }

    openTinyMode() {
        // Request the main process to open tiny mode window
        try {
            window.electronAPI.openTinyWindow();
        } catch (error) {
            console.error('Failed to open tiny window:', error);
            // Fallback: show message to user
            alert('Failed to open tiny mode window');
        }
    }

    // Method to sync with PiP window
    syncWithPiP() {
        // This will be called by the PiP window to sync timer state
        return {
            timeLeft: this.timeLeft,
            totalTime: this.totalTime,
            isRunning: this.isRunning
        };
    }

    // Method to receive updates from PiP window
    receivePiPUpdate(update) {
        if (update.action === 'start') {
            this.startTimer();
        } else if (update.action === 'pause') {
            this.pauseTimer();
        } else if (update.action === 'reset') {
            this.resetTimer();
        } else if (update.action === 'setTime') {
            this.setTime(update.minutes, update.seconds);
        }
    }

    // New method to send updates to PiP window
    sendUpdateToPip() {
        try {
            window.electronAPI.sendTimerUpdateToPip({
                timeLeft: this.timeLeft,
                totalTime: this.totalTime,
                isRunning: this.isRunning
            });
        } catch (error) {
            console.log('Could not send update to PiP window');
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Create and start the timer
    window.timer = new Timer();
    
    // Set up IPC listeners for PiP communication
    try {
        window.electronAPI.onPipTimerUpdate((event, update) => {
            window.timer.receivePiPUpdate(update);
        });
        
        // Listen for timer state requests from other windows
        window.electronAPI.onRequestTimerState((event) => {
            // Send current timer state to all other windows
            window.timer.sendUpdateToPip();
        });
    } catch (error) {
        console.log('Could not set up PiP update listener');
    }
});

// Listen for messages from PiP window
window.addEventListener('message', (event) => {
    if (event.source === window && event.data.type === 'pip-update') {
        window.timer.receivePiPUpdate(event.data.update);
    }
});
