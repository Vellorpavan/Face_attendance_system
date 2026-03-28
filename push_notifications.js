/**
 * push_notifications.js
 * Implementation of Web Push subscription and Foreground notifications.
 */

const VAPID_PUBLIC_KEY = 'BCdTakZqcX9PWOhgjCST_3sRYw_J7NFCYrPAELF-tDWsdXe1K0pyOO1nkJXeeU5C5sY7RArwChcowpQhrFGJ2ww';

const PushManager = {
    isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
    swRegistration: null,
    isSubscribed: false,

    async init() {
        if (!this.isSupported) {
            console.warn('Push messaging is not supported');
            return;
        }

        try {
            this.swRegistration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered');

            // Check current subscription
            const subscription = await this.swRegistration.pushManager.getSubscription();
            this.isSubscribed = !(subscription === null);

            // Set up Realtime listener with filtering for user_id
            this.setupRealtimeListener();

            // Permission logic: Avoid loop
            const permission = Notification.permission;
            const promptClosed = localStorage.getItem('notif_prompt_closed') === 'true';

            if (permission === 'default' && !promptClosed) {
                this.promptPermission();
            } else if (permission === 'granted' && !this.isSubscribed) {
                this.subscribeUser();
            }

            // Sync unread count immediately
            this.updateBellBadge();
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    },

    promptPermission() {
        // Use the premium confirm modal if available
        if (window.showConfirm) {
            window.showConfirm("Would you like to receive push notifications for attendance and alerts?", {
                title: "Enable Notifications",
                confirmText: "Allow",
                cancelText: "Later"
            }).then(granted => {
                if (granted) {
                    this.requestNativePermission();
                } else {
                    // Mark as closed so it doesn't repeat on refresh
                    localStorage.setItem('notif_prompt_closed', 'true');
                }
            });
        } else {
            this.requestNativePermission();
        }
    },

    async requestNativePermission() {
        const permission = await Notification.requestPermission();
        localStorage.setItem('notif_prompt_closed', 'true');
        if (permission === 'granted') {
            await this.subscribeUser();
        }
    },

    async subscribeUser() {
        try {
            const applicationServerKey = this.urlB64ToUint8Array(VAPID_PUBLIC_KEY);
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });

            console.log('User is subscribed:', subscription);
            await this.saveSubscriptionToDb(subscription);
            this.isSubscribed = true;
        } catch (err) {
            console.error('Failed to subscribe the user: ', err);
        }
    },

    async saveSubscriptionToDb(subscription) {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        try {
            const userRole = localStorage.getItem('user_role') || 'student';
            const email = user.email || '';

            // Map standard subscription to 'device_token' logic if requested, but keep 'subscription' for compat
            await sb.from('notification_devices').upsert({
                user_id: user.id,
                subscription: JSON.parse(JSON.stringify(subscription)), // Keep subscription for Edge Function compatibility
                user_role: userRole,
                email: email,
                updated_at: new Date()
            }, { onConflict: 'user_id' });

            console.log('✅ Subscription saved to DB');
        } catch (error) {
            console.error('❌ Error saving subscription:', error);
        }
    },

    async setupRealtimeListener() {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        // Subscribe to Supabase realtime channel for INSERT events on notifications table
        // Filter notifications using target_user_id (current logged user)
        const channel = sb.channel('notifications-foreground')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `target_user_id=eq.${user.id}`
            }, (payload) => {
                this.handleIncomingNotification(payload.new);
            })
            .subscribe();

        console.log('📡 Subscribed to notification realtime channel');
    },

    async handleIncomingNotification(notif) {
        // Instant updates even if browsing another page
        if (window.showInfo) {
            const safeTitle = notif.title || 'Notification';
            const safeMsg = notif.message || '';
            window.showInfo(`<strong>${safeTitle}</strong><br>${safeMsg}`, 7000);
        }

        // Also update the bell badge
        this.updateBellBadge();

        // Browser notification if window is hidden (fallback to SW logic usually handles this, 
        // but for foreground it's nice)
        if (document.visibilityState === 'hidden') {
            this.showLocalNotification(notif);
        }

        // Vibrate if supported
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    },

    showLocalNotification(notif) {
        if (Notification.permission === 'granted') {
            const options = {
                body: notif.message,
                icon: 'https://svpcet.app/icon.png', // Placeholder
                timestamp: new Date().getTime(),
                data: {
                    url: notif.action_url || '/'
                }
            };
            new Notification(notif.title, options);
        }
    },

    async updateBellBadge() {
        const badge = document.getElementById('notif-badge');
        if (!badge) return;

        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const myRole = localStorage.getItem('user_role');

        const { count, error } = await sb.from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false)
            .or(`target_user_id.eq.${user.id},target_role.eq.${myRole},target_role.eq.all`);

        if (!error) {
            badge.textContent = count > 0 ? (count > 9 ? '9+' : count) : '';
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
};

// Auto-init on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PushManager.init());
} else {
    PushManager.init();
}
