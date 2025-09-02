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
        this.setDefaultTime(15, 0);
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
        this.closeBtn = document.getElementById('closeBtn');
        this.minBtn = document.getElementById('minBtn');
        this.backBtn = document.getElementById('backBtn');

        // Tabs
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabPanels = document.querySelectorAll('.tab-panel');
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
        if (this.minBtn) {
            this.minBtn.addEventListener('click', () => {
                try {
                    window.electronAPI.minimize();
                } catch (e) {
                    // no-op in non-electron env
                }
            });
        }
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                try {
                    window.electronAPI.close();
                } catch (e) {
                    window.close();
                }
            });
        }

        // Tab switching
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-tab');
                this.tabButtons.forEach(b => b.classList.remove('active'));
                this.tabPanels.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const panel = document.getElementById(target);
                if (panel) panel.classList.add('active');
            });
        });

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

        // Back button event listener
        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => {
                // Switch back to timer tab
                this.tabButtons.forEach(b => b.classList.remove('active'));
                this.tabPanels.forEach(p => p.classList.remove('active'));
                
                // Activate timer tab
                const timerPanel = document.getElementById('tab-timer');
                if (timerPanel) timerPanel.classList.add('active');
            });
        }
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
        if (this.timeLeft <= 0 || this.isRunning) return;

        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;

        // Countdown based on target timestamp so pause/resume preserves remaining time
        const targetTime = Date.now() + (this.timeLeft * 1000);

        // Clear any existing interval defensively
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        // Send immediate update so PiP/Tiny reflect state without delay
        this.sendUpdateToPip();

        this.interval = setInterval(() => {
            const currentTime = Date.now();
            const remainingSeconds = Math.ceil((targetTime - currentTime) / 1000);
            this.timeLeft = Math.max(0, remainingSeconds);

            this.updateDisplay();
            this.updateProgress();

            // Send update to PiP/Tiny every tick for snappier sync
            this.sendUpdateToPip();

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
        
        // Show confetti animation
        this.showConfetti();
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
                body: 'Your timer has finished!',
                icon: 'assets/icon.svg'
            });
        }
        
        // Play sound (you can add an audio file)
        this.playNotificationSound();
        
        setTimeout(() => {
            this.timeDisplay.classList.remove('timer-complete');
        }, 1000);
    }

    showConfetti() {
        // Create bang effect first
        this.createBangEffect();
        
        // Create main confetti container
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);

        // Vibrant color palette
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
            '#A3E4D7', '#F9E79F', '#FADBD8', '#D5DBDB', '#AED6F1',
            '#FF1744', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
            '#2196F3', '#03DAC6', '#4CAF50', '#8BC34A', '#CDDC39'
        ];

        // Create center burst confetti (300 pieces)
        for (let i = 0; i < 300; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece center-burst';
            
            // Random vibrant color
            const color = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.backgroundColor = color;
            
            // Center positioning for burst effect
            confetti.style.left = '50%';
            confetti.style.top = '50%';
            
            // Burst direction
            const angle = (Math.PI * 2 * i) / 300;
            const velocity = Math.random() * 200 + 100;
            confetti.style.setProperty('--burst-x', Math.cos(angle) * velocity + 'px');
            confetti.style.setProperty('--burst-y', Math.sin(angle) * velocity + 'px');
            
            // Stagger timing
            confetti.style.animationDelay = Math.random() * 0.3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            // Random shapes and sizes
            const size = Math.random() * 10 + 3;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            }
            
            confettiContainer.appendChild(confetti);
        }

        // Create side confetti (left side - 150 pieces)
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece side-left';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.backgroundColor = color;
            
            confetti.style.left = '-10px';
            confetti.style.top = Math.random() * 100 + '%';
            
            confetti.style.animationDelay = Math.random() * 1.5 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
            
            const size = Math.random() * 8 + 4;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            if (Math.random() > 0.6) {
                confetti.style.borderRadius = '50%';
            }
            
            confettiContainer.appendChild(confetti);
        }

        // Create side confetti (right side - 150 pieces)
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece side-right';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.backgroundColor = color;
            
            confetti.style.right = '-10px';
            confetti.style.top = Math.random() * 100 + '%';
            
            confetti.style.animationDelay = Math.random() * 1.5 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
            
            const size = Math.random() * 8 + 4;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            if (Math.random() > 0.6) {
                confetti.style.borderRadius = '50%';
            }
            
            confettiContainer.appendChild(confetti);
        }

        // Create top falling confetti (200 pieces)
        for (let i = 0; i < 200; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece top-fall';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.backgroundColor = color;
            
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-20px';
            
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
            
            const size = Math.random() * 8 + 4;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            if (Math.random() > 0.6) {
                confetti.style.borderRadius = '50%';
            }
            
            confettiContainer.appendChild(confetti);
        }

        // Remove confetti after animation
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.parentNode.removeChild(confettiContainer);
            }
        }, 8000);
    }

    createBangEffect() {
        // Create bang flash effect
        const bangFlash = document.createElement('div');
        bangFlash.className = 'bang-flash';
        document.body.appendChild(bangFlash);

        // Create expanding ring effect
        const bangRing = document.createElement('div');
        bangRing.className = 'bang-ring';
        document.body.appendChild(bangRing);

        // Remove bang effects after animation
        setTimeout(() => {
            if (bangFlash.parentNode) bangFlash.parentNode.removeChild(bangFlash);
            if (bangRing.parentNode) bangRing.parentNode.removeChild(bangRing);
        }, 1000);
    }

    playNotificationSound() {
        // Disabled sound for main window to avoid conflicts with confetti
        // Sound is still available in PiP and Tiny modes
        console.log('Sound disabled for main window');
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
    // Handle auto-start timer command from main process
    window.electronAPI.onAutoStartTimer(() => {
        console.log('Auto-start timer command received');
        if (!window.timer.isRunning) {
            console.log('Starting timer automatically');
            window.timer.startTimer();
        } else {
            console.log('Timer already running, skipping auto-start');
        }
    });
    
    // Listen for timer state requests from other windows
    window.electronAPI.onRequestTimerState((event) => {
        // Send current timer state to all other windows
        window.timer.sendUpdateToPip();
    });

    // Listen for specific timer state requests for PiP window
    window.electronAPI.onRequestTimerStateForPip(() => {
        const currentState = {
            timeLeft: window.timer.timeLeft,
            totalTime: window.timer.totalTime,
            isRunning: window.timer.isRunning
        };
        window.electronAPI.forwardTimerStateToPip(currentState);
    });

    // Listen for specific timer state requests for Tiny windows
    window.electronAPI.onRequestTimerStateForTiny(() => {
        const currentState = {
            timeLeft: window.timer.timeLeft,
            totalTime: window.timer.totalTime,
            isRunning: window.timer.isRunning
        };
        window.electronAPI.forwardTimerStateToTiny(currentState);
    });
});

// Listen for messages from PiP window
window.addEventListener('message', (event) => {
    if (event.source === window && event.data.type === 'pip-update') {
        window.timer.receivePiPUpdate(event.data.update);
    }
});
