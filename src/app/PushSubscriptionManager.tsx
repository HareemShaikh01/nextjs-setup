"use client";

import { useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export default function PushSubscriptionManager() {
  const [status, setStatus] = useState("");

  const subscribeUser = async () => {
    setStatus("Requesting notification permission...");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("Notification permission denied");
      return;
    }

    setStatus("Subscribing...");

    try {
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      console.log("Push subscription:", subscription);

      // Send subscription to your FastAPI backend
      const response = await fetch(" https://a2b6e87dc046.ngrok-free.app/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (response.ok) {
        setStatus("Subscribed and sent to server!");
      } else {
        const errorText = await response.text();
        console.error("Backend subscription error:", errorText);
        setStatus("Subscription sent, but server responded with error.");
      }
    } catch (err) {
      console.error("Subscription failed:", err);
      setStatus("Subscription failed");
    }
  };

  return (
    <div className="p-4">
      <p>{status}</p>
      <button onClick={subscribeUser}>
        Enable Notifications
      </button>
    </div>
  );
}
