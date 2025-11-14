/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { localDb } from "@/lib/dexie/dbSchema";
import { importAllFromServer, syncAllEntities } from "@/lib/dexie/serverActions";
import { isOnline } from "@/lib/utils/network";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  Loader2,
  Trash2,
  Upload
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SyncResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export function SyncHandler() {
  const t = useTranslations("SyncHandler");
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [importResult, setImportResult] = useState<SyncResult | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // ✅ Export/Sync to Server - Push local changes to server
  const handleSyncToServer = async () => {
    if (!isOnline()) {
      setSyncResult({
        success: false,
        message: t("offlineError"),
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const results = await syncAllEntities();
      
      // Count successes and failures
      let successCount = 0;
      let failureCount = 0;
      const details: Record<string, any> = {};

      Object.entries(results).forEach(([entity, result]) => {
        if (result.status === "fulfilled") {
          successCount++;
          details[entity] = { success: true, ...result.value };
        } else {
          failureCount++;
          details[entity] = { 
            success: false, 
            error: result.reason?.message || "Unknown error" 
          };
        }
      });

      setSyncResult({
        success: failureCount === 0,
        message: failureCount === 0
          ? t("syncSuccess", { count: successCount })
          : t("syncPartial", { success: successCount, failed: failureCount }),
        details,
      });

      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      setSyncResult({
        success: false,
        message: t("syncError", { 
          error: error instanceof Error ? error.message : "Unknown error" 
        }),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // ✅ Import from Server - Pull all data from server to local DB
  const handleImportFromServer = async () => {
    if (!isOnline()) {
      setImportResult({
        success: false,
        message: t("offlineError"),
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const results = await importAllFromServer();
      
      // Count successes and failures
      let successCount = 0;
      let failureCount = 0;
      const details: Record<string, any> = {};

      Object.entries(results).forEach(([entity, result]) => {
        if (result.status === "fulfilled") {
          successCount++;
          details[entity] = { success: true, ...result.value };
        } else {
          failureCount++;
          details[entity] = { 
            success: false, 
            error: result.reason?.message || "Unknown error" 
          };
        }
      });

      setImportResult({
        success: failureCount === 0,
        message: failureCount === 0
          ? t("importSuccess", { count: successCount })
          : t("importPartial", { success: successCount, failed: failureCount }),
        details,
      });

      // Refresh the page to show imported data
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      setImportResult({
        success: false,
        message: t("importError", { 
          error: error instanceof Error ? error.message : "Unknown error" 
        }),
      });
    } finally {
      setIsImporting(false);
    }
  };

  // ✅ Delete All Local DB Data
  const handleDeleteLocalDB = async () => {
    setIsDeleting(true);
    setDeleteConfirm(false);

    try {
      // Delete all tables
      await Promise.all([
        localDb.users.clear(),
        localDb.centers.clear(),
        localDb.teachers.clear(),
        localDb.students.clear(),
        localDb.subjects.clear(),
        localDb.teacherSubjects.clear(),
        localDb.studentSubjects.clear(),
        localDb.receipts.clear(),
        localDb.schedules.clear(),
        // Keep pushSubscriptions - they're device-specific
        // localDb.pushSubscriptions.clear(),
      ]);

      // Refresh the page
      router.refresh();
      
      // Show success message
      setImportResult({
        success: true,
        message: t("deleteSuccess"),
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: t("deleteError", { 
          error: error instanceof Error ? error.message : "Unknown error" 
        }),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const online = isOnline();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center gap-2 text-sm">
          {online ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-600">{t("online")}</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-orange-600">{t("offline")}</span>
            </>
          )}
        </div>

        {/* Sync Results */}
        {syncResult && (
          <Alert variant={syncResult.success ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{syncResult.message}</AlertDescription>
          </Alert>
        )}

        {importResult && (
          <Alert variant={importResult.success ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{importResult.message}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Export/Sync to Server */}
          <Button
            onClick={handleSyncToServer}
            disabled={isSyncing || !online}
            variant="default"
            className="w-full"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("syncing")}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t("syncToServer")}
              </>
            )}
          </Button>

          {/* Import from Server */}
          <Button
            onClick={handleImportFromServer}
            disabled={isImporting || !online}
            variant="outline"
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("importing")}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t("importFromServer")}
              </>
            )}
          </Button>

          {/* Delete Local DB */}
          {deleteConfirm ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground text-center">
                {t("confirmDelete")}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleDeleteLocalDB}
                  disabled={isDeleting}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("deleting")}
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("confirm")}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setDeleteConfirm(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setDeleteConfirm(true)}
              disabled={isDeleting}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("deleteLocalDB")}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>{t("syncToServer")}:</strong> {t("syncToServerHelp")}</p>
          <p><strong>{t("importFromServer")}:</strong> {t("importFromServerHelp")}</p>
          <p><strong>{t("deleteLocalDB")}:</strong> {t("deleteLocalDBHelp")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

