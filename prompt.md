# Advanced Premium Pomodoro & Timer Application - Prompt

You are tasked with building an ultra-premium, heavily animated Pomodoro & Timer desktop application using **Electron**. Your primary goal is to prioritize aesthetics, fluid micro-animations, and extremely polished macOS (and cross-platform) window management. The app must feel like a native, top-tier commercial productivity tool.

## 1. Core Architecture & State Management
- **Technology Stack:** Electron (Node.js backend) + HTML/CSS/Vanilla JS frontend. You may optionally use a lightweight framework like React, Vue, or Svelte *only* if you believe it will significantly enhance the performance of complex UI physics (like the completion confetti).
- **Packaging:** Configure `electron-builder` in `package.json` to compile into installable formats: `.dmg` (macOS arm64/x64), `nsis` / portable (Windows x64), and AppImage / deb (Linux x64).
- **State Synchronization (CRITICAL):**
  - Implement a `TimerCore` class inside the Main process (`main.js`). This is the *single source of truth* for the timer logic.
  - Renderers (Main, PiP, Tiny windows) must never hold independent ticking state. They only send commands (start, pause, reset, setTime) to the Main process via IPC (`ipcRenderer.invoke`).
  - The Main process broadcasts state ticks back to all open windows synchronously (`webContents.send`).
  - **No Throttling:** You must use Electron command line switches (`disable-renderer-backgrounding`, `disable-background-timer-throttling`, `disable-backgrounding-occluded-windows`) to ensure the timer stays accurate when windows are hidden, minimized, or the system sleeps.
- **Single Instance Lock:** Prevent multiple app instances. If the user tries to open the app again while it's running, focus the existing main window (restoring it if minimized).

## 2. Comprehensive Window Modes & Behavior

The application seamlessly transitions between three window modes (Main, PiP, and Tiny). Only **one** mode is actively visible to the user at a time. The transition between them must be instant and smooth.

### A. Main Window Dashboard
- **Dimensions & Style:** Fixed size (approx. 500x650), non-resizable. Frameless (`frame: false`), completely transparent background (`transparent: true`, `backgroundColor: '#00000000'`) to allow custom rounded CSS corners without white artifacts.
- **macOS Native Traffic Lights:** Use `titleBarStyle: 'hiddenInset'` on macOS to elegantly integrate the native close/minimize/maximize buttons. On Windows/Linux, build custom HTML window controls (close, minimize) positioned in the title bar.
- **Content:** Central circular progress ring, large Monospaced timer text, intuitive control buttons (play/pause/reset/presets), a Theme Gallery tab, and an Analytics tab. All styling must be dictated by CSS variables driven by the theme core.
- **Transitioning:** When Picture-in-Picture or Tiny mode is opened, the main window must either be minimized or hidden programmatically, to avoid clutter.

### B. Picture-in-Picture (PiP) Mode
- **Dimensions & Style:** A small, horizontal rectangle (approx. 110x54). `alwaysOnTop: true`, `skipTaskbar: true`, `frame: false`, `transparent: true`.
- **Content & UI:** Only the current remaining time and ultra-compact, icon-based controls (Play, Pause, Reset). The window must tightly hug these elements with no wasted padding. The background is a blurred translucent overlay (`backdrop-filter: blur()`).
- **Interaction:**
  - Placed via Electron layout calculation to the absolute bottom-right corner of the user's primary display (with a safe padding like 12px from the edges).
  - Draggable ` -webkit-app-region: drag` applied specifically to the time area, while buttons remain clickable.
  - A small `×` (close) button only appears on hover or focus, allowing the user to seamlessly close PiP and restore the main window.
- **Hotkeys:** Can be toggled on/off instantly via a Global Node Shortcut (`Cmd+Shift+P` / `Ctrl+Shift+P`).

### C. Tiny Mode
- **Dimensions & Style:** Ultra-compact square or circle (approx. 85x60). `alwaysOnTop: true`, `skipTaskbar: true`, `frame: false`, `transparent: true`.
- **Purpose:** A passive indicator. It hides complicated controls entirely, displaying *only* the clock. The UI is completely stripped back for maximum focus.
- **Interaction & Reversion:** Draggable like PiP. Closing the Tiny window dynamically tracks its lifecycle and safely restores focus to the user's previously active window (not necessarily the main timer window, unless explicitly requested).

## 3. Aesthetic, Theming, and Visual Polish

This application lives and dies by its aesthetic. The user must be "wowed".

- **Dynamic Theme System:** 
  - Provide a gallery of at least 8 meticulously selected, balanced color palettes (spanning Light and Dark modes) - examples: OLED Black, Catppuccin Mocha, Nord, Midnight, GitHub Light, Gruvbox.
  - Changing a theme adjusts a payload of CSS variables (`--bg`, `--accent`, `--surface`, `--text`, shadows, gradients).
  - The active theme payload must be synced to PiP and Tiny windows instantly via IPC so they match the Main window.
- **Glassmorphism & Depth:** Use strong, layered box-shadows (e.g., `0 12px 28px rgba(0,0,0,0.45)`) that adapt based on the theme (darker shadows for Light mode, lighter/glowy shadows or subtle borders for Dark mode) to simulate physical elevation.
- **Fluid Micro-Animations:**
  - **Progress Ring:** The SVG circle dash-offset must not jitter. Use `transition: stroke-dashoffset 0.3s ease` or `requestAnimationFrame` for a buttery smooth countdown.
  - **Buttons:** Every interactive element has a hover state (subtle scaling `transform: scale(1.05)`, background color shift, and shadow intensification) and an active click state.
  - **Icons:** Use smooth SVG transitions when swapping Play and Pause icons.
- **Rewarding Completion Sequence:**
  - When the timer hits `00:00`, fire a complex HTML/CSS (or Canvas) Confetti animation *within* the Main window bounds.
  - The physics must include diverse shapes (triangles, diamonds, squares, streamers, sparkles).
  - Include rotational wobbles, edge-bang bursts, and realistic gravity drifting without causing CPU spikes or DOM memory leaks.
  - Add an optional satisfying but unobtrusive Audio "Ping", triggering a native OS Notification via `Notification` API.

## 4. Extended Capabilities
- **Local Analytics Storage:** Every completed timer session logs its `startedAt`, `completedAt`, and `durationSeconds` to an `analytics.json` file inside `app.getPath('userData')`.
- **Analytics Dashboard:** Build a clean grid displaying "Total Focused Time", "Total Sessions", and a small SVG bar chart or timeline mapping out recent days or cycles. Allow deletion of records.
- **Custom Presets:** Let users define and name custom timer lengths (e.g., "Reading - 45m"), persist these configuration arrays to `userData`, and display them as clickable chips.

## Final Output Context
Provide the absolute highest quality production-ready code. Break the solution down into distinct, easily implementable files (`main.js`, `preload.js`, `renderer.js`, `index.html`, `pip.html`, `styles.css`). Ensure IPC event listeners are properly managed to prevent memory leaks across multiple window lifecycle changes.
