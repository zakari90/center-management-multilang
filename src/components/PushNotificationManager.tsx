"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

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

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      // We use the shim sw.js which imports custom-sw.js
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }

  async function subscribeToPush() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      setSubscription(sub);

      // Send subscription to backend
      await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: sub.toJSON().keys,
          // In a real app, you'd send userId and role here contextually
          // For now we might just want to subscribe the device
        }),
      });

      toast.success("Subscribed!", {
        description: "You will now receive push notifications.",
      });
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("Subscription failed", {
        description: "Could not subscribe to push notifications.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setLoading(true);
    try {
      await subscription?.unsubscribe();
      setSubscription(null);

      // In a real app, you should also call an API to remove it from DB
      // await fetch('/api/unsubscribe', { ... })

      toast.success("Unsubscribed", {
        description: "You will no longer receive notifications.",
      });
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      toast.error("Unsubscribe failed", {
        description: "Could not unsubscribe.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function sendTestNotification() {
    if (!subscription || !message) return;

    setLoading(true);
    try {
      const res = await fetch("/api/send-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Notification",
          body: message,
          // userId/role would be inferred from session in a real scenario
        }),
      });

      if (!res.ok) throw new Error("Failed to send");

      toast.success("Sent!", {
        description: "Test notification sent successfully.",
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending push:", error);
      toast.error("Error", {
        description: "Failed to send test notification.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Push notifications are not supported in this browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Manage your device's push notification settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">Active</span>
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter test message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button
                onClick={sendTestNotification}
                disabled={loading || !message}
              >
                {loading ? "Sending..." : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-md">
            <BellOff className="h-4 w-4" />
            <span className="text-sm font-medium">Not Subscribed</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {subscription ? (
          <Button
            variant="destructive"
            className="w-full"
            onClick={unsubscribeFromPush}
            disabled={loading}
          >
            {loading ? "Processing..." : "Unsubscribe"}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={subscribeToPush}
            disabled={loading}
          >
            {loading ? "Processing..." : "Subscribe"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
