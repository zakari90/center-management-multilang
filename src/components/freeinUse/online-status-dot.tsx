"use client";

import { useIsOnline } from "@/hooks/useOnlineStatus";
import { cn } from "@/freelib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function OnlineStatusDot({ className }: { className?: string }) {
  const isOnline = useIsOnline();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center justify-center p-1">
          <div
            className={cn(
              "h-2.5 w-2.5 rounded-full border border-background shadow-sm",
              isOnline ? "bg-emerald-500" : "bg-amber-500",
              className
            )}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center" className="text-[10px]">
        <p>{isOnline ? "Online" : "Offline"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
