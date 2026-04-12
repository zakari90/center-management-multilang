"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  teacherActions,
  studentActions,
  subjectActions,
  scheduleActions,
} from "@/lib/dexie/dexieActions";
import ServerActionTeachers from "@/lib/dexie/teacherServerAction";
import ServerActionStudents from "@/lib/dexie/studentServerAction";

interface DirectDeleteDialogProps {
  entityId: string;
  entityType: "teacher" | "student" | "subject" | "schedule";
  entityName: string;
  onDelete?: () => void;
  trigger?: React.ReactNode;
}

export function DirectDeleteDialog({
  entityId,
  entityType,
  entityName,
  onDelete,
  trigger,
}: DirectDeleteDialogProps) {
  const t = useTranslations("DirectDelete");
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // 1. Mark for deletion locally (Status '0')
      if (entityType === "teacher") {
        await teacherActions.markForDelete(entityId);
        toast.info(t("markingDeleted"), { description: t("syncingWithServer") });
        await ServerActionTeachers.Sync();
      } else if (entityType === "student") {
        await studentActions.markForDelete(entityId);
        toast.info(t("markingDeleted"), { description: t("syncingWithServer") });
        await ServerActionStudents.Sync();
      } else if (entityType === "subject") {
        await subjectActions.markForDelete(entityId);
      } else if (entityType === "schedule") {
        await scheduleActions.markForDelete(entityId);
      }

      toast.success(t("deletedSuccessfully"), {
        description: t("entityDeleted", { name: entityName }),
      });

      if (onDelete) onDelete();
      setOpen(false);
    } catch (error) {
      console.error("Deletion error:", error);
      toast.error(t("deleteFailed"), {
        description: t("errorOccurred"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200"
            title={t("delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t("confirmDelete")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("warningDescription", { name: entityName, type: t(`types.${entityType}`) })}
            <br />
            <span className="font-semibold text-destructive mt-2 inline-block">
              {t("undoWarning")}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("deleting")}
              </>
            ) : (
              t("confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
