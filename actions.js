/**
 * ─────────────────────────────────────────────
 *  GLOBAL ACTION HANDLER — SVPP ATTENDANCE (FACE RECOGNITION)
 *  Handles all delete/unassign actions project-wide.
 * ─────────────────────────────────────────────
 */

(function () {
    console.log("🚀 Global Action Handler Loaded");

    // 1. GLOBAL CLICK LISTENER
    document.body.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        // Play click feedback
        if (window.feedback && typeof window.feedback.click === 'function') {
            window.feedback.click();
        }

        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const table = btn.dataset.table;
        const rowSelector = btn.dataset.row;

        if (!action || !id || !table) return;

        e.preventDefault();
        e.stopPropagation();

        console.log(`──────────────────────────────────`);
        console.log(`[ACTION] ${action.toUpperCase()} on ${table} (${id})`);

        handleGlobalAction(btn, action, id, table, rowSelector);
    });

    async function handleGlobalAction(btn, action, id, table, rowSelector) {
        console.log(`[ACTION] Starting ${action} on table: ${table}, ID: ${id}`);

        if (!id || id === 'undefined' || id === 'null') {
            const errorMsg = "Action failed: Record ID is missing or invalid.";
            console.error(`[ACTION] ❌ ${errorMsg}`, { id, table, action });
            if (window.showError) window.showError(errorMsg);
            return;
        }

        const confirmMsg = action === 'delete' ? `Are you sure you want to delete this ${table.slice(0, -1)}?` : `Unassign this ${table.slice(0, -1)}?`;

        // 8. CONFIRMATION
        const customConfirm = window.showConfirm;
        if (typeof customConfirm === 'function') {
            const ok = await customConfirm(confirmMsg, {
                title: action.charAt(0).toUpperCase() + action.slice(1),
                confirmText: action.charAt(0).toUpperCase() + action.slice(1),
                danger: action === 'delete'
            });
            if (!ok) return;
        } else {
            if (!confirm(confirmMsg)) return;
        }

        // 7. LOADING STATE
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<svg viewBox="0 0 24 24" style="animation:spin 0.8s linear infinite; width:14px; height:14px; stroke:currentColor; fill:none; stroke-width:3;"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>`;

        try {
            let response;
            if (action === 'delete') {
                if (table === 'users') {
                    // Soft-remove: Clear role instead of deleting row to preserve historical data & avoid FK errors
                    console.log(`[ACTION] Soft-deleting user ${id} (nulling role)`);
                    response = await sb.from(table).update({ role: null }).eq('id', id);
                } else {
                    console.log(`[ACTION] Hard-deleting from ${table} where id=${id}`);
                    response = await sb.from(table).delete().eq('id', id);
                }
            } else if (action === 'unassign') {
                let updateData = { teacher_id: null };
                if (btn.dataset.update) {
                    try { updateData = JSON.parse(btn.dataset.update); } catch (err) { }
                }
                console.log(`[ACTION] Unassigning from ${table} where id=${id}`, updateData);
                response = await sb.from(table).update(updateData).eq('id', id);
            }

            // 9. DEBUG LOGGING (RESPONSE)
            console.log(`[ACTION] Backend Response:`, response);

            if (response.error) {
                // 4. ERROR HANDLING (DETAILED)
                const err = response.error;
                const detailedError = err.message || "Unknown background error.";
                console.error(`[ACTION] ❌ Backend Error:`, err);
                throw new Error(detailedError);
            }

            // SUCCESS FLOW
            if (window.feedback && typeof window.feedback.success === 'function') window.feedback.success();
            if (window.showSuccess) window.showSuccess(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`);

            const element = rowSelector ? document.querySelector(rowSelector) : (btn.closest('.teacher-row') || btn.closest('.subject-row') || btn.closest('.row') || btn.closest('.user-card'));

            if (element) {
                if (action === 'delete') {
                    element.style.transform = 'scale(0.95)';
                    element.style.opacity = '0';
                    element.style.transition = 'all 0.3s ease';
                    setTimeout(() => {
                        element.remove();
                        document.dispatchEvent(new CustomEvent('actionSuccess', { detail: { action, id, table } }));
                    }, 300);
                } else {
                    const statusBadge = element.querySelector('.status-badge') || element.querySelector('.t-badge');
                    if (statusBadge) statusBadge.textContent = 'FREE';
                    btn.style.display = 'none';
                    document.dispatchEvent(new CustomEvent('actionSuccess', { detail: { action, id, table } }));
                }
            } else {
                document.dispatchEvent(new CustomEvent('actionSuccess', { detail: { action, id, table } }));
            }

        } catch (error) {
            // 4. ERROR HANDLING (UI)
            console.error("❌ Action Handled Error:", error);
            if (window.feedback && typeof window.feedback.error === 'function') window.feedback.error();

            btn.disabled = false;
            btn.innerHTML = originalHTML;

            if (window.showError) {
                window.showError(error.message || "Action failed. Please check console.");
            } else {
                alert("Error: " + error.message);
            }
        }
    }
})();

if (!document.getElementById('global-action-styles')) {
    const style = document.createElement('style');
    style.id = 'global-action-styles';
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } } [data-action]:disabled { opacity: 0.7; cursor: not-allowed; }`;
    document.head.appendChild(style);
}
