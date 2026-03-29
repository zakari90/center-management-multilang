"use client";

import { useIsOnline } from "@/hooks/useOnlineStatus";
import { useTranslations } from "next-intl";
import { Cloud, CloudOff, Database, Globe, RefreshCcw } from "lucide-react";
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
        // We match exactly the current pathname
        // Note: next-intl pathnames might include the locale, 
        // which matches how we store them in PagePrecacheHandler
        const match = await cache.match(pathname);
        setIsCached(!!match);
      } catch (error) {
        console.error("Error checking cache:", error);
        setIsCached(false);
      }
    }

    checkCache();
    
    // Also listen for cache changes if possible, or just re-check on pathname change
  }, [pathname]);

  if (isCached === null) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-default select-none">
            {isSyncing ? (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1 animate-pulse">
                <RefreshCcw className="h-3 w-3 animate-spin" />
                <span className="hidden xs:inline text-[10px] font-medium uppercase tracking-wider">
                  {t("syncing")}
                </span>
              </Badge>
            ) : !isOnline ? (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1">
                <CloudOff className="h-3 w-3" />
                <span className="hidden xs:inline text-[10px] font-medium uppercase tracking-wider">
                  {t("offline")}
                </span>
              </Badge>
            ) : isCached ? (
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 gap-1">
                <Database className="h-3 w-3" />
                <span className="hidden xs:inline text-[10px] font-medium uppercase tracking-wider">
                  {t("offlineReady")}
                </span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1 opacity-60">
                <Globe className="h-3 w-3" />
                <span className="hidden xs:inline text-[10px] font-medium uppercase tracking-wider">
                  {t("live")}
                </span>
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="text-xs">
          <p>
            {isSyncing 
              ? t("syncing") 
              : !isOnline 
                ? t("offline") 
                : isCached 
                  ? t("offlineReady") 
                  : t("notCached")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
