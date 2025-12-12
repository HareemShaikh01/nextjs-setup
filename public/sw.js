// public/sw.js

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
});

// Listen for push events
self.addEventListener("push", (event) => {
  console.log("Push received:", event);

  let data = { title: "Default title", body: "Default body", url: "/" };

  // Parse JSON payload from server
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      console.error("Error parsing push data:", err);
    }
  }

  const options = {
    body: data.body,
    icon: "/icon.png",   // optional icon
    badge: "/badge.png", // optional badge
    data: { url: data.url } // used in click handler
  };

  // Show the notification
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data.url || "/";
  event.waitUntil(clients.openWindow(url));
});
