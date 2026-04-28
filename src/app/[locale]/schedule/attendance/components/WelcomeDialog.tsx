"use client";

import Lottie from "lottie-react";
import starAnimation from "../../../../../../public/Star.json";

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
import {
  Sparkles,
  Users,
  ShieldCheck,
  WifiOff,
  Database,
  Info,
  Star,
  RefreshCw,
} from "lucide-react";

interface WelcomeDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isRtl: boolean;
  t: any;
}

export function WelcomeDialog({
  open,
  onConfirm,
  onCancel,
  isRtl,
  t,
}: WelcomeDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent dir={isRtl ? "rtl" : "ltr"} className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-24 h-24 flex items-center justify-center">
              <Lottie
                animationData={starAnimation}
                loop={true}
                autoplay={true}
              />
            </div>
          </div>
          <AlertDialogTitle className="text-2xl text-center font-black">
            {t("welcome_title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {t("welcome_desc")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg flex items-start gap-3">
            <div className="mt-0.5 text-indigo-600">
              <Users size={16} />
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              {t("welcome_later_names")}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2">
              <Info size={12} />
              {t("welcome_privacy_title")}
            </p>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-2 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                <Database size={14} className="shrink-0" />
                <span className="text-[10px] font-medium leading-tight">
                  {t("welcome_data_local")}
                </span>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-md bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                <ShieldCheck size={14} className="shrink-0" />
                <span className="text-[10px] font-medium leading-tight">
                  {t("welcome_dont_clear_cache")}
                </span>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-md bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400">
                <WifiOff size={14} className="shrink-0" />
                <span className="text-[10px] font-medium leading-tight">
                  {t("welcome_works_offline")}
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400">
                <RefreshCw size={14} className="shrink-0" />
                <span className="text-[10px] font-medium leading-tight">
                  {t("welcome_auto_backup")}
                </span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md bg-yellow-50/50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400">
                <Star size={14} className="shrink-0" />
                <span className="text-[10px] font-medium leading-tight">
                  {t("welcome_add_favorites")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={handleCancel}
            className="w-full sm:w-auto h-11 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-md transition-all"
          >
            {t("welcome_cancel_btn")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="w-full sm:flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-all shadow-lg hover:shadow-indigo-500/25"
          >
            {t("welcome_confirm_btn")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
