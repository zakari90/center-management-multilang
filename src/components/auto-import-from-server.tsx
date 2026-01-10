"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/authContext";
import { importAllFromServerForRole } from "@/lib/dexie/serverActions";
import { isOnline, waitForOnline } from "@/lib/utils/network";

const LAST_IMPORT_KEY = "last-server-import";
const DEFAULT_COOLDOWN_MS = 2 * 60 * 1000;

export default function AutoImportFromServer({
  cooldownMs = DEFAULT_COOLDOWN_MS,
}: {
  cooldownMs?: number;
}) {
  const { user } = useAuth();
  const isImportingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const shouldRun = () => {
    if (!user) return false;
    if (!isOnline()) return false;
    if (isImportingRef.current) return false;

    try {
      const last = Number(localStorage.getItem(LAST_IMPORT_KEY) || "0");
      if (Number.isFinite(last) && Date.now() - last < cooldownMs) return false;
    } catch {
      // ignore
    }

    return true;
  };

  const runImport = async () => {
    if (!user) return;
    if (!shouldRun()) return;

    isImportingRef.current = true;
    try {
      await waitForOnline();
      if (!isOnline()) return;
      const isAdmin = user.role === "ADMIN";
      await importAllFromServerForRole(isAdmin);
      try {
        localStorage.setItem(LAST_IMPORT_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    } catch {
      // ignore
    } finally {
      isImportingRef.current = false;
    }
  };

  const scheduleImport = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      runImport();
    }, 1500);
  };

  useEffect(() => {
    if (!user) return;

    // Run once on mount if online
    scheduleImport();

    // Run when coming back online
    const handleOnline = () => {
      scheduleImport();
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [user]);

  return null;
}
