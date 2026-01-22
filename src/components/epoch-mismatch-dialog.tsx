"use client";

import { useAuth } from "@/context/authContext";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * EpochMismatchDialog
 *
 * Shown when a user logs in and server data has been reset (epoch mismatch detected).
 * Gives the user a choice to:
 * 1. Clear local data and continue (recommended)
 * 2. Cancel login
 */
export function EpochMismatchDialog() {
  const { epochMismatchPending, confirmEpochReset, cancelEpochReset } =
    useAuth();
  const t = useTranslations("sync");

  if (!epochMismatchPending) return null;

  const { pendingChangesCount } = epochMismatchPending;

  return (
    <AlertDialog open={!!epochMismatchPending}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="text-yellow-500">⚠️</span>
            {t("epochMismatch.title") || "Data Sync Conflict"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              {t("epochMismatch.description") ||
                "Server data has been reset since your last login. Your local cached data is outdated."}
            </p>

            {pendingChangesCount > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  <strong>
                    {t("epochMismatch.pendingWarning") || "Warning:"}
                  </strong>{" "}
                  {t("epochMismatch.pendingChanges", {
                    count: pendingChangesCount,
                  }) ||
                    `You have ${pendingChangesCount} unsaved local change(s) that will be lost.`}
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {t("epochMismatch.recommendation") ||
                "We recommend clearing your local cache to sync with the latest server data."}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelEpochReset}>
            {t("epochMismatch.cancel") || "Cancel Login"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmEpochReset}
            className="bg-destructive hover:bg-destructive/90"
          >
            {t("epochMismatch.confirm") || "Clear Local Data & Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
