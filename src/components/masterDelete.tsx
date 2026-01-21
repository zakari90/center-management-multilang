"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Trash, Loader2, AlertTriangle } from "lucide-react";
import { localDb } from "@/lib/dexie/dbSchema";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteAllDataButton() {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations("deleteALL");
  const router = useRouter();

  // ✅ Delete all data from both server and local DB
  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // ✅ Try to delete from server first if online
      if (typeof window !== "undefined" && window.navigator.onLine) {
        try {
          const response = await fetch("/api/admin/delete-all", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || `Server error: ${response.status}`,
            );
          }
        } catch (serverError) {
          console.error("Server deletion failed:", serverError);
          toast.warning(
            t("serverDeleteFailed") ||
              `Server deletion failed: ${serverError instanceof Error ? serverError.message : "Unknown error"}. Local data will still be cleared.`,
          );
          // Continue to clear local data even if server fails
        }
      } else {
        toast.warning(
          t("offlineDeleteWarning") ||
            "Offline: Only local data will be deleted. Server data will remain.",
        );
      }

      // ✅ Clear all local tables regardless of server result
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

      toast.success(
        t("allDataDeletedSuccessfully") || "All data deleted successfully!",
      );
      setOpen(false);

      // Refresh the page after a short delay to allow toast to be visible
      setTimeout(() => {
        router.refresh();
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to delete data:", error);
      toast.error(
        t("failedToDeleteData") ||
          `Failed to delete data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="my-6">
      <Button onClick={() => setOpen(true)} variant="destructive">
        <Trash className="inline w-4 h-4 mr-2" />
        {t("deleteAllData")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("deleteAllData")}
            </DialogTitle>
            <DialogDescription className="pt-4">
              {t("areYouSureDeleteAllData")}{" "}
              <strong>{t("deleteAllData")}</strong>?
              <br />
              <span className="text-destructive font-semibold">
                {t("cannotBeUndone")}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={isDeleting}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                <>
                  <Trash className="w-4 h-4 mr-2" />
                  {t("yesDeleteEverything")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
