class PiPTimer {
    constructor() {
        this.timeLeft = 0; // Start with 0, will sync from main
        this.totalTime = 0;
        this.isRunning = false;
        this.interval = null; // no local ticking; kept for safety cleanup
        // PiP theming & fonts
        this.pipThemes = ['pip-theme-ocean', 'pip-theme-sunset', 'pip-theme-forest', 'pip-theme-carbon', 'pip-theme-neon'];
        this.pipFonts = [
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            "'Courier New', monospace",
            "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            "'Roboto Mono', monospace",
            "'System UI', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        ];
        this.currentPipThemeIndex = 0;
        this.currentPipFontIndex = 0;

        this.initializeElements();
        this.setupEventListeners();
        this.setupIpcListeners();
        this.loadAndApplyPipThemeAndFont();
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

            if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'Right')) {
                // Cycle PiP theme next
                e.preventDefault();
                this.cyclePipTheme(1);
            } else if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'Left')) {
                // Cycle PiP theme prev
                e.preventDefault();
                this.cyclePipTheme(-1);
            } else if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'Up')) {
                // Cycle PiP font next
                e.preventDefault();
                this.cyclePipFont(1);
            } else if (e.shiftKey && (e.key === 'ArrowDown' || e.key === 'Down')) {
                // Cycle PiP font prev
                e.preventDefault();
                this.cyclePipFont(-1);
            }
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
    // PiP Theme & Font handling
    // ==========================
    loadAndApplyPipThemeAndFont() {
        try {
            const savedTheme = localStorage.getItem('pip-theme');
            if (savedTheme && this.pipThemes.includes(savedTheme)) {
                this.currentPipThemeIndex = this.pipThemes.indexOf(savedTheme);
            }
        } catch (_) { }
        try {
            const savedFont = localStorage.getItem('pip-font');
            if (savedFont) {
                const idx = this.pipFonts.indexOf(savedFont);
                if (idx >= 0) this.currentPipFontIndex = idx;
            }
        } catch (_) { }
        this.applyPipTheme(this.pipThemes[this.currentPipThemeIndex]);
        this.applyPipFont(this.pipFonts[this.currentPipFontIndex]);
        try { console.log('[PiP Theme] Loaded:', this.pipThemes[this.currentPipThemeIndex]); } catch (e) { }
        try { console.log('[PiP Font] Loaded:', this.pipFonts[this.currentPipFontIndex]); } catch (e) { }
    }

    applyPipTheme(themeClass) {
        try {
            const body = document.body;
            this.pipThemes.forEach(t => body.classList.remove(t));
            if (themeClass) body.classList.add(themeClass);
            try { localStorage.setItem('pip-theme', themeClass); } catch (_) { }
            try { console.log('[PiP Theme] Applied:', themeClass, 'Classes:', Array.from(body.classList).join(' ')); } catch (e) { }
        } catch (_) { }
    }

    cyclePipTheme(direction = 1) {
        const len = this.pipThemes.length;
        this.currentPipThemeIndex = (this.currentPipThemeIndex + (direction % len) + len) % len;
        const nextTheme = this.pipThemes[this.currentPipThemeIndex];
        try { console.log('[PiP Theme] Cycling', direction > 0 ? 'next' : 'prev', '->', nextTheme); } catch (e) { }
        this.applyPipTheme(nextTheme);
    }

    applyPipFont(fontFamily) {
        try {
            document.body.style.setProperty('--pip-font', fontFamily);
            try { localStorage.setItem('pip-font', fontFamily); } catch (_) { }
            try { console.log('[PiP Font] Applied:', fontFamily); } catch (e) { }
        } catch (_) { }
    }

    cyclePipFont(direction = 1) {
        const len = this.pipFonts.length;
        this.currentPipFontIndex = (this.currentPipFontIndex + (direction % len) + len) % len;
        const nextFont = this.pipFonts[this.currentPipFontIndex];
        try { console.log('[PiP Font] Cycling', direction > 0 ? 'next' : 'prev', '->', nextFont); } catch (e) { }
        this.applyPipFont(nextFont);
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
