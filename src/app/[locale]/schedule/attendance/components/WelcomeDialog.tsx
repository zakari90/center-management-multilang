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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Users } from "lucide-react";
import { useState } from "react";

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
  const [name, setName] = useState("");

  const handleConfirm = () => {
    onConfirm(name);
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
            {isRtl ? "تسمية سجل الحضور" : "Name your Attendance Register"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {isRtl
              ? "يرجى إعطاء اسم لهذا السجل للمتابعة."
              : "Please provide a name for this register to proceed."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="first-register-name"
              className="text-xs font-bold uppercase text-slate-500"
            >
              {isRtl ? "اسم السجل" : "Register Name"}
            </Label>
            <Input
              id="first-register-name"
              placeholder={
                isRtl
                  ? "مثال: الفترة الصباحية - لغة عربية"
                  : "e.g. Morning Shift - Arabic Class"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 border-indigo-100 dark:border-indigo-900/50 focus:ring-indigo-500"
              autoFocus
            />
          </div>

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
        </div>

        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRtl ? "ابدأ الآن" : "Get Started"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
