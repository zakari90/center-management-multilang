import { useEffect, useRef } from "react";

const AUTOSAVE_KEY = "autosave_last_run";

/**
 * Hook to handle automatic database backups on the 1st of each month at 12:00.
 * If the app is opened after the scheduled time and no backup was made for that period,
 * it triggers a "catch-up" backup.
 */
export function useAutoBackup(onBackup: () => Promise<void>) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onBackupRef = useRef(onBackup);

  // Keep callback ref up to date
  useEffect(() => {
    onBackupRef.current = onBackup;
  }, [onBackup]);

  useEffect(() => {
    const getNextBackupTime = () => {
      const now = new Date();
      // Target: 1st of the current month at 12:00
      const next = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0, 0);
      
      // If we are already past the 1st at 12:00 this month, the next one is next month
      if (now >= next) {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    };

    const checkAndSchedule = async () => {
      const lastRunStr = localStorage.getItem(AUTOSAVE_KEY);
      const lastRun = lastRunStr ? Number(lastRunStr) : 0;
      const now = Date.now();
      
      // Target for the current month
      const today = new Date();
      const thisMonthTarget = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0).getTime();

      // Catch-up logic:
      // If we are currently past the target time for this month, 
      // AND the last successful backup was before this month's target,
      // then we need to run it now.
      if (now >= thisMonthTarget && lastRun < thisMonthTarget) {
        console.log("[AutoBackup] Triggering monthly auto-save catch-up...");
        try {
          await onBackupRef.current();
          localStorage.setItem(AUTOSAVE_KEY, String(Date.now()));
          console.log("[AutoBackup] Monthly auto-save completed.");
        } catch (error) {
          console.error("[AutoBackup] Failed to perform auto-save:", error);
        }
      }

      const nextBackup = getNextBackupTime();
      const delay = nextBackup.getTime() - Date.now();

      // Safety check for maximum setTimeout delay (approx 24.8 days)
      // If delay is too long, we check again in 24 hours
      const MAX_DELAY = 2147483647; 
      const actualDelay = Math.min(delay, 24 * 60 * 60 * 1000);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(checkAndSchedule, actualDelay);
    };

    checkAndSchedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
