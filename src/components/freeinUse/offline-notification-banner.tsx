"use client";

import { useIsOnline } from "@/hooks/useOnlineStatus";
import { useTranslations } from "next-intl";
import { WifiOff, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * Compact dropdown-style offline notification
 * Appears in the top-right corner with expandable details
 */
export default function OfflineNotificationBanner() {
  const isOnline = useIsOnline();
  const t = useTranslations("OfflineBanner");
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset dismissed state when coming back online then going offline again
  useEffect(() => {
    if (isOnline) {
      setIsDismissed(false);
      setIsExpanded(false);
    }
  }, [isOnline]);

  // Auto-show again after 30 seconds if still offline
  useEffect(() => {
    if (isDismissed && !isOnline) {
      const timer = setTimeout(() => {
        setIsDismissed(false);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [isDismissed, isOnline]);

  // Don't render anything if online or dismissed
  if (isOnline || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/25 dark:shadow-orange-700/30 backdrop-blur-sm border border-orange-400/20 overflow-hidden min-w-[280px] max-w-[320px]">
        {/* Header - Always visible */}
        <div className="flex items-center gap-3 p-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm">
            <WifiOff className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {t("title") || "You're offline"}
            </p>
            {!isExpanded && (
              <p className="text-xs text-white/80 truncate">
                {t("shortMessage") || "Working in offline mode"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-3 pb-3 animate-in slide-in-from-top-1 duration-200">
            <div className="bg-white/10 rounded-lg p-3 text-xs text-white/90 leading-relaxed">
              {t("message") || "Your data is saved locally and you can keep working. Changes will sync when you're back online. Do not clear your browser cache."}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-300 animate-pulse" />
                {t("waitingForConnection") || "Waiting for connection..."}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
