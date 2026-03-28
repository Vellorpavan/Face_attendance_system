/**
 * feedback.js - Global Premium Feedback System
 * Handles Audio Synthesis (Web Audio API) & Haptic Feedback (Vibration API)
 */

const feedback = (() => {
    let audioCtx = null;

    // Initialize Audio Context on first user interaction to bypass browser restrictions
    const initAudio = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    };

    // Helper to create and play a synthesized sound
    const playTone = (freq, type, duration, volume, decay = true) => {
        try {
            initAudio();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            gain.gain.setValueAtTime(volume * 0.2, audioCtx.currentTime); // Keep it subtle
            if (decay) {
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            }

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn("Audio feedback failed:", e);
        }
    };

    // Haptic Feedback (Vibration)
    const vibrate = (pattern) => {
        if ("vibrate" in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // Ignore silently if blocked
            }
        }
    };

    return {
        // success: Soft "ding" (high-pitched, clean)
        success: () => {
            playTone(880, 'sine', 0.2, 0.4); // A5
            setTimeout(() => playTone(1108.73, 'sine', 0.3, 0.3), 50); // C#6
            vibrate(100);
        },

        // error: Soft "buzz" (lower, dissonant)
        error: () => {
            playTone(150, 'triangle', 0.4, 0.5);
            playTone(110, 'triangle', 0.4, 0.4);
            vibrate([100, 50, 100]);
        },

        // click: Very subtle tap
        click: () => {
            playTone(600, 'sine', 0.05, 0.1, false);
            vibrate(40);
        },

        // notify: Soft "pop" or "pulse"
        notify: () => {
            playTone(440, 'sine', 0.15, 0.3);
            vibrate(150);
        },

        // Manual trigger for events
        init: initAudio
    };
})();

// Auto-init on first click/touchstart
document.addEventListener('click', () => feedback.init(), { once: true });
document.addEventListener('touchstart', () => feedback.init(), { once: true });

window.feedback = feedback;
