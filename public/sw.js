// CMT Admin — Service Worker
// Handles background push notifications only. Does not cache routes.

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() ?? {}; } catch { data = { title: "CMT Admin", body: event.data?.text() ?? "" }; }

  const title   = data.title ?? "CMT Admin";
  const options = {
    body:  data.body  ?? "",
    icon:  "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag:   data.tag   ?? "cmt-admin",
    data:  { url: data.url ?? "/admin/dashboard" },
    requireInteraction: data.requireInteraction ?? false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/admin/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
