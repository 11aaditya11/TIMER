class TinyTimer {
    constructor() {
        this.timeLeft = 0; // Default 25 minutes
        this.totalTime = 0;
        this.isRunning = false;
        this.interval = null; // no local ticking in tiny mode
        this._completionShown = false; // ensures visual hint only once per run
        this.currentTheme = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupIpcListeners();
        this.setupThemeSync();
        this.updateDisplay();
        this.startSync();
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('tinyTimeDisplay');
        this.closeBtn = document.getElementById('tinyCloseBtn');
        this.container = document.querySelector('.tiny-container');
    }

    setupEventListeners() {
        this.closeBtn.addEventListener('click', () => this.closeTinyWindow());
        // Hover handling via JS to avoid any platform quirks with :hover and drag regions
        if (this.container) {
            this.container.addEventListener('mouseenter', () => {
                try { document.body.classList.add('tiny-hover'); } catch (_) {}
            });
            this.container.addEventListener('mouseleave', () => {
                try { document.body.classList.remove('tiny-hover'); } catch (_) {}
            });
        }

        // Tiny window keyboard shortcuts for theme cycling
        document.addEventListener('keydown', (e) => {
            const t = e.target && e.target.tagName;
            if (t === 'INPUT' || t === 'TEXTAREA') return;
            if (!e.shiftKey) return;

            if (e.key === 'ArrowRight' || e.key === 'Right') {
                e.preventDefault();
                this.requestThemeCycle(1);
            } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
                e.preventDefault();
                this.requestThemeCycle(-1);
            }
        });
    }

    setupIpcListeners() {
        try {
            // Listen for updates from main window
            window.electronAPI.onMainTimerUpdate((event, timerState) => {
                console.log('Tiny window received timer update:', timerState);
                this.updateFromMainWindow(timerState);
            });
            // Listen for window active/inactive from main process
            if (window.electronAPI && typeof window.electronAPI.onWindowActive === 'function') {
                window.electronAPI.onWindowActive((isActive) => {
                    try {
                        if (isActive) {
                            document.body.classList.add('tiny-focused');
                        } else {
                            document.body.classList.remove('tiny-focused');
                        }
                    } catch (_) { /* ignore */ }
                });
            }
        } catch (error) {
            console.log('Could not set up main window update listener:', error);
        }
    }

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
            try { console.log('[Tiny Theme] Synced theme:', id); } catch (_) {}
        } catch (_) { /* ignore */ }
    }

    startSync() {
        // Timer sync is handled via IPC events from main window
    }

    updateFromMainWindow(timerState) {
        console.log('Tiny window updating from main:', timerState);
        
        if (!timerState || typeof timerState !== 'object') {
            console.log('Invalid timer state received');
            return;
        }
        
        const prevTimeLeft = this.timeLeft;

        this.timeLeft = timerState.timeLeft || 0;
        this.totalTime = timerState.totalTime || 0;
        this.isRunning = timerState.isRunning || false;
        
        console.log('Tiny window new state:', { timeLeft: this.timeLeft, isRunning: this.isRunning });
        
        this.updateDisplay();
        // No button states to update in tiny mode
        // Do NOT run any local ticking; rely on main window for timing.

        // Show a subtle completion pulse once when timer hits 0
        if (prevTimeLeft > 0 && this.timeLeft <= 0 && !this._completionShown) {
            this._completionShown = true;
            this.timerComplete();
        }

        // Reset completion flag when a new run starts
        if (this.isRunning && prevTimeLeft === 0 && this.timeLeft > 0) {
            this._completionShown = false;
        }
    }

    startLocalTimer() { }

    stopLocalTimer() { }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    timerComplete() {
        // Visual hint only; no sound in tiny mode to prevent duplicates
        try { this.timeDisplay.classList.add('tiny-timer-complete'); } catch (_) {}
        setTimeout(() => {
            try { this.timeDisplay.classList.remove('tiny-timer-complete'); } catch (_) {}
        }, 1000);
    }

    // Sound disabled in tiny mode
    playNotificationSound() { }

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

    requestThemeCycle(direction = 1) {
        if (!window.electronAPI || typeof window.electronAPI.cycleTheme !== 'function') {
            return;
        }
        try {
            const maybePromise = window.electronAPI.cycleTheme(direction);
            if (maybePromise && typeof maybePromise.then === 'function') {
                maybePromise.catch(() => {});
            }
        } catch (_) { /* ignore */ }
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
