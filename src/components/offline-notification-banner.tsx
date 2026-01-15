"use client";

import { useIsOnline } from "@/hooks/useOnlineStatus";
import { useTranslations } from "next-intl";
import { AlertCircle, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Persistent offline notification banner
 * Displays at the top of the page when user is offline
 */
export default function OfflineNotificationBanner() {
  const isOnline = useIsOnline();
  const t = useTranslations("OfflineBanner");

  // Don't render anything if online
  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      <Alert 
        variant="destructive" 
        className="rounded-none border-x-0 border-t-0 bg-orange-600 dark:bg-orange-700 text-white border-orange-700 dark:border-orange-800"
      >
        <div className="flex items-start gap-3 px-2 sm:px-4">
          <WifiOff className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <AlertDescription className="text-white font-medium text-sm sm:text-base">
              <span className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="font-semibold">
                  {t("title") || "You're offline"}
                </span>
              </span>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                {t("message") || "Data is saved locally, and you can keep working. Do not clear your browser cache."}
              </p>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}
