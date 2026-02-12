/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAUpdateHandler() {
  const t = useTranslations("PWAUpdate");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const isInApp = (window.navigator as any).standalone || isStandalone;
    setIsInstalled(isInApp);

    // Check for early-captured beforeinstallprompt event (fires before React hydrates)
    const earlyPrompt = (window as any)
      .__deferredPrompt as BeforeInstallPromptEvent | null;
    if (earlyPrompt && !isInApp) {
      setDeferredPrompt(earlyPrompt);
      (window as any).__deferredPrompt = null; // consume it
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).__deferredPrompt = null; // clear early capture
    };

    // Listen for app installed event
    // Delay the toast so it appears AFTER the mobile install animation finishes
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      // setTimeout(() => {
      //   toast.success(t("appInstalled"));
      // }, 6000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check for service worker updates
    if ("serviceWorker" in navigator) {
      let hasShownNotification = false;

      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          // Check if there's already a waiting worker
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdate(true);
            if (!hasShownNotification) {
              toast.info(t("updateAvailable"));
              hasShownNotification = true;
            }
          }

          // Listen for new service worker installing
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  setWaitingWorker(newWorker);
                  setShowUpdate(true);
                  // Only show toast if we haven't shown it yet
                  if (!hasShownNotification) {
                    toast.info(t("updateAvailable"));
                    hasShownNotification = true;
                  }
                }
              });
            }
          });
        }
      });

      // Listen for controller change (when new SW takes over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [t]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsUpdating(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setDeferredPrompt(null);
        // Don't show toast here — the appinstalled event handler will show it
        // after the installation animation completes on the device
      }
    } catch {
      toast.error(t("installError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdate = async () => {
    if (!waitingWorker) {
      toast.error(t("updateError"));
      return;
    }

    setIsUpdating(true);
    try {
      // Send skip waiting message to the waiting service worker
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setShowUpdate(false);
      toast.success(t("updating"));
      // The page will reload automatically when controllerchange fires
    } catch (error) {
      console.error("Update error:", error);
      toast.error(t("updateError"));
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  // Don't show if already installed and no update available
  if (isInstalled && !showUpdate && !deferredPrompt) return null;

  return (
    <>
      {/* Install Prompt */}
      {deferredPrompt && !isInstalled && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-background/95 backdrop-blur border rounded-full shadow-lg px-1.5 py-1">
          <Button
            onClick={handleInstall}
            disabled={isUpdating}
            size="sm"
            className="rounded-full h-8 px-3 text-xs"
          >
            {isUpdating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Download className="h-3.5 w-3.5 mr-1.5" />
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeferredPrompt(null)}
            className="h-7 w-7 rounded-full"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Update Available */}
      {showUpdate && (
        <Card className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <RefreshCw className="h-5 w-5" />
              {t("updateTitle")}
            </CardTitle>
            <CardDescription className="text-orange-600 dark:text-orange-400">
              {t("updateDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t("updating")}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("update")}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDismiss}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
