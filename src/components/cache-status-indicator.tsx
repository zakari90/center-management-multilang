"use client";

import { useIsOnline } from "@/hooks/useOnlineStatus";
import { useTranslations } from "next-intl";
import { CloudOff, Database, RefreshCcw, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PAGES_CACHE_NAME } from "@/lib/pwa-constants";

interface CacheStatusIndicatorProps {
  isSyncing?: boolean;
}

export function CacheStatusIndicator({ isSyncing }: CacheStatusIndicatorProps) {
  const isOnline = useIsOnline();
  const t = useTranslations("CacheStatusIndicator");
  const pathname = usePathname();
  const [isCached, setIsCached] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkCache() {
      if (typeof window === "undefined" || !("caches" in window)) {
        setIsCached(false);
        return;
      }

      try {
        const cache = await caches.open(PAGES_CACHE_NAME);
        const match = await cache.match(pathname);
        setIsCached(!!match);
      } catch (error) {
        console.error("Error checking cache:", error);
        setIsCached(false);
      }
    }

    checkCache();
  }, [pathname]);

  if (isCached === null) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-default select-none">
            {!isOnline ? (
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 border-orange-200 gap-1"
              >
                <CloudOff className="h-3 w-3" />
                <span className="hidden xs:inline text-[10px] font-medium uppercase tracking-wider">
                  {t("offline")}
                </span>
              </Badge>
            ) : isSyncing ? (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1 animate-pulse"
              >
                <RefreshCcw className="h-3 w-3 animate-spin" />
                <span className="hidden xs:inline text-[10px] font-medium uppercase tracking-wider">
                  {t("syncing")}
                </span>
              </Badge>
            ) : isCached ? (
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 gap-1"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Database className="h-3 w-3" />
                <span className="hidden xs:inline text-[10px] font-medium uppercase tracking-wider">
                  {t("offlineReady")}
                </span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-300 gap-1"
              >
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <ShieldAlert className="h-3 w-3" />
                <span className="hidden xs:inline text-[10px] font-medium uppercase tracking-wider">
                  {t("notCached")}
                </span>
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          className="text-xs max-w-[200px]"
        >
          <p>
            {!isOnline
              ? t("offline")
              : isSyncing
                ? t("syncing")
                : isCached
                  ? t("offlineReady")
                  : t("notCachedTooltip")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
