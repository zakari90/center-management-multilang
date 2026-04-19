"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { BarChart2, Trash2 } from "lucide-react";
import { AttendanceRowData } from "../hooks/useAttendance";

interface AttendanceRowProps {
  row: AttendanceRowData;
  idx: number;
  mode: "view" | "edit";
  updateRow: (
    id: string,
    field: keyof AttendanceRowData,
    value: string,
  ) => void;
  removeRow: (id: string) => void;
  onShowHistory: (row: AttendanceRowData) => void;
  t: any;
}

export function AttendanceRow({
  row,
  idx,
  mode,
  updateRow,
  removeRow,
  onShowHistory,
  t,
}: AttendanceRowProps) {
  return (
    <TableRow className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/5 transition-colors border-b dark:border-slate-800 print:border-black">
      <TableCell className="p-0 border-e dark:border-slate-800 print:border-black">
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
            {row.name}
          </span>
          {/* History trigger — always visible, small and unobtrusive */}
          <button
            title={t("history")}
            onClick={() => onShowHistory(row)}
            className="text-slate-300 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400 transition-colors print:hidden shrink-0"
          >
            <BarChart2 size={15} />
          </button>
        </div>
      </TableCell>
      <TableCell className="p-0">
        <div className="flex justify-center items-center h-12 gap-2 px-1">
          <StatusBox
            label="P"
            value="P"
            current={row.status}
            disabled={mode === "view"}
            onClick={() =>
              updateRow(row.id, "status", row.status === "P" ? "" : "P")
            }
          />
          <StatusBox
            label="A"
            value="A"
            current={row.status}
            disabled={mode === "view"}
            onClick={() =>
              updateRow(row.id, "status", row.status === "A" ? "" : "A")
            }
          />
          <StatusBox
            label="L"
            value="L"
            current={row.status}
            disabled={mode === "view"}
            onClick={() =>
              updateRow(row.id, "status", row.status === "L" ? "" : "L")
            }
          />
          <StatusBox
            label="LV"
            value="LV"
            current={row.status}
            disabled={mode === "view"}
            onClick={() =>
              updateRow(row.id, "status", row.status === "LV" ? "" : "LV")
            }
          />
        </div>
      </TableCell>
      <TableCell className="p-0 print:hidden text-center border-s dark:border-slate-800">
        <button
          onClick={() => removeRow(row.id)}
          className="text-slate-400 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition-colors p-2"
          title={t("delete")}
        >
          <Trash2 size={16} />
        </button>
      </TableCell>
    </TableRow>
  );
}

function StatusBox({
  label,
  value,
  current,
  onClick,
  disabled,
}: {
  label: string;
  value: string;
  current: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const active = current === value;
  return (
    <div
      className={`flex flex-col items-center group ${disabled ? "pointer-events-none" : "cursor-pointer"}`}
      onClick={onClick}
    >
      <span
        className={`text-[8px] uppercase font-bold transition-colors ${active ? "text-indigo-600" : "text-slate-400"}`}
      >
        {label}
      </span>
      <div
        className={`w-4 h-4 border rounded-sm transition-all flex items-center justify-center ${
          active
            ? "bg-indigo-600 border-indigo-600 shadow-sm"
            : "border-slate-300 dark:border-slate-600 group-hover:border-indigo-400"
        }`}
      >
        {active && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-2.5 h-2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </div>
  );
}
