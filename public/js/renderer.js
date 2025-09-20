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
                { name: 'Fifteen', minutes: 15 },
                { name: 'Hour', minutes: 60 },
                { name: 'TwentyFive', minutes: 25 },
                { name: 'FortyFive', minutes: 45 }
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

        // In-app keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only trigger shortcuts when not typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                this.openPiP();
            } else if (e.key === 't' || e.key === 'T') {
                e.preventDefault();
                this.openTinyMode();
            }
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
                icon: 'assets/icon.png'
            });
        }
        
        // Play sound (you can add an audio file)
        this.playNotificationSound();
        
        setTimeout(() => {
            this.timeDisplay.classList.remove('timer-complete');
        }, 1000);
    }

    showConfetti() {
        // Middle bang removed per request (keep edge bursts only)

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

        // Helper to random pick
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        // Helper to assign varied shapes
        const assignShape = (el) => {
            const r = Math.random();
            if (r < 0.2) {
                el.classList.add('triangle');
            } else if (r < 0.4) {
                el.classList.add('diamond');
            } else if (r < 0.7) {
                el.style.borderRadius = '50%';
            } else if (r < 0.85) {
                el.style.borderRadius = '6px';
            } // else keep as square/rect
        };
        // Helper to varied size with a soft bias toward medium
        const randomSize = (min = 3, max = 14) => {
            const t = Math.random();
            const eased = Math.sqrt(t); // bias toward larger within range slightly
            return Math.round(min + (max - min) * (0.3 * t + 0.7 * (1 - Math.abs(0.5 - eased) * 2)));
        };

        // Center burst removed for a cleaner edge-focused celebration

        // Create side confetti (left side - 60 pieces)
        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece side-left';
            
            const color = pick(colors);
            confetti.style.backgroundColor = color;
            
            confetti.style.left = '-10px';
            confetti.style.top = Math.random() * 100 + '%';
            
            confetti.style.animationDelay = Math.random() * 1.6 + 's';
            // Mix of faster and slower particles
            const fast = Math.random() < 0.35;
            confetti.style.animationDuration = (fast ? Math.random() * 0.8 + 2.2 : Math.random() * 1.6 + 3.4) + 's';
            confetti.style.animationTimingFunction = fast ? 'ease-out' : 'ease-in-out';
            
            const size = randomSize(4, 10);
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            assignShape(confetti);
            
            confettiContainer.appendChild(confetti);
        }

        // Create side confetti (right side - 60 pieces)
        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece side-right';
            
            const color = pick(colors);
            confetti.style.backgroundColor = color;
            
            confetti.style.right = '-10px';
            confetti.style.top = Math.random() * 100 + '%';
            
            confetti.style.animationDelay = Math.random() * 1.6 + 's';
            const fastR = Math.random() < 0.35;
            confetti.style.animationDuration = (fastR ? Math.random() * 0.8 + 2.2 : Math.random() * 1.6 + 3.4) + 's';
            confetti.style.animationTimingFunction = fastR ? 'ease-out' : 'ease-in-out';
            
            const size = randomSize(4, 10);
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            assignShape(confetti);
            
            confettiContainer.appendChild(confetti);
        }

        // Create top falling confetti (100 pieces)
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece top-fall';
            
            const color = pick(colors);
            confetti.style.backgroundColor = color;
            
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-20px';
            
            confetti.style.animationDelay = Math.random() * 2.2 + 's';
            const fastT = Math.random() < 0.3;
            confetti.style.animationDuration = (fastT ? Math.random() * 0.8 + 2.8 : Math.random() * 2.2 + 4.2) + 's';
            confetti.style.animationTimingFunction = fastT ? 'ease-in' : 'ease-in-out';
            
            const size = randomSize(4, 10);
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            assignShape(confetti);
            
            confettiContainer.appendChild(confetti);
        }

        // Add prettier directional "bang" bursts from all edges
        const addEdgeBurst = (direction, count) => {
            for (let i = 0; i < count; i++) {
                const piece = document.createElement('div');
                // Randomly choose type for richer visuals
                const type = Math.random() < 0.35 ? 'streamer' : (Math.random() < 0.6 ? 'sparkle' : '');
                piece.className = `confetti-piece edge-bang${type ? ' ' + type : ''}`;
                const color = pick(colors);
                piece.style.backgroundColor = color;

                // Random size tweak per type
                if (!type) {
                    const s = Math.random() * 10 + 4;
                    piece.style.width = s + 'px';
                    piece.style.height = s + 'px';
                    if (Math.random() > 0.5) piece.style.borderRadius = '40%';
                }

                // Starting position & target vector
                let burstX = 0, burstY = 0;
                if (direction === 'left') {
                    piece.style.left = '-10px';
                    piece.style.top = Math.random() * 100 + 'vh';
                    burstX = (Math.random() * 60 + 40) * (window.innerWidth / 100);
                    burstY = (Math.random() * 60 - 30) * (window.innerHeight / 100) * 0.3;
                } else if (direction === 'right') {
                    piece.style.right = '-10px';
                    piece.style.top = Math.random() * 100 + 'vh';
                    burstX = -(Math.random() * 60 + 40) * (window.innerWidth / 100);
                    burstY = (Math.random() * 60 - 30) * (window.innerHeight / 100) * 0.3;
                } else if (direction === 'top') {
                    piece.style.top = '-10px';
                    piece.style.left = Math.random() * 100 + 'vw';
                    burstX = (Math.random() * 60 - 30) * (window.innerWidth / 100) * 0.4;
                    burstY = (Math.random() * 50 + 30) * (window.innerHeight / 100);
                } else if (direction === 'bottom') {
                    piece.style.bottom = '-10px';
                    piece.style.top = 'auto';
                    piece.style.left = Math.random() * 100 + 'vw';
                    burstX = (Math.random() * 60 - 30) * (window.innerWidth / 100) * 0.4;
                    burstY = -(Math.random() * 50 + 30) * (window.innerHeight / 100);
                }

                // Depth and rotation for 3D feel
                const burstZ = (Math.random() * 2 - 1) * 80; // -80..80px
                const rot = Math.floor(Math.random() * 720 + 360) + 'deg';
                piece.style.setProperty('--burst-x', burstX + 'px');
                piece.style.setProperty('--burst-y', burstY + 'px');
                piece.style.setProperty('--burst-z', burstZ + 'px');
                piece.style.setProperty('--rot', rot);

                // Timings: mix of faster and slower
                const fastE = Math.random() < 0.4;
                piece.style.animationDelay = (Math.random() * 0.25) + 's';
                piece.style.animationDuration = (fastE ? Math.random() * 0.7 + 1.6 : Math.random() * 1.4 + 2.6) + 's';
                piece.style.animationTimingFunction = fastE ? 'cubic-bezier(0.25, 1, 0.5, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)';

                confettiContainer.appendChild(piece);
            }
        };

        addEdgeBurst('left', 40);
        addEdgeBurst('right', 40);
        addEdgeBurst('top', 30);
        addEdgeBurst('bottom', 30);

        // Bottom rise subtle field to fill space (40 pieces)
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece bottom-rise';
            const color = pick(colors);
            piece.style.backgroundColor = color;
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.bottom = '-20px';
            piece.style.top = 'auto';
            piece.style.animationDelay = (Math.random() * 1.4) + 's';
            const fastB = Math.random() < 0.3;
            piece.style.animationDuration = (fastB ? Math.random() * 1.0 + 2.2 : Math.random() * 1.8 + 3.4) + 's';
            piece.style.animationTimingFunction = fastB ? 'ease-out' : 'ease-in-out';
            const s = randomSize(3, 9);
            piece.style.width = s + 'px';
            piece.style.height = s + 'px';
            assignShape(piece);
            confettiContainer.appendChild(piece);
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

    // Listen for updates from PiP window via IPC
    window.electronAPI.onPipTimerUpdate((event, update) => {
        console.log('Received PiP timer update:', update);
        window.timer.receivePiPUpdate(update);
    });
});

// Listen for messages from PiP window
window.addEventListener('message', (event) => {
    if (event.source === window && event.data.type === 'pip-update') {
        window.timer.receivePiPUpdate(event.data.update);
    }
});
