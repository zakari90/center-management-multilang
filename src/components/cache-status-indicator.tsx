"use client";

import { useIsOnline } from "@/hooks/useOnlineStatus";
import { useTranslations, useLocale } from "next-intl";
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

// Same list used by page-precache-handler
const BASE_PAGES = [
  "/",
  "/login",
  "/loginmanager",
  "/register",
  "/admin",
  "/admin/center",
  "/admin/receipts",
  "/admin/schedule",
  "/admin/users",
  "/admin/test",
  "/manager",
  "/manager/receipts",
  "/manager/schedule",
  "/manager/students",
  "/manager/teachers",
];

interface CacheStatusIndicatorProps {
  isSyncing?: boolean;
}

export function CacheStatusIndicator({ isSyncing }: CacheStatusIndicatorProps) {
  const isOnline = useIsOnline();
  const t = useTranslations("CacheStatusIndicator");
  const pathname = usePathname();
  const locale = useLocale();
  const [isCurrentPageCached, setIsCurrentPageCached] = useState<boolean | null>(null);
  const [allPagesCached, setAllPagesCached] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkCache() {
      if (typeof window === "undefined" || !("caches" in window)) {
        setIsCurrentPageCached(false);
        setAllPagesCached(false);
        return;
      }

      try {
        const cache = await caches.open(PAGES_CACHE_NAME);

        // Check current page
        const currentMatch = await cache.match(pathname);
        setIsCurrentPageCached(!!currentMatch);

        // Check all pages for current locale
        const localizedPages = BASE_PAGES.map((p) => `/${locale}${p === "/" ? "" : p}`);
        const results = await Promise.all(
          localizedPages.map((page) => cache.match(page).then((m) => !!m))
        );
        setAllPagesCached(results.every(Boolean));
      } catch (error) {
        console.error("Error checking cache:", error);
        setIsCurrentPageCached(false);
        setAllPagesCached(false);
      }
    }

    checkCache();
  }, [pathname, locale]);

  if (isCurrentPageCached === null || allPagesCached === null) return null;

  // Only hide when ALL pages are cached, online, and not syncing
  if (isOnline && !isSyncing && allPagesCached) return null;

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
                <CloudOff className="hidden md:block h-3 w-3" />
                <span className="hidden xs:inline text-[10px] font-medium uppercase tracking-wider">
                  {t("offline")}
                </span>
              </Badge>
            ) : isSyncing ? (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1 animate-pulse"
              >
                <RefreshCcw className="hidden md:block h-3 w-3 animate-spin" />
                <span className="hidden xs:inline text-[10px] font-medium uppercase tracking-wider">
                  {t("syncing")}
                </span>
              </Badge>
            ) : isCurrentPageCached ? (
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 gap-1"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Database className="hidden md:block h-3 w-3" />
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
                <ShieldAlert className="hidden md:block h-3 w-3" />
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
                : isCurrentPageCached
                  ? t("offlineReady")
                  : t("notCachedTooltip")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

