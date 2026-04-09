"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

export function InstallAppButton() {
  const t = useTranslations("InstallPWA");
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const checkInstallable = () => {
      // Check if the global prompt exists
      if ((window as any).__deferredPrompt) {
        setCanInstall(true);
      }
    };

    // Initial check
    checkInstallable();

    // Listen to the event just in case it fires after mount
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = (window as any).__deferredPrompt;
    if (!promptEvent) return;

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      (window as any).__deferredPrompt = null;
      setCanInstall(false);
    }
  };

  if (!canInstall) return null;

  return (
    <Button onClick={handleInstall} className="flex items-center gap-2">
      <Download className="w-4 h-4" />
      {t("install")}
    </Button>
  );
}
