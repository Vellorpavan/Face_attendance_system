/**
 * notification_service.js
 * Centered service to handle sending notifications (DB entry + Push)
 */

window.NotificationService = {
    /**
     * Send a notification to a specific user or role
     * @param {Object} options
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification body content
     * @param {string} [options.target_user_id] - Specific user ID to notify
     * @param {string} [options.target_role] - Role to notify (e.g., 'verifier', 'admin')
     * @param {string} [options.type] - Notification type ('alert', 'info', 'success', 'attendance')
     * @param {string} [options.action_url] - URL to open when clicked
     */
    async send({ title, message, target_user_id, target_role, type = 'info', action_url = '/' }) {
        console.log(`[NotificationService] Sending: ${title} to ${target_user_id || target_role}`);

        try {
            // 1. Insert into database notifications table
            const { data: notif, error: dbError } = await sb.from('notifications').insert({
                title,
                message,
                type,
                target_user_id,
                target_role,
                action_url,
                is_read: false
            }).select().single();

            if (dbError) throw dbError;

            // 2. Trigger background push via Edge Function
            const { data, error: pushError } = await sb.functions.invoke('send-push', {
                body: { record: notif }
            });

            if (pushError) {
                console.warn('[NotificationService] Push delivery skipped or failed:', pushError);
            }

            return { success: true, notification: notif };
        } catch (error) {
            console.error('[NotificationService] Error:', error);
            return { success: false, error };
        }
    },

    /**
     * Mark all notifications as read for current user
     */
    async markAllAsRead() {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const { error } = await sb.from('notifications')
            .update({ is_read: true })
            .eq('target_user_id', user.id);

        if (error) console.error('Error marking as read:', error);
        if (window.PushManager) window.PushManager.updateBadgeCount();
    }
};
