class PiPTimer {
    constructor() {
        this.timeLeft = 0; // Start with 0, will sync from main
        this.totalTime = 0;
        this.isRunning = false;
        this.interval = null; // no local ticking; kept for safety cleanup
        this.currentTheme = null;

        this.initializeElements();
        this.setupEventListeners();
        this.setupIpcListeners();
        this.setupThemeSync();
        this.updateDisplay();
        this.updateProgress();
        this.startSync();
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('pipTimeDisplay');
        this.progressBar = null;
        this.startBtn = null;
        this.pauseBtn = document.getElementById('pipPauseBtn');
        this.resetBtn = document.getElementById('pipResetBtn');
        this.closeBtn = document.getElementById('pipCloseBtn');
        this.tinyToggle = null;
        this.pipHeader = null;
        this.pipControls = document.querySelector('.pip-controls');
        this.pipProgress = null;
        this.pipContainer = document.querySelector('.pip-container');
        this.pipHoverOverlay = document.getElementById('pipHoverOverlay');

        // Initialize tiny mode state
        this.isTinyMode = false;
    }

    setupEventListeners() {
        // Toggle start/pause via the same button
        this.pauseBtn.addEventListener('click', () => {
            if (this.isRunning) {
                this.pauseTimer();
            } else {
                this.startTimer();
            }
        });
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closePiP());
        }
        // Tiny toggle removed in tidy PiP

        // PiP window-only keyboard shortcuts (active window receives events)
        document.addEventListener('keydown', (e) => {
            // only act if focus is not in an input
            const t = e.target && e.target.tagName;
            if (t === 'INPUT' || t === 'TEXTAREA') return;
            // PiP no longer handles its own theme cycling; shortcuts reserved.
        });

        // Focus handling for close button visibility
        const handleFocusChange = () => {
            try {
                if (document.hasFocus()) {
                    document.body.classList.add('pip-focused');
                } else {
                    document.body.classList.remove('pip-focused');
                }
            } catch (_) { /* ignore */ }
        };

        // Initial state
        handleFocusChange();

        // React to focus/blur events
        window.addEventListener('focus', handleFocusChange);
        window.addEventListener('blur', handleFocusChange);
        document.addEventListener('visibilitychange', handleFocusChange);

        // Hover handling for close button visibility
        if (this.pipHoverOverlay) {
            this.pipHoverOverlay.addEventListener('mouseenter', () => {
                try {
                    document.body.classList.add('pip-hover');
                    console.log('PiP: Mouse entered hover overlay');
                } catch (_) {}
            });
            this.pipHoverOverlay.addEventListener('mouseleave', () => {
                try {
                    document.body.classList.remove('pip-hover');
                    console.log('PiP: Mouse left hover overlay');
                } catch (_) {}
            });
        }

        // Fallback hover handling directly on container (overlay may be non-interactive)
        if (this.pipContainer) {
            this.pipContainer.addEventListener('mouseenter', () => {
                try {
                    document.body.classList.add('pip-hover');
                } catch (_) {}
            });
            this.pipContainer.addEventListener('mouseleave', () => {
                try {
                    document.body.classList.remove('pip-hover');
                } catch (_) {}
            });
        }

        // Close button also maintains hover state
        if (this.closeBtn) {
            this.closeBtn.addEventListener('mouseenter', () => {
                try {
                    document.body.classList.add('pip-hover');
                } catch (_) {}
            });
            this.closeBtn.addEventListener('mouseleave', () => {
                try {
                    document.body.classList.remove('pip-hover');
                } catch (_) {}
            });
        }
    }

    setupIpcListeners() {
        try {
            // Listen for updates from main window
            window.electronAPI.onMainTimerUpdate((event, timerState) => {
                this.updateFromMainWindow(timerState);
            });

            // Listen for window active/inactive from main process (for close button visibility)
            if (window.electronAPI && typeof window.electronAPI.onWindowActive === 'function') {
                window.electronAPI.onWindowActive((isActive) => {
                    try {
                        if (isActive) {
                            document.body.classList.add('pip-focused');
                        } else {
                            document.body.classList.remove('pip-focused');
                        }
                    } catch (_) { /* ignore */ }
                });
            }
        } catch (error) {
            console.log('Could not set up main window update listener');
        }
    }


    startSync() {
        // Initial sync: ask main window to broadcast current state
        try {
            window.electronAPI.requestTimerStateFromMain();
        } catch (e) {
            // Fallback to local no-op
        }
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

        this.timeLeft = timerState.timeLeft || 0;
        this.totalTime = timerState.totalTime || 0;
        this.isRunning = timerState.isRunning || false;

        this.updateDisplay();
        this.updateProgress();
        this.updateButtonStates();
        // No local timer; rely on main window's periodic updates for accuracy
    }

    // Removed local ticking; keep methods no-op for backward compatibility
    startLocalTimer() { }
    stopLocalTimer() { }

    startTimer() {
        if (this.timeLeft <= 0) return;

        this.isRunning = true; // optimistic; real state will arrive via IPC
        this.updateButtonStates();
        // Notify main window
        this.notifyMainWindow('start');
    }

    pauseTimer() {
        this.isRunning = false; // optimistic; real state will arrive via IPC
        this.updateButtonStates();
        // Notify main window
        this.notifyMainWindow('pause');
    }

    resetTimer() {
        this.isRunning = false; // optimistic
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
        // progress removed
    }

    updateButtonStates() {
        this.pauseBtn.disabled = false;
        this.renderPauseButton();
    }

    renderPauseButton() {
        if (!this.pauseBtn) return;
        if (this.isRunning) {
            this.pauseBtn.classList.remove('play-btn');
            this.pauseBtn.classList.add('pause-btn');
            this.pauseBtn.title = 'Pause';
            this.pauseBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        } else {
            this.pauseBtn.classList.remove('pause-btn');
            this.pauseBtn.classList.add('play-btn');
            this.pauseBtn.title = 'Start';
            this.pauseBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        }
    }

    // ==========================
    // PiP Theme handling
    // ==========================
    setupThemeSync() {
        if (!window.electronAPI) return;
        try {
            window.electronAPI.onThemeTokens((payload) => {
                this.applyThemeTokens(payload);
            });
        } catch (_) { /* ignore listener failures */ }

        try {
            const maybePromise = window.electronAPI.requestThemeTokens && window.electronAPI.requestThemeTokens();
            if (maybePromise && typeof maybePromise.then === 'function') {
                maybePromise.then((payload) => {
                    if (payload) this.applyThemeTokens(payload);
                }).catch(() => {});
            } else if (maybePromise) {
                this.applyThemeTokens(maybePromise);
            }
        } catch (_) { /* ignore */ }
    }

    applyThemeTokens(payload) {
        if (!payload || !payload.tokens) return;
        this.currentTheme = payload;
        const { tokens, id, group } = payload;
        const body = document.body;
        try {
            Object.entries(tokens).forEach(([key, value]) => {
                body.style.setProperty(key, value);
            });
            if (id) body.dataset.themeId = id;
            if (group) body.dataset.themeGroup = group;
            try { console.log('[PiP Theme] Synced theme:', id); } catch (_) {}
        } catch (_) { /* ignore */ }
    }

    timerComplete() {
        // In tiny/PiP mode, avoid playing sounds to prevent duplicates with the main window.
        // Provide only a subtle visual hint and pause state.
        this.pauseTimer();
        try {
            this.timeDisplay.classList.add('pip-timer-complete');
        } catch (_) {}

        setTimeout(() => {
            try { this.timeDisplay.classList.remove('pip-timer-complete'); } catch (_) {}
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

    // Tiny toggle removed for tidy PiP

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
