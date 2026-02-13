"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Loader2, UserPlus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/authContext";
import { isOnline } from "@/lib/utils/network";
import { userActions } from "@/lib/dexie/dexieActions";

interface Preferences {
  notifyNewUser: boolean;
  notifyPayments: boolean;
  notifyDeleteRequests: boolean;
}

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>({
    notifyNewUser: true,
    notifyPayments: true,
    notifyDeleteRequests: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Try local first
      const localUser = await userActions.getLocal(user.id);
      if (localUser) {
        setPrefs({
          notifyNewUser: localUser.notifyNewUser ?? true,
          notifyPayments: localUser.notifyPayments ?? true,
          notifyDeleteRequests: localUser.notifyDeleteRequests ?? true,
        });
      }

      // Then sync from server if online
      if (isOnline()) {
        const res = await fetch(
          `/api/admin/notification-preferences?userId=${user.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          setPrefs({
            notifyNewUser: data.data.notifyNewUser ?? true,
            notifyPayments: data.data.notifyPayments ?? true,
            notifyDeleteRequests: data.data.notifyDeleteRequests ?? true,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (key: keyof Preferences, value: boolean) => {
    if (!user?.id) return;
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setIsSaving(true);
    try {
      // Save to local Dexie
      await userActions.update(user.id, {
        [key]: value,
        updatedAt: Date.now(),
      });

      // Save to server if online
      if (isOnline()) {
        await fetch("/api/admin/notification-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, [key]: value }),
        });
      }
    } catch (err) {
      console.error("Failed to update preference:", err);
      // Revert on error
      setPrefs((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const preferences = [
    {
      key: "notifyNewUser" as const,
      label: "New Users",
      description: "When a manager creates a teacher or student",
      icon: <UserPlus className="h-4 w-4 text-blue-500" />,
    },
    {
      key: "notifyPayments" as const,
      label: "Payments",
      description: "When a payment is recorded",
      icon: "MAD",
    },
    {
      key: "notifyDeleteRequests" as const,
      label: "Delete Requests",
      description: "When a manager requests to delete a record",
      icon: <Trash2 className="h-4 w-4 text-orange-500" />,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Notification Preferences</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {preferences.map((pref) => (
          <div
            key={pref.key}
            className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/10"
          >
            <div className="flex items-center gap-3">
              <div className="shrink-0">{pref.icon}</div>
              <div>
                <Label
                  htmlFor={pref.key}
                  className="text-sm font-medium cursor-pointer"
                >
                  {pref.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {pref.description}
                </p>
              </div>
            </div>
            <Switch
              id={pref.key}
              checked={prefs[pref.key]}
              onCheckedChange={(checked) => updatePreference(pref.key, checked)}
              disabled={isSaving}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
