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
    const [subscriptions, setSubscriptions] = useState<any[]>([]);

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

            if (!subscription) {
                setStatus("Subscription failed: subscription is undefined");
                return;
            }

            console.log("Push subscription:", subscription);

            // Send subscription to your FastAPI backend
            const response = await fetch("https://f01b9b718abe.ngrok-free.app/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "1",
                },
                body: JSON.stringify(subscription),
            });

            if (response.ok) {
                const data = await response.json();
                setStatus(`Subscribed! Total subscriptions: ${data.subscriptions_count}`);
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

    const fetchSubscriptions = async () => {
        try {
            const res = await fetch("https://f01b9b718abe.ngrok-free.app/subscriptions", {
                headers: {
                    "ngrok-skip-browser-warning": "1",
                },
            });
            if (!res.ok) throw new Error("Failed to fetch subscriptions");
            const data = await res.json();
            setSubscriptions(data.subscriptions || []);
        } catch (err) {
            console.error(err);
            setStatus("Failed to fetch subscriptions");
        }
    };

    return (
        <div className="p-4 space-y-2">
            <p>{status}</p>
            <button onClick={subscribeUser} className="px-4 py-2 bg-blue-500 text-white rounded">
                Enable Notifications
            </button>
            <button onClick={fetchSubscriptions} className="px-4 py-2 bg-green-500 text-white rounded">
                List Subscriptions
            </button>
            {subscriptions.length > 0 && (
                <ul className="mt-2 list-disc pl-5">
                    {subscriptions.map((sub, idx) => (
                        <li key={idx}>{sub.endpoint}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
