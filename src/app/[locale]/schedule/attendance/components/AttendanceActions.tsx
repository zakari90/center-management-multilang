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
import { Edit3, Eye, Save, Trash } from "lucide-react";

interface AttendanceActionsProps {
  mode: "view" | "edit";
  setMode: (mode: "view" | "edit") => void;
  isRtl: boolean;
  t: any;
  handleDeleteAll: () => Promise<void>;
  handleSave: () => Promise<void>;
  loading: boolean;
  registerName: string;
  sessionCreatedAt: number | null;
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
            className={`rounded-full gap-2 ${mode === "edit" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
          >
            <Edit3 size={16} /> {t("editMode")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {mode === "edit" && (
          <>
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
                    {t("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAll}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {t("delete")}
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
                    {t("save")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir={isRtl ? "rtl" : "ltr"}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("confirmSave")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("overwriteMessage")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 mt-4">
                    <AlertDialogCancel>
                      {t("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSave}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {t("confirmOverwrite")}
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
                {t("save")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
