// RoomMatch Service Worker
// Handles web push notifications.
//
// Registration happens in src/hooks/useAuth.tsx after first login.
// Push payloads are sent by the notify-match Supabase Edge Function.

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "RoomMatch";
  const options = {
    body: data.body ?? "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: data.url ?? "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    }),
  );
});
