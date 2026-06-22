self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/icon-192x192.png", // Este es el logo normal que sale al lado del texto
    badge: "/badge-white.png", // ¡ESTA ES LA MAGIA! La silueta blanca para Android
    vibrate: [200, 100, 200],
    data: { url: data.url || "/dashboard/agenda" },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard/agenda";
  event.waitUntil(clients.openWindow(url));
});