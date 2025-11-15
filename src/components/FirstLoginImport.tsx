"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/authContext";
import { importAllFromServerForRole } from "@/lib/dexie/serverActions";
import { isOnline, waitForOnline } from "@/lib/utils/network";
import { localDb } from "@/lib/dexie/dbSchema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2, Download, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

/**
 * Component that automatically imports data from server on first login
 * or when local DB is empty. Shows a prompt if import is needed.
 */
export function FirstLoginImport() {
  const t = useTranslations("FirstLoginImport");
  const { user } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [needsImport, setNeedsImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkLocalDB = useCallback(async () => {
    if (!user) {
      setIsChecking(false);
      return;
    }

    try {
      // Check if local DB has any data (excluding users)
      const [centers, subjects, teachers, students] = await Promise.all([
        localDb.centers.count(),
        localDb.subjects.count(),
        localDb.teachers.count(),
        localDb.students.count(),
      ]);

      // If no data exists, prompt for import
      const hasData = centers > 0 || subjects > 0 || teachers > 0 || students > 0;
      setNeedsImport(!hasData);
    } catch (error) {
      console.error("Error checking local DB:", error);
      setNeedsImport(true); // Show prompt on error
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  useEffect(() => {
    checkLocalDB();
  }, [checkLocalDB]);

  const handleImport = async () => {
    if (!user) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      // Wait for online if offline (with timeout)
      if (!isOnline()) {
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout")), 10000); // 10 second timeout
        });
        
        try {
          await Promise.race([waitForOnline(), timeoutPromise]);
        } catch {
          // Timeout or error
          setImportResult({
            success: false,
            message: t("offlineError"),
          });
          setIsImporting(false);
          return;
        }
      }

      if (!isOnline()) {
        setImportResult({
          success: false,
          message: t("offlineError"),
        });
        setIsImporting(false);
        return;
      }

      const isAdmin = user.role === "ADMIN";
      const results = await importAllFromServerForRole(isAdmin);

      // Check if import was successful
      let successCount = 0;
      let failureCount = 0;

      Object.values(results).forEach((result) => {
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          failureCount++;
        }
      });

      if (failureCount === 0) {
        setImportResult({
          success: true,
          message: t("importSuccess", { count: successCount }),
        });
        setNeedsImport(false);
        
        // Refresh page after 1 second
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setImportResult({
          success: false,
          message: t("importPartial", { success: successCount, failed: failureCount }),
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: t("importError", {
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (isChecking || !needsImport || dismissed || importResult?.success) {
    return null;
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">{t("title")}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {importResult && (
          <Alert variant={importResult.success ? "default" : "destructive"}>
            {importResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{importResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleImport}
            disabled={isImporting || !isOnline()}
            className="flex-1"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("importing")}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t("importNow")}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setDismissed(true)}
            disabled={isImporting}
          >
            {t("dismiss")}
          </Button>
        </div>

        {!isOnline() && (
          <p className="text-sm text-muted-foreground">
            {t("offlineMessage")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

