"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash, Loader2 } from "lucide-react";
import { localDb } from "@/lib/dexie/dbSchema";

export function DeleteAllDataButton() {
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations("deleteALL");
  const router = useRouter();

  // ✅ Delete all local DB data (not server data)
  const handleDelete = async () => {
    setStatus(null);
    setIsDeleting(true);
    
    try {
      // Delete all local tables
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

      setStatus(t("allDataDeletedSuccessfully") || "All local data deleted successfully");
      setConfirm(false);
      router.refresh();
    } catch (error) {
      setStatus(t("failedToDeleteData") || `Failed to delete data: ${error instanceof Error ? error.message : "Unknown error"}`);
      setConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="my-6">
      {status && (
        <Alert className="mb-4">
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}
      {confirm ? (
        <div>
          <p className="mb-2">
            {t("areYouSureDeleteAllData")} <strong>{t("deleteAllData")}</strong>? {t("cannotBeUndone")}
          </p>
          <Button 
            onClick={handleDelete} 
            variant="destructive" 
            className="mr-2"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="inline w-4 h-4 mr-1 animate-spin" />
                {t("deleting") || "Deleting..."}
              </>
            ) : (
              <>
                <Trash className="inline w-4 h-4 mr-1" />
                {t("yesDeleteEverything")}
              </>
            )}
          </Button>
          <Button 
            onClick={() => setConfirm(false)} 
            variant="outline"
            disabled={isDeleting}
          >
            {t("cancel")}
          </Button>
        </div>
      ) : (
        <Button onClick={() => setConfirm(true)} variant="destructive">
          <Trash className="inline w-4 h-4 mr-1" />
          {t("deleteAllData")}
        </Button>
      )}
    </div>
  );
}
