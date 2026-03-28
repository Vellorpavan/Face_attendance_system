/**
 * notification.js — Global Premium Notification System
 * SVPP ATTENDANCE (FACE RECOGNITION)
 * Replaces all alert() / confirm() / prompt() with modern UI
 */

(function () {
    console.log("🚀 Notification System Initializing...");

    // ── Public API Definition ────────────────────────────────
    // We bind to window immediately to ensure other scripts can see them
    window.showSuccess = (msg, duration) => _toast('success', msg, duration);
    window.showError = (msg, duration) => _toast('error', msg, duration);
    window.showWarning = (msg, duration) => _toast('warning', msg, duration);
    window.showInfo = (msg, duration) => _toast('info', msg, duration);
    window.showToast = (msg, type = 'success') => _toast(type, msg);

    window.showConfirm = (message, options = {}) => {
        console.log("❓ showConfirm Called:", message);
        if (typeof options === 'function') {
            const cb = options;
            return _confirm({ message }).then(result => { if (result) cb(); });
        }
        return _confirm({
            message,
            title: options.title,
            confirmText: options.confirmText,
            cancelText: options.cancelText,
            danger: options.danger
        });
    };

    // ── Inject styles ───────────────────────────────────────
    if (!document.getElementById('ntf-styles')) {
        const style = document.createElement('style');
        style.id = 'ntf-styles';
        style.textContent = `
        #ntf-container {
            position: fixed; bottom: 24px; right: 24px; z-index: 999999;
            display: flex; flex-direction: column-reverse; gap: 10px; pointer-events: none;
        }
        .ntf-toast {
            display: flex; align-items: flex-start; gap: 12px; min-width: 280px; max-width: 380px;
            padding: 14px 18px; border-radius: 16px; background: rgba(14, 20, 38, 0.9);
            backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 40px rgba(0,0,0,0.3);
            color: #f1f5f9; font-family: 'Inter', system-ui, sans-serif; font-size: 13.5px;
            opacity: 0; transform: translateY(16px); transition: all 0.3s cubic-bezier(.4,0,.2,1);
            pointer-events: auto; position: relative; overflow: hidden;
        }
        .ntf-toast.ntf-show { opacity: 1; transform: translateY(0); }
        .ntf-toast.ntf-hide { opacity: 0; transform: scale(0.95); }
        .ntf-icon { font-size: 20px; animation: ntf-pop 0.4s cubic-bezier(.175,.885,.32,1.275); }
        .ntf-body { flex: 1; }
        .ntf-title { font-weight: 700; margin-bottom: 2px; }
        .ntf-msg { color: #94a3b8; font-size: 12.5px; }
        .ntf-bar { position: absolute; bottom: 0; left: 0; height: 2px; width: 100%; transform-origin: left; animation: ntf-shrink linear forwards; }
        .ntf-success .ntf-bar { background: #22c55e; } .ntf-error .ntf-bar { background: #ef4444; }
        @keyframes ntf-shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        @keyframes ntf-pop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

        #ntf-overlay {
            position: fixed; inset: 0; background: rgba(8, 12, 24, 0.5);
            backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%);
            z-index: 999998; display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.3s ease;
        }
        #ntf-overlay.ntf-show { opacity: 1; }
        #ntf-modal {
            background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 28px; padding: 32px; max-width: 400px; width: calc(100% - 40px);
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6); text-align: center;
            color: #fff; transform: scale(0.9); transition: all 0.4s cubic-bezier(.2,1.2,.3,1);
        }
        #ntf-overlay.ntf-show #ntf-modal { transform: scale(1); }
        .ntf-m-icon { font-size: 42px; margin-bottom: 20px; display: inline-flex; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%; align-items: center; justify-content: center; }
        .ntf-m-title { font-size: 20px; font-weight: 800; margin-bottom: 12px; }
        .ntf-m-msg { color: #94a3b8; line-height: 1.6; margin-bottom: 32px; }
        .ntf-m-btns { display: flex; gap: 12px; }
        .ntf-m-btns button { flex: 1; padding: 14px 20px; border: none; border-radius: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .ntf-btn-cancel { background: rgba(255,255,255,0.08); color: #94a3b8; }
        .ntf-btn-confirm { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
        .ntf-btn-confirm.danger { background: linear-gradient(135deg, #ef4444, #dc2626); }
        `;
        document.head.appendChild(style);
    }

    // ── Internal Helpers ─────────────────────────────────────
    function _toast(type, message, duration = 3500) {
        let c = document.getElementById('ntf-container') || (() => {
            const el = document.createElement('div'); el.id = 'ntf-container';
            document.body.appendChild(el); return el;
        })();
        const el = document.createElement('div');
        el.className = `ntf-toast ntf-${type}`;
        el.innerHTML = `
            <div class="ntf-icon">${type === 'success' ? '✅' : '❌'}</div>
            <div class="ntf-body">
                <div class="ntf-title">${type.toUpperCase()}</div>
                <div class="ntf-msg"></div>
            </div>
            <div class="ntf-bar" style="animation-duration:${duration}ms"></div>
        `;
        el.querySelector('.ntf-msg').textContent = message;
        c.appendChild(el);
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('ntf-show')));
        if (window.feedback && typeof window.feedback[type] === 'function') window.feedback[type]();
        setTimeout(() => { el.classList.add('ntf-hide'); setTimeout(() => el.remove(), 400); }, duration);
    }

    function _confirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
        return new Promise(resolve => {
            let overlay = document.getElementById('ntf-overlay');
            if (!overlay) {
                overlay = document.createElement('div'); overlay.id = 'ntf-overlay';
                overlay.innerHTML = `<div id="ntf-modal"><div class="ntf-m-icon"></div><div class="ntf-m-title"></div><div class="ntf-m-msg"></div><div class="ntf-m-btns"><button class="ntf-btn-cancel" id="ntf-cancel"></button><button class="ntf-btn-confirm" id="ntf-confirm"></button></div></div>`;
                document.body.appendChild(overlay);
            }
            overlay.querySelector('.ntf-m-icon').textContent = danger ? '⚠️' : '❓';
            overlay.querySelector('.ntf-m-title').textContent = title || 'Confirm';
            overlay.querySelector('.ntf-m-msg').textContent = message || '';
            overlay.querySelector('#ntf-cancel').textContent = cancelText;
            overlay.querySelector('#ntf-confirm').textContent = confirmText;
            overlay.querySelector('#ntf-confirm').className = 'ntf-btn-confirm' + (danger ? ' danger' : '');

            function done(res) { overlay.classList.remove('ntf-show'); setTimeout(() => { overlay.style.display = 'none'; resolve(res); }, 300); }
            overlay.querySelector('#ntf-cancel').onclick = () => done(false);
            overlay.querySelector('#ntf-confirm').onclick = () => done(true);
            overlay.style.display = 'flex';
            requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('ntf-show')));
        });
    }

    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .btn');
        if (target && window.feedback && typeof window.feedback.click === 'function') window.feedback.click();
    }, true);

    console.log("✅ Notification System Ready");
})();
