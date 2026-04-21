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
import { Sparkles, Users, ShieldCheck, WifiOff, Database, Info } from "lucide-react";

interface WelcomeDialogProps {
  open: boolean;
  onConfirm: (name: string) => void;
  isRtl: boolean;
  t: any;
}

export function WelcomeDialog({
  open,
  onConfirm,
  isRtl,
  t,
}: WelcomeDialogProps) {
  const handleConfirm = () => {
    onConfirm(isRtl ? "سجل الحضور" : "Attendance Register");
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
            {isRtl ? "مرحباً بك في نظام الحضور" : "Welcome to the Attendance System"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {isRtl
              ? "نظام إدارة ذكي يعمل محلياً بالكامل لحماية خصوصيتك."
              : "A smart management system that works fully locally to protect your privacy."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6 space-y-4">

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg flex items-start gap-3">
            <div className="mt-0.5 text-indigo-600">
              <Users size={16} />
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              {isRtl
                ? "يمكنك لاحقاً إضافة الأسماء يدوياً، أو تحميلها من ملف Excel، أو استيرادها من قائمة الطلاب والمعلمين."
                : "Later, you can add names manually, upload them from an Excel file, or import them from your student and teacher lists."}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2">
              <Info size={12} />
              {isRtl ? "معلومات هامة حول الخصوصية والعمل بدون إنترنت" : "Privacy & Offline Information"}
            </p>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-2 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                <Database size={14} className="shrink-0" />
                <span className="text-[10px] font-medium leading-tight">
                  {isRtl ? "بياناتك تُحفظ محلياً فقط ولا نجمع أي معلومات عنك." : "Data is saved locally. We do not collect or store your data."}
                </span>
              </div>
              
              <div className="flex items-center gap-3 p-2 rounded-md bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                <ShieldCheck size={14} className="shrink-0" />
                <span className="text-[10px] font-medium leading-tight">
                  {isRtl ? "تنبيه: لا تمسح ذاكرة التخزين المؤقت للمتصفح (Cache) لتجنب فقدان البيانات." : "Important: Do not clear your browser cache/site data to avoid losing progress."}
                </span>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-md bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400">
                <WifiOff size={14} className="shrink-0" />
                <span className="text-[10px] font-medium leading-tight">
                  {isRtl ? "سيعمل النظام 100% بدون إنترنت بمجرد اكتمال تحميل وحفظ الصفحة." : "Works 100% offline once the application is fully cached in your browser."}
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
            {isRtl ? "ابدأ الآن" : "Get Started"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
