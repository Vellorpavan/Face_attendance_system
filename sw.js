/**
 * sw.js - Service Worker for SVPP ATTENDANCE (FACE RECOGNITION)
 * Handles background push notifications and notification clicks.
 */

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'New Notification', message: event.data.text() };
        }
    }

    const title = data.title || 'SVPP Alert';
    const options = {
        body: data.message || data.body || 'You have a new message.',
        icon: '/logo.png', // Assuming logo.png exists based on list_dir
        badge: '/logo.png',
        data: {
            url: data.action_url || data.url || '/'
        },
        vibrate: [100, 50, 100],
        actions: [
            { action: 'open', title: 'Open App' }
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    let urlToOpen = event.notification.data.url || '/';
    const type = (event.notification.data.type || '').toLowerCase();

    // Map specific types to pages if url is generic
    if (urlToOpen === '/') {
        if (type.includes('attendance')) urlToOpen = '/student_dashboard.html';
        else if (type.includes('leave')) urlToOpen = '/leave_status.html';
        else if (type.slice(0, 4) === 'verif') urlToOpen = '/verifier_dashboard.html';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            // Check if there's already a window/tab open with the same URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // Use includes to handle localhost/domain variations
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
