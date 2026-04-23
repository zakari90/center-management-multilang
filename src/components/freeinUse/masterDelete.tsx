"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/freelib/dexie/dbSchema";
import { AlertTriangle, Loader2, Trash } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteAllDataButton() {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const t = useTranslations("deleteALL");
  const locale = useLocale();

  // ✅ Delete all data from both server and local DB
  const handleDelete = async () => {
    setIsDeleting(true);

    // Validate password is provided
    if (!password || password.trim() === "") {
      toast.error(
        t("passwordRequired") || "Password is required to confirm this action",
      );
      setIsDeleting(false);
      return;
    }

    try {
      // ✅ Local-only mode: Notifying user about local clearance only
      toast.info(
        t("localDeleteOnly") ||
          "Local-only mode: All data will be cleared from this browser's local storage.",
      );

      // ✅ Clear all local tables regardless of server result
      await Promise.all([
        getDb().users.clear(),
        getDb().centers.clear(),
        getDb().teachers.clear(),
        getDb().students.clear(),
        getDb().subjects.clear(),
        getDb().teacherSubjects.clear(),
        getDb().studentSubjects.clear(),
        getDb().receipts.clear(),
        getDb().schedules.clear(),
      ]);

      toast.success(
        t("allDataDeletedSuccessfully") || "All data deleted successfully!",
      );
      setOpen(false);

      // Logout and redirect to login page after a short delay to allow toast to be visible
      setTimeout(async () => {
        // No server logout needed in local-only mode

        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/",
            );
        });

        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();

        // Clear service worker cache if available
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }

        // Redirect to login page
        window.location.href = `/${locale}`;
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

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setPassword(""); // Clear password when dialog closes
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("deleteAllData")}
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <p>
                {t("areYouSureDeleteAllData")} {t("downloadBackupWarning")}{" "}
                {/* <strong>{t("deleteAllData")}</strong> */}
                <br />
                <span className="text-destructive font-semibold">
                  {t("cannotBeUndone")}
                </span>
              </p>

              {/* Password Confirmation */}
              <div className="space-y-2 pt-2">
                <Label
                  htmlFor="delete-password"
                  className="text-sm font-medium"
                >
                  {t("passwordConfirmation") ||
                    "For security, please enter your admin password to confirm this action"}
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    t("passwordPlaceholder") || "Enter your password"
                  }
                  disabled={isDeleting}
                  className="w-full"
                  autoFocus
                />
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
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
