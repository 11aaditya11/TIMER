const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toSafeString = (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
};

const hexToRgb = (hex) => {
    if (!hex) return null;
    const normalized = hex.replace('#', '');
    const full = normalized.length === 3
        ? normalized.split('').map((c) => c + c).join('')
        : normalized;
    const intVal = parseInt(full, 16);
    if (Number.isNaN(intVal)) return null;
    return {
        r: (intVal >> 16) & 255,
        g: (intVal >> 8) & 255,
        b: intVal & 255
    };
};

const rgbToHex = (r, g, b) => {
    const toHex = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const mixHex = (source, target, weight) => {
    const sourceRgb = hexToRgb(source);
    const targetRgb = hexToRgb(target);
    const amount = clamp(weight, 0, 1);
    if (!sourceRgb || !targetRgb) return source;
    const r = sourceRgb.r * (1 - amount) + targetRgb.r * amount;
    const g = sourceRgb.g * (1 - amount) + targetRgb.g * amount;
    const b = sourceRgb.b * (1 - amount) + targetRgb.b * amount;
    return rgbToHex(r, g, b);
};

const lighten = (hex, amount) => mixHex(hex, '#FFFFFF', amount);
const darken = (hex, amount) => mixHex(hex, '#000000', amount);

const hexToRgba = (hex, alpha = 1) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
};

