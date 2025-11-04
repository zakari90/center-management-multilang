import React from "react";

interface Props {
  userId?: string;
  role?: string;
}

// Use process.env for env vars, fallback to empty string
const subscribe_url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/subscribe`;
const publicKey = process.env.NEXT_PUBLIC_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const SubscriptionButton: React.FC<Props> = ({ userId, role }) => {
  async function handleSubscribe() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        alert("المتصفح لا يدعم الإشعارات أو عامل الخدمة Service Workers");
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("تم رفض السماح بالإشعارات");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Prepare payload with extra fields for API
      const payload = {
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys,
        userId,
        role,
      };

      await fetch(subscribe_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      alert("تم الاشتراك بنجاح.");
    } catch (error) {
      console.log("Failed subscription: ", error);
      alert("فشل الاشتراك: " + error);
    }
  }

  return (
    <button onClick={handleSubscribe}>
      الاشتراك بالإشعارات
    </button>
  );
};

export default SubscriptionButton;
