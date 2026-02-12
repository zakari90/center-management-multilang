"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  User,
  DollarSign,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { isOnline } from "@/lib/utils/network";

interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  new_user: <User className="h-4 w-4 text-blue-500" />,
  payment: <DollarSign className="h-4 w-4 text-green-500" />,
  delete_request: <Trash2 className="h-4 w-4 text-orange-500" />,
  delete_approved: <Check className="h-4 w-4 text-green-500" />,
  delete_rejected: <X className="h-4 w-4 text-red-500" />,
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  return `${diffDay}d`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !isOnline()) return;

    try {
      const res = await fetch(
        `/api/admin/notifications?userId=${user.id}&limit=20`,
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [user?.id]);

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchNotifications]);

  // Refetch when dropdown opens
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] font-bold flex items-center justify-center rounded-full"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors",
                  !notif.isRead && "bg-primary/5",
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {typeIcons[notif.type] || (
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm",
                        !notif.isRead && "font-semibold",
                      )}
                    >
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notif.body}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
