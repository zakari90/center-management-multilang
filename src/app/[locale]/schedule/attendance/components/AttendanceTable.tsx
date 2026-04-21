"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendanceRow } from "./AttendanceRow";
import { MemberHistorySheet } from "./MemberHistorySheet";
import { ClipboardList, Users, Trash2 } from "lucide-react";
import { useState } from "react";
import { AttendanceRowData } from "../hooks/useAttendance";

interface AttendanceTableProps {
  rows: AttendanceRowData[];
  mode: "view" | "edit";
  isRtl: boolean;
  t: any;
  registerName: string;
  scheduleId: string;
  formattedDate?: string;
  updateRow: (
    id: string,
    field: keyof AttendanceRowData,
    value: string,
  ) => void;
  removeRow: (id: string) => void;
}

export function AttendanceTable({
  rows,
  mode,
  isRtl,
  t,
  registerName,
  scheduleId,
  formattedDate,
  updateRow,
  removeRow,
}: AttendanceTableProps) {
  const [historyRow, setHistoryRow] = useState<AttendanceRowData | null>(null);

  return (
    <div className="overflow-x-auto min-h-[400px]">
      {/* Register Name → Names List banner */}
      {registerName && (
        <div className="flex items-center justify-between px-6 py-3 bg-linear-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20 border-b border-indigo-100 dark:border-indigo-900/40 print:bg-indigo-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
              <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-indigo-400 dark:text-indigo-500 tracking-wider leading-none mb-0.5">
                {t("register")}
              </span>
              <h3 className="text-base font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                {registerName}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {formattedDate && (
              <div className="flex flex-col items-end mr-4 rtl:ml-4 rtl:mr-0 border-r rtl:border-l rtl:border-r-0 border-indigo-200 dark:border-indigo-800/50 pr-4 rtl:pl-4 rtl:pr-0">
                <span className="text-[10px] uppercase font-bold text-indigo-400 dark:text-indigo-500 tracking-wider leading-none mb-0.5">
                  {t("date")}
                </span>
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {formattedDate}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/40 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800/40">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400"
                suppressHydrationWarning
              >
                {rows.length}
              </span>
              <span className="text-[10px] text-indigo-400 dark:text-indigo-500 uppercase font-semibold">
                {rows.length === 1 ? t("member") : t("members")}
              </span>
            </div>
          </div>
        </div>
      )}

      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100">
            <TableHead className="min-w-[250px] font-bold">
              {t("columns.name")}
            </TableHead>
            <TableHead className="w-48 text-center font-bold">
              {t("columns.status")}
            </TableHead>
            <TableHead className="w-16 text-center font-bold print:hidden">
              <Trash2 size={14} className="mx-auto text-slate-400" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="h-48 text-center text-slate-400 italic"
              >
                {mode === "edit" ? t("addNamesToStart") : t("noRecordsYet")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <AttendanceRow
                key={row.id}
                row={row}
                idx={idx}
                mode={mode}
                updateRow={updateRow}
                removeRow={removeRow}
                onShowHistory={setHistoryRow}
                t={t}
              />
            ))
          )}
        </TableBody>
      </Table>

      {/* Member history slide-over */}
      {historyRow && (
        <MemberHistorySheet
          open={!!historyRow}
          onClose={() => setHistoryRow(null)}
          memberName={historyRow.name}
          externalId={historyRow.externalId || undefined}
          scheduleId={scheduleId}
          registerLabel={registerName}
          isRtl={isRtl}
        />
      )}
    </div>
  );
}
