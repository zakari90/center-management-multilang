"use client";

import { useState } from "react";
import { useAuth } from "@/context/authContext";
import { useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  exportLocalDataAsJson,
  downloadExportAsFile,
} from "@/lib/dexie/clearLocalData";

/**
 * EpochMismatchDialog
 *
 * Shown when a user logs in and server data has been reset (epoch mismatch detected).
 * Gives the user a choice to:
 * 1. Export local data first (backup)
 * 2. Clear local data and continue (recommended)
 * 3. Cancel login
 */
export function EpochMismatchDialog() {
  const { epochMismatchPending, confirmEpochReset, cancelEpochReset } =
    useAuth();
  const t = useTranslations("sync");
  const [isExporting, setIsExporting] = useState(false);
  const [hasExported, setHasExported] = useState(false);

  if (!epochMismatchPending) return null;

  const { pendingChangesCount } = epochMismatchPending;

  const handleExportAndContinue = async () => {
    setIsExporting(true);
    try {
      const exportData = await exportLocalDataAsJson();
      downloadExportAsFile(exportData);
      setHasExported(true);

      // Wait a moment then confirm
      setTimeout(() => {
        confirmEpochReset();
      }, 500);
    } catch (error) {
      console.error("Failed to export data:", error);
      // Still allow continue even if export fails
      confirmEpochReset();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportOnly = async () => {
    setIsExporting(true);
    try {
      const exportData = await exportLocalDataAsJson();
      downloadExportAsFile(exportData);
      setHasExported(true);
    } catch (error) {
      console.error("Failed to export data:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AlertDialog open={!!epochMismatchPending}>
      <AlertDialogContent className="max-w-lg">
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

            {/* Export option */}
            {pendingChangesCount > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportOnly}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {t("epochMismatch.exportOnly") || "Download Backup"}
                </Button>
                {hasExported && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    ✓ {t("epochMismatch.exported") || "Exported"}
                  </span>
                )}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={cancelEpochReset}>
            {t("epochMismatch.cancel") || "Cancel Login"}
          </AlertDialogCancel>

          {pendingChangesCount > 0 ? (
            <AlertDialogAction
              onClick={handleExportAndContinue}
              disabled={isExporting}
              className="bg-primary hover:bg-primary/90"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("epochMismatch.exporting") || "Exporting..."}
                </>
              ) : (
                t("epochMismatch.exportAndClear") || "Export & Clear"
              )}
            </AlertDialogAction>
          ) : null}

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
