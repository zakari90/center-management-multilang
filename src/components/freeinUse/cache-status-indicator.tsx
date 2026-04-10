"use client";

import { useIsOnline } from "@/hooks/useOnlineStatus";
import { useTranslations } from "next-intl";
import { CloudOff, Database, RefreshCcw, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCacheStatusStore,
  type CacheStatusState,
} from "@/stores/useCacheStatusStore";
import { cn } from "@/freelib/utils";

/**
 * A small dot indicator for individual navigation items.
 * Shows green if cached, amber if not.
 * Hides if everything is cached (global allCached state).
 */
export function CacheStatusDot({ href }: { href: string }) {
  const isOnline = useIsOnline();
  const allCached = useCacheStatusStore(
    (state: CacheStatusState) => state.allCached,
  );
  const isCached = useCacheStatusStore(
    (state: CacheStatusState) => state.pageStatuses[href],
  );
  const isInitialCheckDone = useCacheStatusStore(
    (state: CacheStatusState) => state.isInitialCheckDone,
  );

  // Don't show dots if online and everything is cached
  if (isOnline && allCached) return null;

  // Wait for initial check to avoid flickering
  if (!isInitialCheckDone) return null;

  return (
    <div
      className={cn(
        "h-2 w-2 rounded-full border border-background shadow-sm",
        isCached ? "bg-emerald-500" : "bg-amber-500 animate-pulse",
      )}
    />
  );
}

/**
 * Global status indicator (badge).
 * Shows offline or syncing status.
 * Now respects the centralized store's allCached state for hiding.
 */
interface CacheStatusIndicatorProps {
  isSyncing?: boolean;
}

export function CacheStatusIndicator({ isSyncing }: CacheStatusIndicatorProps) {
  const isOnline = useIsOnline();
  const allCached = useCacheStatusStore(
    (state: CacheStatusState) => state.allCached,
  );
  const t = useTranslations("CacheStatusIndicator");

  // Only hide when ALL pages are cached, online, and not syncing
  if (isOnline && !isSyncing && allCached) return null;

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
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          className="text-xs max-w-[200px]"
        >
          <p>{!isOnline ? t("offline") : t("syncing")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
