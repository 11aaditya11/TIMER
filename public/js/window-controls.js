// Window controls functionality
document.addEventListener('DOMContentLoaded', () => {
    const minBtn = document.getElementById('minBtn');
    const maxBtn = document.getElementById('maxBtn');
    const closeBtn = document.getElementById('closeBtn');

    // Minimize window
    if (minBtn) {
        minBtn.addEventListener('click', () => {
            window.electronAPI.minimize();
        });
    }

    // Toggle maximize/restore
    if (maxBtn) {
        maxBtn.addEventListener('click', () => {
            window.electronAPI.maximize();
        });
    }

    // Close window
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.electronAPI.close();
        });
    }
});
