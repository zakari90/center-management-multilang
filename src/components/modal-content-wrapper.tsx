"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ModalContentWrapperProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function ModalContentWrapper({
  children,
  onClose,
  className,
}: ModalContentWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(true);
  const [isOfflineBlocked, setIsOfflineBlocked] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    // Open modal when route changes to a modal route
    const isModalRoute = searchParams.get("modal") === "true";
    setIsOpen(isModalRoute);
  }, [pathname, searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!pathname) return;
        const isModalRoute = searchParams.get("modal") === "true";
        if (!isModalRoute) {
          if (!cancelled) setIsOfflineBlocked(false);
          return;
        }

        // Only block dynamic detail pages (contains an id segment after manager)
        const parts = pathname.split("/").filter(Boolean);
        const managerIndex = parts.indexOf("manager");
        const looksDynamic =
          managerIndex >= 0 && parts.length > managerIndex + 2;
        if (!looksDynamic) {
          if (!cancelled) setIsOfflineBlocked(false);
          return;
        }

        if (navigator.onLine) {
          if (!cancelled) setIsOfflineBlocked(false);
          return;
        }

        if (!("caches" in window)) {
          if (!cancelled) setIsOfflineBlocked(true);
          return;
        }

        const cache = await caches.open("pages-v1");
        const cached = await cache.match(pathname);
        if (!cancelled) setIsOfflineBlocked(!cached);
      } catch {
        if (!cancelled) setIsOfflineBlocked(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const isModalRoute = searchParams.get("modal") === "true";
      setIsOpen(isModalRoute);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }

    // Remove modal query param and navigate back to list
    const pathParts = pathname.split("/");
    const locale = pathParts[1];

    // Generic approach: Extract the resource type from path
    // Path format: /[locale]/manager/[resource]/[id]/...
    // We want to go back to: /[locale]/manager/[resource]
    let listPath = "";

    // Check for manager routes
    if (pathname.includes("/manager/")) {
      const managerIndex = pathParts.indexOf("manager");
      if (managerIndex >= 0 && pathParts.length > managerIndex + 1) {
        const resource = pathParts[managerIndex + 1];
        listPath = `/${locale}/pro/manager/${resource}`;
      }
    }

    // Fallback: use browser back if we can't determine the list path
    if (!listPath) {
      router.back();
      return;
    }

    // Use replace to avoid adding to history stack
    router.replace(listPath);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={className || "max-w-4xl max-h-[90vh] overflow-y-auto"}
        showCloseButton={true}
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
        onInteractOutside={handleClose}
      >
        {isOfflineBlocked ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-lg font-semibold">{t("offlineTitle")}</div>
              <div className="text-sm text-muted-foreground">
                {t("offlineMessageShort")}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t("offlineActionRetry")}
              </Button>
              <Button onClick={handleClose}>{t("backToHome")}</Button>
            </div>
          </div>
        ) : (
          children
        )}
      </DialogContent>
    </Dialog>
  );
}