const getContrastColor = (hex, lightFallback = '#101015', darkFallback = '#FFFFFF') => {
    const rgb = hexToRgb(hex);
    if (!rgb) return darkFallback;
    const srgb = [rgb.r, rgb.g, rgb.b].map((component) => {
        const channel = component / 255;
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    return luminance > 0.6 ? lightFallback : darkFallback;
};

const THEME_DEFINITIONS = [
    // --- LIGHT THEMES ---
    {
        id: 'classic-minimal',
        name: 'Classic Minimal',
        group: 'light',
        palette: {
            background: '#FFFFFF',
            surface: '#F5F5F5',
            primaryText: '#000000',
            secondaryText: '#666666',
            accent: '#4CAF50'
        }
    },
    {
        id: 'github-light',
        name: 'GitHub Light',
        group: 'light',
        palette: {
            background: '#FFFFFF',
            surface: '#F6F8FA',
            primaryText: '#1F2328',
            secondaryText: '#656D76',
            accent: '#0969DA'
        }
    },
    {
        id: 'catppuccin-latte',
        name: 'Catppuccin Latte',
        group: 'light',
        palette: {
            background: '#EFF1F5',
            surface: '#E6E9EF',
            primaryText: '#4C4F69',
            secondaryText: '#7C7F93',
            accent: '#1E66F5'
        }
    },
    {
        id: 'gruvbox-light',
        name: 'Gruvbox Light',
        group: 'light',
        palette: {
            background: '#FBF1C7',
            surface: '#F2E5BC',
            primaryText: '#3C3836',
            secondaryText: '#7C6F64',
            accent: '#B57614'
        }
    },
    {
        id: 'clear-glass',
        name: 'Clear Glass',
        group: 'light',
        palette: {
            background: '#FFFFFF',
            surface: '#FFFFFF',
            primaryText: '#111111',
            secondaryText: '#444444',
            accent: '#FF6B6B',
            accentText: '#FFFFFF'
        },
        tokenOverrides: {
            '--pip-bg': 'rgba(255, 255, 255, 0)',
            '--pip-bg-2': 'rgba(255, 255, 255, 0)',
            '--pip-time-color': '#111111',
            '--pip-btn-bg': 'rgba(0, 0, 0, 0.08)',
            '--pip-btn-border': 'rgba(0, 0, 0, 0.12)',
            '--pip-btn-hover-bg': 'rgba(0, 0, 0, 0.18)',
            '--pip-close-bg': 'rgba(0, 0, 0, 0.12)',
            '--pip-close-border': 'rgba(0, 0, 0, 0.2)',
            '--pip-shadow': 'none',
            '--pip-container-bg': 'transparent',
            '--pip-container-shadow': 'none',
            '--pip-backdrop-filter': 'none',
            '--pip-btn-backdrop-filter': 'none',
            '--pip-time-shadow': '0 2px 8px rgba(0, 0, 0, 0.2)',
            '--pip-btn-text-color': '#111111',
            '--pip-close-color': '#111111',
            '--tiny-bg': 'rgba(255, 255, 255, 0)',
            '--tiny-shadow': 'none',
            '--tiny-border': 'rgba(0, 0, 0, 0.18)',
            '--tiny-text': '#111111',
            '--tiny-close-bg': 'rgba(0, 0, 0, 0.12)',
            '--tiny-close-bg-hover': 'rgba(0, 0, 0, 0.22)',
            '--tiny-close-border': 'rgba(0, 0, 0, 0.18)',
            '--tiny-backdrop-filter': 'none',
            '--tiny-time-shadow': '0 2px 12px rgba(0, 0, 0, 0.18)',
            '--tiny-close-color': '#111111'
        }
    },

    // --- DARK THEMES ---
    {
        id: 'midnight',
        name: 'Midnight (Original)',
        group: 'dark',
        palette: {
            background: '#0F0F12',
            surface: '#141418',
            primaryText: '#E7E7EA',
            secondaryText: '#B7BCC2',
            accent: '#4A90E2'
        }
    },
    {
        id: 'elevated-gray',
        name: 'Elevated Gray',
        group: 'dark',
        palette: {
            background: '#121212',
            surface: '#1E1E1E',
            primaryText: '#FFFFFF',
            secondaryText: '#B0B0B0',
            accent: '#66BB6A'
        }
    },
    {
        id: 'deep-navy',
        name: 'Deep Navy',
        group: 'dark',
        palette: {
            background: '#0D1117',
            surface: '#161B22',
            primaryText: '#E0E0E0',
            secondaryText: '#8B949E',
            accent: '#58A6FF'
        }
    },
    {
        id: 'oled-black',
        name: 'OLED Black',
        group: 'dark',
        palette: {
            background: '#000000',
            surface: '#121212',
            primaryText: '#EDEDED',
            secondaryText: '#909090',
            accent: '#90CAF9'
        }
    },
    {
        id: 'nord',
        name: 'Nord',
        group: 'dark',
        palette: {
            background: '#2E3440',
            surface: '#3B4252',
            primaryText: '#ECEFF4',
            secondaryText: '#D8DEE9',
            accent: '#88C0D0'
        }
    },
    {
        id: 'tokyo-night',
        name: 'Tokyo Night',
        group: 'dark',
        palette: {
            background: '#1A1B26',
            surface: '#24283B',
            primaryText: '#A9B1D6',
            secondaryText: '#787C99',
            accent: '#7AA2F7'
        }
    },
    {
        id: 'gruvbox-dark',
        name: 'Gruvbox Dark',
        group: 'dark',
        palette: {
            background: '#282828',
            surface: '#3C3836',
            primaryText: '#EBDBB2',
            secondaryText: '#A89984',
            accent: '#FABD2F'
        }
    },
    {
        id: 'catppuccin-mocha',
        name: 'Catppuccin Mocha',
        group: 'dark',
        palette: {
            background: '#1E1E2E',
            surface: '#313244',
            primaryText: '#CDD6F4',
            secondaryText: '#A6ADC8',
            accent: '#89B4FA'
        }
    },
    {
        id: 'rose-pine',
        name: 'Rosé Pine',
        group: 'dark',
        palette: {
            background: '#191724',
            surface: '#26233A',
            primaryText: '#E0DEF4',
            secondaryText: '#908CAA',
            accent: '#31748F'
        }
    },
    {
        id: 'dracula',
        name: 'Dracula',
        group: 'dark',
        palette: {
            background: '#282A36',
            surface: '#44475A',
            primaryText: '#F8F8F2',
            secondaryText: '#6272A4',
            accent: '#BD93F9'
        }
    }
];

const LEGACY_THEME_MAP = {
    // Keep internal aliases functional
    'theme-midnight': 'midnight',
    'theme-ocean': 'deep-navy',
    'theme-sunset': 'midnight',  // Point legacy randoms to standard midnight
    'theme-forest': 'elevated-gray',
    'theme-neon': 'oled-black',

    // Map removed random themes back to midnight/classic-minimal logically
    'classic-cobalt': 'classic-minimal',
    'classic-crimson': 'classic-minimal',
    'classic-emerald': 'classic-minimal',
    'classic-plum': 'classic-minimal',
    'classic-amber': 'classic-minimal',
    'classic-slate': 'classic-minimal',
    'classic-rose': 'classic-minimal',
    'soft-mint': 'classic-minimal',
    'warm-blush': 'classic-minimal',
    'neutral-gray': 'classic-minimal',
    'polar-mist': 'github-light',
    'sunlit-dune': 'gruvbox-light',
    'lavender-haze': 'classic-minimal',
    'morning-sky': 'classic-minimal',
    'coastal-breeze': 'classic-minimal',
    'golden-hour': 'gruvbox-light',
    'peach-latte': 'classic-minimal',
    'icy-mint': 'classic-minimal',
    'linen-slate': 'classic-minimal',
    'orchid-glow': 'classic-minimal',
    'fresh-snow': 'github-light',

    'midnight-ember': 'midnight',
    'midnight-aurora': 'midnight',
    'midnight-vine': 'midnight',
    'midnight-amethyst': 'midnight',
    'midnight-ruby': 'midnight',
    'midnight-amber': 'midnight',
    'midnight-ice': 'midnight',
    'moody-charcoal': 'midnight',
    'cobalt-night': 'tokyo-night',
    'ember-glow': 'midnight',
    'northern-pine': 'nord',
    'royal-plum': 'midnight',
    'onyx-gold': 'gruvbox-dark',
    'aurora-teal': 'tokyo-night',
    'midnight-copper': 'gruvbox-dark',
    'void-magenta': 'midnight',
    'twilight-rust': 'midnight',
    'shadow-amber': 'gruvbox-dark'
};

const createThemeTokens = (theme) => {
    const { palette, group } = theme;
    const background = palette.background;
    const surface = palette.surface || mixHex(background, group === 'light' ? '#FFFFFF' : '#000000', group === 'light' ? 0.08 : 0.12);
    const surfaceElevated = group === 'light' ? lighten(surface, 0.08) : darken(surface, 0.08);
    const surfaceMuted = group === 'light' ? lighten(surface, 0.04) : darken(surface, 0.06);
    const surfaceMutedHover = group === 'light' ? darken(surfaceMuted, 0.06) : lighten(surfaceMuted, 0.08);
    const headerBackground = palette.headerBackground || (group === 'light' ? darken(surface, 0.08) : darken(surface, 0.14));
    const accent = palette.accent;
    const accentContrast = palette.accentText || getContrastColor(accent);
    const textPrimary = palette.primaryText;
    const textSecondary = palette.secondaryText || mixHex(textPrimary, group === 'light' ? '#000000' : '#FFFFFF', 0.4);
    const themeCardBg = group === 'light' ? lighten(surface, 0.12) : darken(surface, 0.12);
    const themeCardHoverBg = group === 'light' ? darken(themeCardBg, 0.06) : lighten(themeCardBg, 0.08);
    const borderSubtle = hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', group === 'light' ? 0.08 : 0.18);
    const borderStrong = hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', group === 'light' ? 0.18 : 0.28);
    const progressBg = hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', group === 'light' ? 0.12 : 0.1);
    const accentSoft = hexToRgba(accent, group === 'light' ? 0.22 : 0.32);
    const actionText = getContrastColor(surfaceMuted);
    const inputBg = group === 'light' ? lighten(surface, 0.02) : darken(surface, 0.08);
    const inputBorder = hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', group === 'light' ? 0.12 : 0.22);
    const inputPlaceholder = hexToRgba(textPrimary, 0.5);
    const focusRing = hexToRgba(accent, 0.55);
    const actionBorder = hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', group === 'light' ? 0.12 : 0.24);
    const actionHoverBg = group === 'light' ? darken(surfaceMuted, 0.06) : lighten(surfaceMuted, 0.08);
    const secondaryBorder = hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', group === 'light' ? 0.15 : 0.25);
    const secondaryHoverBorder = hexToRgba(accent, 0.55);
    const shadowSoft = `0 16px 32px ${hexToRgba('#000000', group === 'light' ? 0.16 : 0.45)}`;
    const shadowRaised = `0 24px 48px ${hexToRgba('#000000', group === 'light' ? 0.18 : 0.55)}`;
    const themeCardBorder = hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', group === 'light' ? 0.08 : 0.22);
    const themeCardHoverBorder = hexToRgba(accent, 0.55);
    const themeCardShadow = `0 18px 36px ${hexToRgba('#000000', group === 'light' ? 0.16 : 0.5)}`;
    const themeCardHoverShadow = `0 24px 44px ${hexToRgba('#000000', group === 'light' ? 0.18 : 0.6)}`;
    const surfaceCard = group === 'light' ? lighten(surface, 0.1) : darken(surface, 0.1);
    const textInverse = getContrastColor(surface, '#101015', '#FFFFFF');
    const windowRadius = '16px';
    const headerHeight = '40px';
    const headerControlHeight = '32px';
    const pipBg = background; // Match exactly
    const pipBg2 = background; // Match exactly
    const pipBtnBase = mixHex(surfaceMuted, accent, group === 'light' ? 0.18 : 0.12);
    const pipBtnHover = mixHex(pipBtnBase, accent, 0.35);
    const pipBtnBorder = hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', group === 'light' ? 0.12 : 0.28);
    const pipCloseBg = hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', group === 'light' ? 0.14 : 0.36);
    const pipCloseBorder = hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', group === 'light' ? 0.18 : 0.4);
    const pipShadow = `0 12px 28px ${hexToRgba('#000000', group === 'light' ? 0.16 : 0.45)}`;
    // Force solid background identical to main window
    const pipContainerBackground = background;
    const pipBackdropFilter = 'none';
    const pipBtnBackdropFilter = 'blur(3px)';
    const pipTimeShadow = group === 'light' ? '0 1px 3px rgba(0, 0, 0, 0.45)' : '0 1px 4px rgba(0, 0, 0, 0.55)';
    const pipBtnTextColor = textPrimary;
    const pipCloseColor = textPrimary;
    // Force tiny background to identical solid color
    const tinyBg = background;
    const tinyBorder = hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', group === 'light' ? 0.08 : 0.26);
    const tinyShadow = `0 8px 28px ${hexToRgba('#000000', group === 'light' ? 0.18 : 0.48)}`;
    const tinyCloseBg = hexToRgba(accent, group === 'light' ? 0.25 : 0.35);
    const tinyCloseBgHover = hexToRgba(accent, group === 'light' ? 0.35 : 0.45);
    const tinyBackdropFilter = 'none';
    const tinyTimeShadow = '0 2px 8px rgba(0, 0, 0, 0.8)';
    const tinyCloseColor = textPrimary;
    const sharedFont = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    const tokens = {
        '--bg': background,
        '--header-bg': headerBackground,
        '--container-bg': surface,
        '--surface': surface,
        '--surface-elevated': surfaceElevated,
        '--surface-muted': surfaceMuted,
        '--surface-muted-hover': surfaceMutedHover,
        '--surface-card': surfaceCard,
        '--surface-card-hover': themeCardHoverBg,
        '--text': textPrimary,
        '--text-primary': textPrimary,
        '--text-secondary': textSecondary,
        '--text-heading': textPrimary,
        '--text-inverse': textInverse,
        '--time-text': textPrimary,
        '--accent': accent,
        '--accent-contrast': accentContrast,
        '--accent-soft': accentSoft,
        '--progress-ring': accent,
        '--progress-bg': progressBg,
        '--btn-primary-bg': accent,
        '--btn-primary-text': accentContrast,
        '--btn-primary-shadow': shadowSoft,
        '--btn-primary-hover-shadow': shadowRaised,
        '--btn-secondary-bg': surfaceMuted,
        '--btn-secondary-text': textSecondary,
        '--btn-secondary-border': secondaryBorder,
        '--btn-secondary-hover-bg': actionHoverBg,
        '--btn-secondary-hover-border': secondaryHoverBorder,
        '--action-bg': surfaceMuted,
        '--action-text': actionText,
        '--action-border': actionBorder,
        '--action-hover-bg': actionHoverBg,
        '--action-hover-border': secondaryHoverBorder,
        '--input-bg': inputBg,
        '--input-border': inputBorder,
        '--input-border-focus': focusRing,
        '--input-placeholder': inputPlaceholder,
        '--focus-ring': focusRing,
        '--theme-card-bg': themeCardBg,
        '--theme-card-hover-bg': themeCardHoverBg,
        '--theme-card-border': themeCardBorder,
        '--theme-card-hover-border': themeCardHoverBorder,
        '--theme-card-shadow': themeCardShadow,
        '--theme-card-hover-shadow': themeCardHoverShadow,
        '--theme-chip-bg': hexToRgba(accent, group === 'light' ? 0.12 : 0.24),
        '--theme-chip-text': accentContrast,
        '--theme-preview-border': hexToRgba(group === 'light' ? '#000000' : '#FFFFFF', 0.18),
        '--border-subtle': borderSubtle,
        '--border-strong': borderStrong,
        '--shadow-soft': shadowSoft,
        '--shadow-raised': shadowRaised,
        '--window-radius': windowRadius,
        '--header-height': headerHeight,
        '--header-control-height': headerControlHeight,
        '--pip-bg': pipBg,
        '--pip-bg-2': pipBg2,
        '--pip-time-color': textPrimary,
        '--pip-btn-bg': pipBtnBase,
        '--pip-btn-border': pipBtnBorder,
        '--pip-btn-hover-bg': pipBtnHover,
        '--pip-close-bg': pipCloseBg,
        '--pip-close-border': pipCloseBorder,
        '--pip-font': sharedFont,
        '--pip-shadow': pipShadow,
        '--pip-container-bg': pipContainerBackground,
        '--pip-container-shadow': pipShadow,
        '--pip-backdrop-filter': pipBackdropFilter,
        '--pip-btn-backdrop-filter': pipBtnBackdropFilter,
        '--pip-time-shadow': pipTimeShadow,
        '--pip-btn-text-color': pipBtnTextColor,
        '--pip-close-color': pipCloseColor,
        '--pip-radius': '14px',
        '--tiny-bg': tinyBg,
        '--tiny-text': textPrimary,
        '--tiny-shadow': tinyShadow,
        '--tiny-border': tinyBorder,
        '--tiny-close-bg': tinyCloseBg,
        '--tiny-close-bg-hover': tinyCloseBgHover,
        '--tiny-close-border': tinyBorder,
        '--tiny-backdrop-filter': tinyBackdropFilter,
        '--tiny-time-shadow': tinyTimeShadow,
        '--tiny-close-color': tinyCloseColor,
        '--tiny-font': sharedFont
    };

    if (theme.tokenOverrides && typeof theme.tokenOverrides === 'object') {
        Object.entries(theme.tokenOverrides).forEach(([key, value]) => {
            tokens[key] = value;
        });
    }

    return tokens;
};

class Timer {
    constructor() {
        this.timeLeft = 0;
        this.totalTime = 0;
        this.isRunning = false;
        this.interval = null;
        this.preferredTimes = [];
        // One-time guards per run
        this.hasRestoredTimes = false;
        this.isSoundEnabled = true;
        this.confettiTriggered = false;
        this.lastBroadcastTimestamp = 0;
        this.lastProgressUpdate = 0;
        this.targetEndTime = null;
        this.lastThemePayload = null;
        this.manualOverride = false;
        this.hiddenThemesKey = 'timer-hidden-themes';
        this.hiddenThemeIds = new Set();
        this.visibleThemeIds = [];
        this.handleThemeCardClick = this.handleThemeCardClick.bind(this);
        this.initializeElements();
        this.setupThemeSystem();
        this.loadPreferredTimes();
        this.setupEventListeners();
        this.setupIpcListeners();
        this.syncFromCore();
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
        this.themeBtn = document.getElementById('themeBtn');
        this.backFromThemeBtn = document.getElementById('backFromThemeBtn');
        this.lightThemeGrid = document.getElementById('lightThemeGrid');
        this.darkThemeGrid = document.getElementById('darkThemeGrid');
        this.currentThemeLabelEl = document.getElementById('currentThemeLabel');
        this.themePanel = document.getElementById('tab-theme');
        this.resetThemeBtn = document.getElementById('resetThemeBtn');
        this.backFromAnalyticsBtn = document.getElementById('backFromAnalyticsBtn');
        this.analyticsTotalTimeEl = document.getElementById('analyticsTotalTime');
        this.analyticsTotalSessionsEl = document.getElementById('analyticsTotalSessions');
        this.analyticsWeekTimeEl = document.getElementById('analyticsWeekTime');
        this.analyticsGraphMetaEl = document.getElementById('analyticsGraphMeta');
        this.analyticsGraphEl = document.getElementById('analyticsGraph');
        this.analyticsListEl = document.getElementById('analyticsList');
        this.analyticsToggleLogsBtn = document.getElementById('analyticsToggleLogsBtn');
        this._analyticsLogsVisible = false;

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
            const presetNameEl = document.createElement('div');
            presetNameEl.className = 'preset-name';
            presetNameEl.textContent = toSafeString(preset && preset.name);

            const presetTimeEl = document.createElement('div');
            presetTimeEl.className = 'preset-time';
            const minutes = Number(preset && preset.minutes);
            presetTimeEl.textContent = `${Number.isFinite(minutes) ? minutes : 0}:00`;

            presetBtn.appendChild(presetNameEl);
            presetBtn.appendChild(presetTimeEl);
            presetBtn.addEventListener('click', () => {
                this.setTime(preset.minutes, 0);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'preset-delete-btn';
            deleteBtn.textContent = '×';
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
        if (this.resetThemeBtn) {
            this.resetThemeBtn.addEventListener('click', () => this.resetHiddenThemes());
        }
        // Note: Window control handlers are centralized in public/js/window-controls.js

        // Tab switching
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleTabNavigation(btn));
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
            this.backBtn.addEventListener('click', () => this.navigateToTab('tab-timer'));
        }
        if (this.backFromThemeBtn) {
            this.backFromThemeBtn.addEventListener('click', () => this.navigateToTab('tab-timer'));
        }
        if (this.backFromAnalyticsBtn) {
            this.backFromAnalyticsBtn.addEventListener('click', () => this.navigateToTab('tab-timer'));
        }

        if (this.analyticsToggleLogsBtn) {
            this.analyticsToggleLogsBtn.addEventListener('click', () => {
                this._analyticsLogsVisible = !this._analyticsLogsVisible;
                this.updateAnalyticsLogsVisibility();
            });
        }
        if (this.themeBtn) {
            this.themeBtn.addEventListener('click', () => {
                const isPressed = this.themeBtn.getAttribute('aria-pressed') === 'true';
                if (!isPressed) {
                    this.navigateToTab('tab-theme');
                } else {
                    this.navigateToTab('tab-timer');
                }
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
            } else if (e.altKey && (e.key === 'd' || e.key === 'D')) {
                // Restore default preset timers
                e.preventDefault();
                this.restoreDefaultPresets();
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

    // Listen for centralized timer updates from main (TimerCore) and sync UI
    setupIpcListeners() {
        try {
            window.electronAPI.onMainTimerUpdate((event, state) => {
                this.applyStateFromCore(state);
            });
        } catch (_) { }

        try {
            window.electronAPI.onAnalyticsUpdated(() => {
                this.refreshAnalytics();
            });
        } catch (_) { }
    }

    // Pull initial state from the core (used on startup)
    async syncFromCore() {
        try {
            const state = await window.electronAPI.timerCoreGetState();
            this.applyStateFromCore(state);
        } catch (_) { }
    }

    // Apply a state object from the centralized core
    applyStateFromCore(state) {
        if (!state || typeof state !== 'object') return;
        const prev = this.timeLeft;
        this.timeLeft = Number(state.timeLeft) || 0;
        this.totalTime = Number(state.totalTime) || 0;
        this.isRunning = !!state.isRunning;
        this.updateDisplay();
        this.updateProgress();
        if (this.startBtn) this.startBtn.disabled = this.isRunning || this.timeLeft <= 0;
        if (this.pauseBtn) this.pauseBtn.disabled = !this.isRunning;
        if (prev > 0 && this.timeLeft <= 0) {
            this.timerComplete();
        }
    }

    // =====================
    // Theme management
    // =====================
    handleTabNavigation(button) {
        const target = button.getAttribute('data-tab');
        this.navigateToTab(target, button);
    }

    navigateToTab(target, button) {
        this.tabButtons.forEach(b => b.classList.remove('active'));
        this.tabPanels.forEach(p => p.classList.remove('active'));
        if (button) {
            button.classList.add('active');
        } else {
            const matchingBtn = Array.from(this.tabButtons).find(b => b.getAttribute('data-tab') === target);
            if (matchingBtn) {
                matchingBtn.classList.add('active');
                if (matchingBtn === this.themeBtn) {
                    this.themeBtn.setAttribute('aria-pressed', 'true');
                } else {
                    this.themeBtn && this.themeBtn.setAttribute('aria-pressed', 'false');
                }
            }
        }
        const panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
        if (target === 'tab-new') {
            document.body.classList.add('new-tab-active');
        } else {
            document.body.classList.remove('new-tab-active');
        }
        if (target === 'tab-analytics') {
            this.refreshAnalytics();
        }
        if (target === 'tab-theme' && this.themeBtn) {
            this.themeBtn.classList.add('active');
            this.themeBtn.setAttribute('aria-pressed', 'true');
        } else if (this.themeBtn) {
            this.themeBtn.classList.remove('active');
            this.themeBtn.setAttribute('aria-pressed', 'false');
        }
    }

    setupThemeSystem() {
        this.themeDefinitions = THEME_DEFINITIONS;
        this.themeLookup = new Map(this.themeDefinitions.map(def => [def.id, def]));
        const hiddenFromStorage = this.loadHiddenThemes();
        this.hiddenThemeIds = new Set(hiddenFromStorage);
        this.refreshThemeCollections();

        this.currentThemeId = this.getFirstVisibleThemeId() || (this.themeDefinitions[0]?.id || null);
        this.restoreThemePreference();
        if (!this.currentThemeId || this.hiddenThemeIds.has(this.currentThemeId) || !this.themeOrder.includes(this.currentThemeId)) {
            this.currentThemeId = this.getFirstVisibleThemeId() || (this.themeDefinitions[0]?.id || null);
        }

        if (this.currentThemeId) {
            this.applyThemeById(this.currentThemeId, { skipPersist: true });
        }
        this.renderThemeGallery();
        this.syncThemeUiState();
    }

    restoreThemePreference() {
        let saved = null;
        try {
            saved = localStorage.getItem('timer-app-theme');
        } catch (_) {
            saved = null;
        }

        if (!saved) {
            if (!this.currentThemeId) {
                this.currentThemeId = this.getFirstVisibleThemeId() || 'midnight';
            }
            return;
        }

        if (this.themeLookup.has(saved) && !this.hiddenThemeIds.has(saved)) {
            this.currentThemeId = saved;
            return;
        }

        const remapped = LEGACY_THEME_MAP[saved];
        if (remapped && this.themeLookup.has(remapped) && !this.hiddenThemeIds.has(remapped)) {
            this.currentThemeId = remapped;
        }

        if (!this.currentThemeId || this.hiddenThemeIds.has(this.currentThemeId)) {
            const fallback = this.getFirstVisibleThemeId();
            if (fallback) {
                this.currentThemeId = fallback;
            }
        }
    }

    renderThemeGallery() {
        if (this.lightThemeGrid) {
            this.lightThemeGrid.innerHTML = '';
            this.groupedThemes.light.forEach((theme) => {
                const card = this.createThemeCard(theme);
                this.lightThemeGrid.appendChild(card);
            });
        }

        if (this.darkThemeGrid) {
            this.darkThemeGrid.innerHTML = '';
            this.groupedThemes.dark.forEach((theme) => {
                const card = this.createThemeCard(theme);
                this.darkThemeGrid.appendChild(card);
            });
        }
    }

    loadHiddenThemes() {
        try {
            const raw = localStorage.getItem(this.hiddenThemesKey);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter((id) => typeof id === 'string');
        } catch (_) {
            return [];
        }
    }

    persistHiddenThemes() {
        try {
            if (this.hiddenThemeIds.size > 0) {
                localStorage.setItem(this.hiddenThemesKey, JSON.stringify([...this.hiddenThemeIds]));
            } else {
                localStorage.removeItem(this.hiddenThemesKey);
            }
        } catch (_) { /* ignore storage issues */ }
    }

    refreshThemeCollections() {
        const visibleThemes = this.themeDefinitions.filter((theme) => !this.hiddenThemeIds.has(theme.id));
        this.groupedThemes = {
            light: visibleThemes.filter(theme => theme.group === 'light'),
            dark: visibleThemes.filter(theme => theme.group === 'dark')
        };
        this.themeOrder = visibleThemes.map(theme => theme.id);
        this.visibleThemeIds = [...this.themeOrder];
    }

    getFirstVisibleThemeId() {
        return this.themeOrder.length > 0 ? this.themeOrder[0] : null;
    }

    disableTheme(themeId) {
        if (!themeId || !this.themeLookup.has(themeId) || this.hiddenThemeIds.has(themeId)) {
            return false;
        }

        if (!this.themeOrder.includes(themeId)) {
            return false;
        }

        if (this.themeOrder.length <= 1) {
            alert('At least one theme must remain available. Reset hidden themes to restore all themes.');
            return false;
        }

        this.hiddenThemeIds.add(themeId);
        this.persistHiddenThemes();
        this.refreshThemeCollections();

        const needsFallback = !this.currentThemeId || this.currentThemeId === themeId || !this.themeOrder.includes(this.currentThemeId);
        if (needsFallback) {
            const fallback = this.getFirstVisibleThemeId();
            if (fallback && fallback !== this.currentThemeId) {
                this.applyThemeById(fallback);
            }
        }

        this.renderThemeGallery();
        this.syncThemeUiState();
        try { console.log('[Theme] Disabled theme:', themeId); } catch (_) { }
        return true;
    }

    resetHiddenThemes() {
        if (this.hiddenThemeIds.size === 0) {
            this.renderThemeGallery();
            this.syncThemeUiState();
            return;
        }

        this.hiddenThemeIds.clear();
        this.persistHiddenThemes();
        this.refreshThemeCollections();

        if (!this.currentThemeId || !this.themeOrder.includes(this.currentThemeId)) {
            const fallback = this.getFirstVisibleThemeId();
            if (fallback) {
                this.applyThemeById(fallback);
            }
        }

        this.renderThemeGallery();
        this.syncThemeUiState();
        try { console.log('[Theme] Reset hidden themes'); } catch (_) { }
    }

    createThemeCard(theme) {
        const card = document.createElement('button');
        card.className = 'theme-card';
        card.type = 'button';
        card.setAttribute('data-theme-id', theme.id);
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-pressed', theme.id === this.currentThemeId ? 'true' : 'false');
        card.title = 'Click to apply. Alt + Click to hide this theme.';
        card.innerHTML = `
            <span class="theme-card-preview">
                <span class="theme-swatch" style="background:${theme.palette.background}"></span>
                <span class="theme-swatch" style="background:${theme.palette.surface}"></span>
                <span class="theme-swatch" style="background:${theme.palette.accent}"></span>
            </span>
            <span class="theme-card-info">
                <span class="theme-card-label">${theme.name}</span>
                <span class="theme-card-meta">${theme.group === 'light' ? 'Light' : 'Dark'} theme</span>
            </span>
            <span class="theme-card-active-indicator" aria-hidden="true"></span>
        `;
        card.addEventListener('click', this.handleThemeCardClick);
        return card;
    }

    handleThemeCardClick(event) {
        const target = event.currentTarget;
        const themeId = target.getAttribute('data-theme-id');
        if (!themeId) {
            return;
        }

        if (event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            this.disableTheme(themeId);
            return;
        }

        if (themeId === this.currentThemeId) {
            return;
        }
        this.applyThemeById(themeId);
        this.syncThemeUiState();
    }

    applyThemeById(themeId, options = {}) {
        if (!this.themeLookup.has(themeId)) {
            console.warn('Attempted to apply unknown theme', themeId);
            return;
        }
        if (this.hiddenThemeIds.has(themeId)) {
            console.warn('Attempted to apply hidden theme', themeId);
            return;
        }
        const theme = this.themeLookup.get(themeId);
        const tokens = createThemeTokens(theme);
        const body = document.body;

        Object.entries(tokens).forEach(([key, value]) => {
            body.style.setProperty(key, value);
        });

        body.dataset.themeGroup = theme.group;
        body.classList.toggle('theme-dark', theme.group === 'dark');
        body.classList.toggle('theme-light', theme.group === 'light');

        this.currentThemeId = themeId;
        this.currentThemeTokens = tokens;

        if (!options.skipPersist) {
            try {
                localStorage.setItem('timer-app-theme', themeId);
            } catch (_) { }
        }

        try {
            console.log('[Theme] Applied theme:', themeId);
        } catch (_) { }

        this.pushThemeToAuxWindows(theme, tokens);
        this.syncThemeUiState();
    }

    syncThemeUiState() {
        if (!this.themeLookup.has(this.currentThemeId)) return;
        const theme = this.themeLookup.get(this.currentThemeId);
        if (this.currentThemeLabelEl) {
            this.currentThemeLabelEl.textContent = theme ? theme.name : 'Default';
        }

        const allCards = document.querySelectorAll('.theme-card');
        allCards.forEach((card) => {
            const cardThemeId = card.getAttribute('data-theme-id');
            const isActive = cardThemeId === this.currentThemeId;
            card.classList.toggle('active', isActive);
            card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    cycleTheme(direction = 1) {
        const len = this.themeOrder.length;
        if (len === 0) return;

        const currentIndex = this.themeOrder.indexOf(this.currentThemeId);
        let nextIndex = (currentIndex >= 0 ? currentIndex : 0) + direction;
        nextIndex = ((nextIndex % len) + len) % len;
        const nextTheme = this.themeOrder[nextIndex];
        if (nextTheme) {
            this.applyThemeById(nextTheme);
        }
    }

    pushThemeToAuxWindows(theme, tokens) {
        if (!theme || !tokens) return;
        if (!window.electronAPI || typeof window.electronAPI.updateAuxWindowTheme !== 'function') {
            return;
        }
        const payload = {
            id: theme.id,
            group: theme.group,
            tokens,
            palette: theme.palette
        };
        try {
            const result = window.electronAPI.updateAuxWindowTheme(payload);
            if (result && typeof result.then === 'function') {
                result.catch(() => { });
            }
            this.lastThemePayload = payload;
        } catch (_) { /* ignore */ }
    }

    setDefaultTime(minutes, seconds) {
        this.setTime(minutes, seconds);
    }

    setTime(minutes, seconds) {
        // Update local state immediately for responsive UI
        this.timeLeft = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
        this.totalTime = this.timeLeft;
        this.updateDisplay();
        this.updateProgress();
        if (this.startBtn) this.startBtn.disabled = this.timeLeft <= 0;
        if (this.pauseBtn) this.pauseBtn.disabled = true;

        // Notify centralized timer core
        try { window.electronAPI.timerCoreSetTime(minutes, seconds); } catch (_) { }

        // Reset completion guards for new configured time
        this._completionFired = false;
        this._soundPlayed = false;
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
        // Optimistic delete: update UI first
        this.preferredTimes.splice(index, 1);
        this.renderPresetTimes();
        try {
            const success = await window.electronAPI.deletePreferredTime(index);
            if (!success) {
                console.warn('Delete preset failed (IPC returned false); reloading presets');
                await this.loadPreferredTimes();
            }
        } catch (error) {
            console.error('Failed to delete preferred time:', error);
            await this.loadPreferredTimes();
        }
    }

    // Returns the app's default preset list
    getDefaultPresets() {
        return [
            { name: 'Fifteen', minutes: 15 },
            { name: 'Hour', minutes: 60 },
            { name: 'TwentyFive', minutes: 25 },
            { name: 'FortyFive', minutes: 45 }
        ];
    }

    // Restores default presets: optimistic UI then persist
    async restoreDefaultPresets() {
        const defaults = this.getDefaultPresets();
        // Optimistic UI update
        this.preferredTimes = [...defaults];
        this.renderPresetTimes();

        try {
            // Fetch currently saved presets and delete them from storage (delete from end to start)
            const existing = await window.electronAPI.getPreferredTimes();
            if (Array.isArray(existing)) {
                for (let i = existing.length - 1; i >= 0; i--) {
                    try { await window.electronAPI.deletePreferredTime(i); } catch (_) { }
                }
            }
            // Save defaults
            for (const preset of defaults) {
                try { await window.electronAPI.savePreferredTime(preset); } catch (_) { }
            }
            // Reload to ensure consistency with disk
            await this.loadPreferredTimes();
        } catch (err) {
            console.error('Failed to restore default presets:', err);
            // Reload to reflect actual state if something went wrong
            await this.loadPreferredTimes();
        }
    }

    startTimer() {
        try { window.electronAPI.timerCoreStart(); } catch (_) { }
        // Optimistically update button state; source of truth will arrive via IPC
        if (this.startBtn) this.startBtn.disabled = true;
        if (this.pauseBtn) this.pauseBtn.disabled = false;
    }

    pauseTimer() {
        try { window.electronAPI.timerCorePause(); } catch (_) { }
        if (this.startBtn) this.startBtn.disabled = false;
        if (this.pauseBtn) this.pauseBtn.disabled = true;
    }

    resetTimer() {
        try { window.electronAPI.timerCoreReset(); } catch (_) { }
        if (this.startBtn) this.startBtn.disabled = false;
        if (this.pauseBtn) this.pauseBtn.disabled = true;
        // Reset guards on reset
        this._completionFired = false;
        this._soundPlayed = false;
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
        // Ensure we only fire completion effects once per run
        if (this._completionFired) return;
        this._completionFired = true;

        this.pauseTimer();
        this.timeDisplay.classList.add('timer-complete');

        // Show confetti animation (main window only)
        this.showConfetti();

        // Show system notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
                body: 'Your timer has finished!',
                icon: 'assets/icon.png'
            });
        }

        // Play sound once
        this.playNotificationSound();

        setTimeout(() => {
            this.timeDisplay.classList.remove('timer-complete');
        }, 1000);

        try { this.refreshAnalytics(); } catch (_) { }
    }

    formatDuration(seconds) {
        const total = Math.max(0, Math.floor(Number(seconds) || 0));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }

    startOfDay(ts) {
        const d = new Date(ts);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    async fetchAnalytics() {
        try {
            if (!window.electronAPI || typeof window.electronAPI.analyticsGet !== 'function') {
                return { sessions: [] };
            }
            const data = await window.electronAPI.analyticsGet();
            if (!data || typeof data !== 'object' || !Array.isArray(data.sessions)) {
                return { sessions: [] };
            }
            return data;
        } catch (_) {
            return { sessions: [] };
        }
    }

    async refreshAnalytics() {
        if (!this.analyticsListEl || !this.analyticsGraphEl) return;
        const data = await this.fetchAnalytics();
        const sessions = Array.isArray(data.sessions) ? data.sessions : [];
        const totalSeconds = sessions.reduce((sum, s) => sum + (Number(s && s.durationSeconds) || 0), 0);
        if (this.analyticsTotalTimeEl) this.analyticsTotalTimeEl.textContent = this.formatDuration(totalSeconds);
        if (this.analyticsTotalSessionsEl) this.analyticsTotalSessionsEl.textContent = String(sessions.length);

        const now = Date.now();
        const weekStart = this.startOfDay(now) - 6 * 24 * 3600 * 1000;
        const weekSeconds = sessions
            .filter(s => (Number(s && s.completedAt) || 0) >= weekStart)
            .reduce((sum, s) => sum + (Number(s && s.durationSeconds) || 0), 0);
        if (this.analyticsWeekTimeEl) this.analyticsWeekTimeEl.textContent = this.formatDuration(weekSeconds);

        const series = this.buildLast15DaysSeries(sessions);
        this.drawAnalyticsGraph(series);
        const weekTotalMinutes = Math.round(series.reduce((sum, d) => sum + d.minutes, 0));
        if (this.analyticsGraphMetaEl) this.analyticsGraphMetaEl.textContent = `${weekTotalMinutes}m`;

        this.renderAnalyticsList(sessions);
        this.updateAnalyticsLogsVisibility();
    }

    updateAnalyticsLogsVisibility() {
        if (this.analyticsListEl) {
            this.analyticsListEl.style.display = this._analyticsLogsVisible ? '' : 'none';
        }
        if (this.analyticsToggleLogsBtn) {
            this.analyticsToggleLogsBtn.textContent = this._analyticsLogsVisible ? 'Hide logs' : 'Show logs';
        }
    }

    buildLast15DaysSeries(sessions) {
        const todayStart = this.startOfDay(Date.now());
        const days = [];
        for (let i = 14; i >= 0; i -= 1) {
            const start = todayStart - i * 24 * 3600 * 1000;
            days.push({ start, minutes: 0 });
        }
        sessions.forEach((s) => {
            const completedAt = Number(s && s.completedAt) || 0;
            const durationSeconds = Number(s && s.durationSeconds) || 0;
            if (!completedAt || durationSeconds <= 0) return;
            const dayStart = this.startOfDay(completedAt);
            const idx = days.findIndex(d => d.start === dayStart);
            if (idx >= 0) {
                days[idx].minutes += durationSeconds / 60;
            }
        });
        days.forEach(d => {
            d.minutes = Math.round(d.minutes);
        });
        return days;
    }

    drawAnalyticsGraph(days) {
        const canvas = this.analyticsGraphEl;
        if (!canvas || typeof canvas.getContext !== 'function') return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const padding = 18;
        const innerW = width - padding * 2;
        const innerH = height - padding * 2;
        const max = Math.max(10, ...days.map(d => d.minutes || 0));

        ctx.globalAlpha = 1;
        const styles = getComputedStyle(document.body);
        const accent = styles.getPropertyValue('--accent').trim() || '#4CAF50';
        const border = styles.getPropertyValue('--action-border').trim() || 'rgba(255, 255, 255, 0.12)';
        const gridStroke = border.startsWith('rgba') || border.startsWith('rgb') ? border : hexToRgba(border, 0.45);

        ctx.strokeStyle = gridStroke;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 2; i += 1) {
            const y = padding + (innerH * i) / 2;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + innerW, y);
            ctx.stroke();
        }

        const barGap = 8;
        const barW = Math.max(8, (innerW - barGap * (days.length - 1)) / days.length);
        const fill = hexToRgba(accent, 0.75);
        const highlight = hexToRgba(accent, 0.95);

        days.forEach((d, idx) => {
            const value = Number(d.minutes) || 0;
            const ratio = clamp(value / max, 0, 1);
            const h = Math.round(innerH * ratio);
            const x = padding + idx * (barW + barGap);
            const y = padding + innerH - h;
            ctx.fillStyle = idx === days.length - 1 ? highlight : fill;
            ctx.beginPath();
            const r = 6;
            const w = barW;
            const hh = h;
            const rr = Math.min(r, Math.floor(w / 2), Math.floor(hh / 2));
            ctx.moveTo(x + rr, y);
            ctx.arcTo(x + w, y, x + w, y + hh, rr);
            ctx.arcTo(x + w, y + hh, x, y + hh, rr);
            ctx.arcTo(x, y + hh, x, y, rr);
            ctx.arcTo(x, y, x + w, y, rr);
            ctx.closePath();
            ctx.fill();
        });
    }

    renderAnalyticsList(sessions) {
        if (!this.analyticsListEl) return;
        this.analyticsListEl.innerHTML = '';

        const list = sessions.slice(0, 25);
        if (list.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'analytics-item';
            empty.textContent = 'No completed sessions yet.';
            this.analyticsListEl.appendChild(empty);
            return;
        }

        list.forEach((session) => {
            const item = document.createElement('div');
            item.className = 'analytics-item';

            const main = document.createElement('div');
            main.className = 'analytics-item-main';

            const meta = document.createElement('div');
            meta.className = 'analytics-item-meta';
            const completedAt = Number(session && session.completedAt) || 0;
            const when = completedAt ? new Date(completedAt).toLocaleString() : '';
            meta.textContent = `${this.formatDuration(session && session.durationSeconds)} • ${when}`;

            main.appendChild(meta);

            const actions = document.createElement('div');
            actions.className = 'analytics-item-actions';

            const del = document.createElement('button');
            del.className = 'analytics-item-delete';
            del.type = 'button';
            del.textContent = 'Delete';

            const sessionId = session && session.id;

            del.addEventListener('click', async () => {
                if (!sessionId) return;
                try {
                    if (window.electronAPI && typeof window.electronAPI.analyticsDeleteSession === 'function') {
                        await window.electronAPI.analyticsDeleteSession({ id: sessionId });
                        this.refreshAnalytics();
                    }
                } catch (_) { }
            });

            actions.appendChild(del);
            item.appendChild(main);
            item.appendChild(actions);
            this.analyticsListEl.appendChild(item);
        });
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
        if (this._soundPlayed) return; // prevent re-trigger on focus regain
        this._soundPlayed = true;
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
        } catch (e) { }
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
                ctx.resume().catch(() => { });
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
                try { this.sendUpdateToPip(); } catch (_) { }
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
        } else if (update.action === 'update') {
            this.timeLeft = update.timeLeft;
            this.totalTime = update.totalTime;
            this.isRunning = update.isRunning;
        }
    }

    // No-op: Updates are broadcast from TimerCore in the main process
    sendUpdateToPip() { }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // Create the timer
    window.timer = new Timer();
    // Pull initial state from centralized core
    try { window.timer.syncFromCore && window.timer.syncFromCore(); } catch (_) { }
    // Handle auto-start timer command from main process
    window.electronAPI.onAutoStartTimer(() => {
        console.log('Auto-start timer command received');
        if (!window.timer.isRunning) {
            console.log('Starting timer automatically');
            try { window.timer.startTimer(); } catch (_) { }
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
