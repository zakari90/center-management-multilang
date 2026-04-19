"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ChevronDown, Plus } from "lucide-react";

interface AttendanceControlsProps {
  isRtl: boolean;
  t: any;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleBulkAdd: (text: string) => void;
  handleExport: () => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  availableNames: { id: string; name: string }[];
  filteredAvailableNames: { id: string; name: string }[];
  addRow: (person?: { id: string; name: string }) => void;
}

export function AttendanceControls({
  isRtl,
  t,
  handleFileUpload,
  handleBulkAdd,
  handleExport,
  searchTerm,
  setSearchTerm,
  availableNames,
  filteredAvailableNames,
  addRow,
}: AttendanceControlsProps) {
  return (
    <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/5 border-b dark:border-slate-800 print:hidden flex flex-wrap items-center gap-6">
      <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block self-end mb-2" />

      {/* --- Name Management Section --- */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase text-slate-400">
          {isRtl ? "إدارة الأسماء" : "Manage Names"}
        </span>
        <div className="flex items-center gap-2 self-end mb-1">
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("file-upload")?.click()}
            className="rounded-full gap-2 border-slate-200 h-9"
          >
            <Plus size={14} /> {isRtl ? "تحميل ملف" : "Upload File"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2 border-slate-200 h-9"
              >
                <Plus size={14} /> {t("addNames")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={isRtl ? "rtl" : "ltr"}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("addNames")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {isRtl
                    ? "أدخل الأسماء (اسم واحد في كل سطر)"
                    : "Enter names (one per line)"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <textarea
                  id="bulk-names"
                  className="w-full h-40 p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                  placeholder={
                    isRtl
                      ? "أحمد المحمد\nفاطمة الزهراء..."
                      : "John Doe\nJane Smith..."
                  }
                />
              </div>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>
                  {isRtl ? "إلغاء" : "Cancel"}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    const textarea = document.getElementById(
                      "bulk-names",
                    ) as HTMLTextAreaElement;
                    if (textarea) handleBulkAdd(textarea.value);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isRtl ? "إضافة" : "Add"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block self-end mb-2" />

      {/* Export Section */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase text-slate-400">
          {isRtl ? "تصدير الأسماء" : "export names"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="rounded-full gap-2 border-slate-200 h-9 px-6"
        >
          <ChevronDown size={14} /> {isRtl ? "تصدير" : "Export"}
        </Button>
      </div>

      <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block self-end mb-2" />

      {/* Filter & Add Dropdown */}
      <div className="flex-1 min-w-[300px] flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            {isRtl ? "فلترة الأسماء" : "filtre names"}
          </span>
          <span className="text-[10px] font-bold uppercase text-slate-400">
            {t("addName")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="h-9 text-xs"
            placeholder={isRtl ? "بحث..." : "Search..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            onValueChange={(val) => {
              const person = availableNames.find((p) => p.id === val);
              if (person) addRow(person);
            }}
          >
            <SelectTrigger className="flex-1 bg-white dark:bg-slate-900 border-slate-200 h-9 text-xs">
              <SelectValue
                placeholder={
                  isRtl ? "اختر من القائمة..." : "Select student/teacher..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredAvailableNames.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
