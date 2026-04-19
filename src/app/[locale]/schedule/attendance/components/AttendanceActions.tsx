"use client";

import { Button } from "@/components/ui/button";
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
import {
  Edit3,
  Eye,
  Save,
  Trash,
  LogIn,
} from "lucide-react";

interface AttendanceActionsProps {
  mode: "view" | "edit";
  setMode: (mode: "view" | "edit") => void;
  router: any;
  isRtl: boolean;
  t: any;
  handleDeleteAll: () => Promise<void>;
  handleSave: () => Promise<void>;
  loading: boolean;
  locale: string;
  registerName: string;
  selectedScheduleId: string;
  sessionCreatedAt: number | null;
  canEdit?: boolean;
  isAuthenticated?: boolean;
}

export function AttendanceActions({
  mode,
  setMode,
  isRtl,
  t,
  handleDeleteAll,
  handleSave,
  loading,
  registerName,
  sessionCreatedAt,
  canEdit,
  isAuthenticated,
}: AttendanceActionsProps) {
  return (
    <div className="max-w-6xl mx-auto mb-8 flex flex-wrap gap-4 items-center justify-between print:hidden">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
          <Button
            variant={mode === "view" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("view")}
            className={`rounded-full gap-2 ${mode === "view" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
          >
            <Eye size={16} /> {t("viewMode")}
          </Button>
          <Button
            variant={mode === "edit" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("edit")}
            disabled={!canEdit}
            className={`rounded-full gap-2 ${mode === "edit" ? "bg-indigo-600 hover:bg-indigo-700" : ""} ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Edit3 size={16} /> {t("editMode")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {mode === "edit" && canEdit && (
          <>
            {/* Existing Save/Delete buttons */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2 rounded-full"
                >
                  <Trash size={16} />
                  {t("deleteAll")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir={isRtl ? "rtl" : "ltr"}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirmDeleteAll")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("confirmDeleteAllDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel>
                    {isRtl ? "إلغاء" : "Cancel"}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAll}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isRtl ? "حذف" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {sessionCreatedAt ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={loading || !registerName.trim()}
                    className="gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {isRtl ? "حفظ" : "Save"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir={isRtl ? "rtl" : "ltr"}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{isRtl ? "تأكيد الحفظ" : "Confirm Save"}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {isRtl ? "لديك بالفعل نسخة محفوظة لهذا السجل في هذا التوقيت. هل تريد استبدالها بالفعل؟" : "You already have a saved version of this register for this date. Do you want to overwrite it?"}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 mt-4">
                    <AlertDialogCancel>
                      {isRtl ? "إلغاء" : "Cancel"}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSave}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isRtl ? "تأكيد واستبدال" : "Confirm Overwrite"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                onClick={handleSave}
                disabled={loading || !registerName.trim()}
                className="gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save size={18} />
                {isRtl ? "حفظ" : "Save"}
              </Button>
            )}
          </>
        )}

        {!isAuthenticated && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <LogIn size={14} />
            {isRtl ? "قم بتسجيل الدخول كمدير لتتمكن من التعديل" : "Log in as manager to enable editing"}
          </div>
        )}
      </div>
    </div>
  );
}
