/**
 * Frontend Protection Script
 * --------------------------
 * Deterrent to prevent casual inspection and copying of source code.
 * Note: Real security relies on Supabase Row Level Security (RLS).
 */

(function () {
    // 1. Disable Right-Click Context Menu
    document.addEventListener('contextmenu', e => e.preventDefault());

    // 2. Prevent Keyboard Shortcuts
    document.addEventListener('keydown', e => {
        // Disable F12
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
            e.preventDefault();
            return false;
        }

        // Disable Cmd+Opt+I (Mac Inspect), Cmd+Opt+J (Mac Console)
        if (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j')) {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            return false;
        }

        // Disable Cmd+U (Mac View Source)
        if (e.metaKey && e.key === 'u') {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+S, Ctrl+P (Save, Print)
        if (e.ctrlKey && (e.key === 's' || e.key === 'p')) {
            e.preventDefault();
            return false;
        }

        // Disable Cmd+S, Cmd+P (Mac Save, Print)
        if (e.metaKey && (e.key === 's' || e.key === 'p')) {
            e.preventDefault();
            return false;
        }
    });

    // 3. Disable Drag/Select for content protection
    document.addEventListener('selectstart', e => e.preventDefault());

    // 4. DevTools Detection & Reload
    // We monitor the difference between outer and inner dimensions.
    // If a DevTools pane is opened (docked), the inner dimension drops significantly.
    const threshold = 160;
    const checkDevTools = () => {
        const widthDiff = window.outerWidth - window.innerWidth > threshold;
        const heightDiff = window.outerHeight - window.innerHeight > threshold;

        if (widthDiff || heightDiff) {
            // DevTools likely open
            location.reload();
        }
    };

    // Check on resize and periodically
    window.addEventListener('resize', checkDevTools);
    setInterval(checkDevTools, 1000);

    // 5. Console clearing (deterrent)
    setInterval(() => {
        console.clear();
        console.log("%cSecurity Protection Active", "color: red; font-size: 20px; font-weight: bold;");
        console.log("Developer Tools are disabled on this application.");
    }, 2000);

})();
