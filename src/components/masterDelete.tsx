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
import { localDb } from "@/lib/dexie/dbSchema";
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
      // ✅ Try to delete from server first if online
      if (typeof window !== "undefined" && window.navigator.onLine) {
        try {
          const response = await fetch("/api/admin/delete-all", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ password }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Check for incorrect password error
            if (response.status === 401) {
              toast.error(t("incorrectPassword") || "Incorrect password");
              setIsDeleting(false);
              return;
            }

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
        localDb.deleteRequests.clear(),
        localDb.appNotifications.clear(),
        // Keep pushSubscriptions - they're device-specific
        // localDb.pushSubscriptions.clear(),
      ]);

      toast.success(
        t("allDataDeletedSuccessfully") || "All data deleted successfully!",
      );
      setOpen(false);

      // Logout and redirect to login page after a short delay to allow toast to be visible
      setTimeout(async () => {
        try {
          // Call logout API to clear session
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });
        } catch (error) {
          console.error("Logout failed:", error);
        }

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
        window.location.href = `/${locale}/login`;
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
