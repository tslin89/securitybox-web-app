self.addEventListener('push', (event) => {
    console.log('[SW] push received', event);
    event.waitUntil((async () => {
        let title = 'SecurityBox Alert';
        let body = 'New alert';
        let url = '/dashboard';

        try {
            if (event.data) {
                try {
                    const data = event.data.json();
                    title = data.title || title;
                    body = data.body || body;
                    url = data.url || url;
                } catch {
                    body = await event.data.text(); // <-- handle text payloads
                }
            }
        } catch { }

        return self.registration.showNotification(title, {
            body, data: { url }, tag: 'securitybox-alert', renotify: true
        });
    })());
});

self.addEventListener('install', () => { console.log('[SW] install'); self.skipWaiting(); });
self.addEventListener('activate', () => { console.log('[SW] activate'); self.clients.claim(); });

self.addEventListener("notificationclick", (event) => {
    console.log('Notification clicked')
    event.notification.close();
    const url = event.notification.data?.url || "/dashboard";
    event.waitUntil((async () => {
        const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of all) {
            if ("focus" in client) { client.navigate(url); return client.focus(); }
        }
        return clients.openWindow(url);
    })());
});