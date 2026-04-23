"use client";

import {
  AlertDialog,
  AlertDialogAction,
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface WelcomeDialogProps {
  open: boolean;
  onConfirm: () => void;
  isRtl: boolean;
  t: any;
}

export function WelcomeDialog({
  open,
  onConfirm,
  isRtl,
  t,
}: WelcomeDialogProps) {
  const router = useRouter();
  const locale = useLocale();

  const handleConfirm = () => {
    onConfirm();
    router.push(`/${locale}`);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent dir={isRtl ? "rtl" : "ltr"} className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600">
              <Sparkles size={32} />
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
              <div className="flex items-center gap-3 p-2 rounded-md bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400">
                <Star size={14} className="shrink-0" />
                <span className="text-[10px] font-medium leading-tight">
                  {t("welcome_add_favorites")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleConfirm}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-all shadow-lg hover:shadow-indigo-500/25"
          >
            {t("welcome_confirm_btn")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
