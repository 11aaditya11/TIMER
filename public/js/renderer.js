class Timer {
    constructor() {
        this.timeLeft = 0;
        this.totalTime = 0;
        this.isRunning = false;
        this.interval = null;
        this.preferredTimes = [];
        
        this.initializeElements();
        // Theme setup
        this.themes = ['theme-midnight', 'theme-ocean', 'theme-sunset', 'theme-forest', 'theme-neon'];
        this.currentThemeIndex = 0;
        this.loadAndApplyTheme();
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
            } else if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'Right')) {
                // Cycle next theme
                e.preventDefault();
                this.cycleTheme(1);
            } else if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'Left')) {
                // Cycle previous theme
                e.preventDefault();
                this.cycleTheme(-1);
            }
        });
    }

    // =====================
    // Theme management
    // =====================
    loadAndApplyTheme() {
        try {
            const saved = localStorage.getItem('timer-app-theme');
            if (saved && this.themes.includes(saved)) {
                this.currentThemeIndex = this.themes.indexOf(saved);
            }
        } catch (_) { /* ignore storage errors */ }
        this.applyTheme(this.themes[this.currentThemeIndex]);
        try { console.log('[Theme] Loaded theme:', this.themes[this.currentThemeIndex]); } catch (_) {}
    }

    applyTheme(themeClass) {
        try {
            const body = document.body;
            // Remove any previous theme classes
            this.themes.forEach(t => body.classList.remove(t));
            // Apply new
            if (themeClass) body.classList.add(themeClass);
            // Persist
            try { localStorage.setItem('timer-app-theme', themeClass); } catch (_) {}
            try { console.log('[Theme] Applied theme:', themeClass); } catch (_) {}
        } catch (_) { /* ignore */ }
    }

    cycleTheme(direction = 1) {
        const len = this.themes.length;
        this.currentThemeIndex = (this.currentThemeIndex + (direction % len) + len) % len;
        const nextTheme = this.themes[this.currentThemeIndex];
        try { console.log('[Theme] Cycling', direction > 0 ? 'next' : 'prev', '->', nextTheme); } catch (_) {}
        this.applyTheme(nextTheme);
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
        confettiContainer.style.opacity = '1';
        confettiContainer.style.transition = 'opacity 0.2s ease';
        confettiContainer.style.willChange = 'opacity, transform';
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

        // Ensure total runtime <= 2.5s per piece
        const MAX_TOTAL = 2.5;
        const setCappedTiming = (el, options) => {
            const { minDur = 1.0, maxDur = 2.0, maxDelay = 0.6, fastBias = 0.0 } = options || {};
            // choose delay and duration with some variability
            let delay = Math.random() * Math.max(0, maxDelay);
            const fast = Math.random() < fastBias;
            let dur;
            if (fast) {
                dur = minDur + Math.random() * (Math.max(minDur + 0.5, (maxDur + minDur) / 2) - minDur);
            } else {
                dur = minDur + Math.random() * (maxDur - minDur);
            }
            // Cap to keep delay + duration within MAX_TOTAL
            const maxDurAllowed = Math.max(0.25, (MAX_TOTAL - 0.05) - delay);
            if (dur > maxDurAllowed) dur = maxDurAllowed;
            if (dur < 0.25) dur = 0.25;
            el.style.animationDelay = `${delay}s`;
            el.style.animationDuration = `${dur}s`;
            return { delay, dur };
        };

        // Helper: schedule a mid-flight disappearance to avoid traces
        const scheduleRemoval = (el, delaySec, durSec) => {
            const total = Math.max(0, delaySec) + Math.max(0.1, durSec);
            // Cut off between 55% and 90% of total time
            const cutoffFrac = 0.55 + Math.random() * 0.35;
            const cutoffMs = total * cutoffFrac * 1000;
            // Prepare for fade
            el.style.willChange = 'opacity, transform';
            el.style.backfaceVisibility = 'hidden';
            setTimeout(() => {
                el.style.transition = 'opacity 120ms ease';
                el.style.opacity = '0';
                setTimeout(() => {
                    if (el && el.parentNode) el.parentNode.removeChild(el);
                }, 180);
            }, cutoffMs);
            // Hard safety cleanup at total time + small buffer
            setTimeout(() => {
                if (el && el.parentNode) el.parentNode.removeChild(el);
            }, total * 1000 + 120);
        };

        // Center burst removed for a cleaner edge-focused celebration

        // Create side confetti (left side - 60 pieces)
        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece side-left';
            
            const color = pick(colors);
            confetti.style.backgroundColor = color;
            
            // Randomize: sometimes use edge-bang instead of side-left
            const useEdgeLeft = Math.random() < 0.5;
            if (useEdgeLeft) {
                const typeL = Math.random() < 0.35 ? 'streamer' : (Math.random() < 0.6 ? 'sparkle' : '');
                confetti.className = `confetti-piece edge-bang${typeL ? ' ' + typeL : ''}`;
                confetti.style.left = '-10px';
                confetti.style.top = Math.random() * 100 + 'vh';
                const burstXL = (Math.random() * 60 + 40) * (window.innerWidth / 100);
                const burstYL = (Math.random() * 60 - 30) * (window.innerHeight / 100) * 0.3;
                const burstZL = (Math.random() * 2 - 1) * 80;
                const rotL = Math.floor(Math.random() * 720 + 360) + 'deg';
                confetti.style.setProperty('--burst-x', burstXL + 'px');
                confetti.style.setProperty('--burst-y', burstYL + 'px');
                confetti.style.setProperty('--burst-z', burstZL + 'px');
                confetti.style.setProperty('--rot', rotL);
            } else {
                confetti.style.left = '-10px';
                confetti.style.top = Math.random() * 100 + '%';
            }
            
            const { delay, dur } = setCappedTiming(confetti, { minDur: 1.0, maxDur: 2.0, maxDelay: 0.6, fastBias: 0.35 });
            confetti.style.animationTimingFunction = dur < 1.3 ? 'ease-out' : 'ease-in-out';
            
            const size = randomSize(4, 10);
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            assignShape(confetti);
            
            confettiContainer.appendChild(confetti);
            scheduleRemoval(confetti, delay, dur);
        }

        // Create side confetti (right side - 60 pieces)
        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece side-right';
            
            const color = pick(colors);
            confetti.style.backgroundColor = color;
            
            // Randomize: sometimes use edge-bang instead of side-right
            const useEdgeRight = Math.random() < 0.5;
            if (useEdgeRight) {
                const typeR = Math.random() < 0.35 ? 'streamer' : (Math.random() < 0.6 ? 'sparkle' : '');
                confetti.className = `confetti-piece edge-bang${typeR ? ' ' + typeR : ''}`;
                confetti.style.right = '-10px';
                confetti.style.top = Math.random() * 100 + 'vh';
                const burstXR = -(Math.random() * 60 + 40) * (window.innerWidth / 100);
                const burstYR = (Math.random() * 60 - 30) * (window.innerHeight / 100) * 0.3;
                const burstZR = (Math.random() * 2 - 1) * 80;
                const rotR = Math.floor(Math.random() * 720 + 360) + 'deg';
                confetti.style.setProperty('--burst-x', burstXR + 'px');
                confetti.style.setProperty('--burst-y', burstYR + 'px');
                confetti.style.setProperty('--burst-z', burstZR + 'px');
                confetti.style.setProperty('--rot', rotR);
            } else {
                confetti.style.right = '-10px';
                confetti.style.top = Math.random() * 100 + '%';
            }
            
            const { delay: delayR, dur: durR } = setCappedTiming(confetti, { minDur: 1.0, maxDur: 2.0, maxDelay: 0.6, fastBias: 0.35 });
            confetti.style.animationTimingFunction = durR < 1.3 ? 'ease-out' : 'ease-in-out';
            
            const size = randomSize(4, 10);
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            assignShape(confetti);
            
            confettiContainer.appendChild(confetti);
            scheduleRemoval(confetti, delayR, durR);
        }

        // Create top falling confetti (100 pieces)
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece top-fall';
            
            const color = pick(colors);
            confetti.style.backgroundColor = color;
            
            // Randomize: sometimes use edge-bang upward burst instead of pure fall
            const useEdgeTop = Math.random() < 0.4;
            if (useEdgeTop) {
                const typeT = Math.random() < 0.35 ? 'streamer' : (Math.random() < 0.6 ? 'sparkle' : '');
                confetti.className = `confetti-piece edge-bang${typeT ? ' ' + typeT : ''}`;
                confetti.style.top = '-10px';
                confetti.style.left = Math.random() * 100 + 'vw';
                const burstXT = (Math.random() * 60 - 30) * (window.innerWidth / 100) * 0.4;
                const burstYT = (Math.random() * 50 + 30) * (window.innerHeight / 100);
                const burstZT = (Math.random() * 2 - 1) * 80;
                const rotT = Math.floor(Math.random() * 720 + 360) + 'deg';
                confetti.style.setProperty('--burst-x', burstXT + 'px');
                confetti.style.setProperty('--burst-y', burstYT + 'px');
                confetti.style.setProperty('--burst-z', burstZT + 'px');
                confetti.style.setProperty('--rot', rotT);
            } else {
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.top = '-20px';
            }
            
            const { delay: delayT, dur: durT } = setCappedTiming(confetti, { minDur: 1.2, maxDur: 2.2, maxDelay: 0.8, fastBias: 0.3 });
            confetti.style.animationTimingFunction = durT < 1.4 ? 'ease-in' : 'ease-in-out';
            
            const size = randomSize(4, 10);
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            assignShape(confetti);
            
            confettiContainer.appendChild(confetti);
            scheduleRemoval(confetti, delayT, durT);
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

                const { delay: delayE, dur: durE } = setCappedTiming(piece, { minDur: 1.0, maxDur: 2.0, maxDelay: 0.3, fastBias: 0.4 });
                piece.style.animationTimingFunction = durE < 1.3 ? 'cubic-bezier(0.25, 1, 0.5, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)';

                confettiContainer.appendChild(piece);
                scheduleRemoval(piece, delayE, durE);
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
            const { delay: delayB, dur: durB } = setCappedTiming(piece, { minDur: 1.0, maxDur: 2.0, maxDelay: 0.6, fastBias: 0.3 });
            piece.style.animationTimingFunction = durB < 1.4 ? 'ease-out' : 'ease-in-out';
            const s = randomSize(3, 9);
            piece.style.width = s + 'px';
            piece.style.height = s + 'px';
            assignShape(piece);
            confettiContainer.appendChild(piece);
            scheduleRemoval(piece, delayB, durB);
        }

        // Strict final cleanup at 2.5s: fade, clear children, remove container
        setTimeout(() => {
            confettiContainer.style.opacity = '0';
        }, 2350);
        setTimeout(() => {
            try {
                while (confettiContainer.firstChild) {
                    confettiContainer.removeChild(confettiContainer.firstChild);
                }
                if (confettiContainer.parentNode) {
                    confettiContainer.parentNode.removeChild(confettiContainer);
                }
            } catch (_) { /* ignore */ }
        }, 2500);
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
        // Try to play bundled audio file first; fall back to synthesized chime if it fails
        try {
            const audio = new Audio('assets/sound1.wav');
            audio.volume = 1.0; // max per element
            audio.currentTime = 0;
            // Layer a second instance for perceived louder output
            const audioLayer = new Audio('assets/sound1.wav');
            audioLayer.volume = 0.6; // blended layer
            // Play once only (no replay)

            Promise.allSettled([audio.play(), audioLayer.play()]).then(() => {
                // Played successfully; skip synthesized chime
            }).catch(() => {
                // If play() is blocked, fall through to synth chime
                throw new Error('Audio play blocked');
            });
            return;
        } catch (e) {}
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

            // Reuse a single AudioContext if possible
            if (!this._audioCtx) {
                this._audioCtx = new AudioCtx();
            }

            const ctx = this._audioCtx;

            // Ensure context is running (some browsers suspend until user gesture)
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            const now = ctx.currentTime + 0.02; // slight delay to avoid pops

            // Master gain with gentle fade-out
            const master = ctx.createGain();
            master.gain.setValueAtTime(0.0001, now);
            master.gain.exponentialRampToValueAtTime(0.18, now + 0.03); // fade in
            master.gain.exponentialRampToValueAtTime(0.0001, now + 1.6); // fade out
            master.connect(ctx.destination);

            // A pleasant two-note chime (major sixth interval)
            const notes = [
                { freq: 987.77, time: 0.00, dur: 1.6 }, // B5
                { freq: 1318.51, time: 0.18, dur: 2.2 } // E6
            ];

            notes.forEach(({ freq, time, dur }, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + time);
                // Slight detune on the second to add shimmer
                if (idx === 1) {
                    osc.detune.setValueAtTime(6, now + time);
                }

                // Soft bell-like envelope
                const attack = 0.02;
                const decay = 0.25;
                const sustain = 0.26;
                const release = 0.9;

                gain.gain.setValueAtTime(0.0001, now + time);
                gain.gain.exponentialRampToValueAtTime(0.9, now + time + attack);
                gain.gain.exponentialRampToValueAtTime(sustain, now + time + attack + decay);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + time + Math.max(dur, release));

                // Gentle low-pass to smooth highs
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(5000, now + time);
                filter.Q.value = 0.7;

                osc.connect(gain);
                gain.connect(filter);
                filter.connect(master);

                osc.start(now + time);
                osc.stop(now + time + Math.max(dur, release) + 0.05);
            });

            // Optional tiny sparkle using very quiet noise burst
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.02; // decaying
            }
            const noiseSrc = ctx.createBufferSource();
            const noiseGain = ctx.createGain();
            noiseSrc.buffer = buffer;
            noiseGain.gain.setValueAtTime(0.0001, now + 0.05);
            noiseGain.gain.exponentialRampToValueAtTime(0.06, now + 0.08);
            noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
            noiseSrc.connect(noiseGain);
            noiseGain.connect(master);
            noiseSrc.start(now + 0.05);
            noiseSrc.stop(now + 0.5);
        } catch (e) {
            // Fallback: ignore sound errors silently
            console.warn('Notification sound failed:', e);
        }
    }

    openPiP() {
        // Request the main process to open PiP window
        try {
            window.electronAPI.openPipWindow();
            // Proactively push current state so PiP shows the correct time immediately
            const pushState = () => {
                try { this.sendUpdateToPip(); } catch (_) {}
            };
            // Push immediately and with a couple of short retries to cover window init time
            pushState();
            setTimeout(pushState, 80);
            setTimeout(pushState, 200);
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

    // Listen for theme cycle requests from main (global shortcuts)
    try {
        window.electronAPI.onCycleTheme((direction) => {
            if (typeof direction === 'number') {
                window.timer.cycleTheme(direction);
            }
        });
    } catch (_) { /* ignore */ }
});

// Listen for messages from PiP window
window.addEventListener('message', (event) => {
    if (event.source === window && event.data.type === 'pip-update') {
        window.timer.receivePiPUpdate(event.data.update);
    }
});
