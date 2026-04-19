"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { CalendarDays, TrendingUp, User } from "lucide-react";
import {
  AttendanceSession,
  AttendanceRecord,
  attendanceActions,
} from "@/freelib/dexie/scheduleDb";

interface HistoryEntry {
  session: AttendanceSession;
  record: AttendanceRecord | null;
}

interface MemberHistorySheetProps {
  open: boolean;
  onClose: () => void;
  memberName: string;
  externalId?: string;
  scheduleId: string;
  registerLabel: string;
  isRtl: boolean;
}

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; ring: string }
> = {
  P: {
    label: "Present",
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    ring: "ring-emerald-400",
  },
  A: {
    label: "Absent",
    color: "text-rose-600",
    bg: "bg-rose-100 dark:bg-rose-900/40",
    ring: "ring-rose-400",
  },
  L: {
    label: "Late",
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    ring: "ring-amber-400",
  },
  LV: {
    label: "Leave",
    color: "text-sky-600",
    bg: "bg-sky-100 dark:bg-sky-900/40",
    ring: "ring-sky-400",
  },
  "": {
    label: "—",
    color: "text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    ring: "ring-slate-300",
  },
};

export function MemberHistorySheet({
  open,
  onClose,
  memberName,
  externalId,
  scheduleId,
  registerLabel,
  isRtl,
}: MemberHistorySheetProps) {
  const locale = useLocale();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !scheduleId || !memberName) return;
    setLoading(true);
    attendanceActions
      .getMemberHistory(scheduleId, memberName, externalId)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [open, scheduleId, memberName, externalId]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const total = history.length;
  const counts = { P: 0, A: 0, L: 0, LV: 0, "": 0 };
  history.forEach((h) => {
    const s = h.record?.status ?? "";
    if (s in counts) counts[s as keyof typeof counts]++;
    else counts[""]++;
  });
  const presentCount = counts["P"] + counts["L"]; // present + late = attended
  const attendanceRate =
    total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const rateColor =
    attendanceRate >= 80
      ? "text-emerald-500"
      : attendanceRate >= 60
        ? "text-amber-500"
        : "text-rose-500";

  const rateStroke =
    attendanceRate >= 80
      ? "#10b981"
      : attendanceRate >= 60
        ? "#f59e0b"
        : "#f43f5e";

  // SVG ring
  const R = 44;
  const circumference = 2 * Math.PI * R;
  const dash = (attendanceRate / 100) * circumference;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={isRtl ? "left" : "right"}
        className="w-full sm:max-w-md overflow-y-auto p-0"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <SheetHeader className="p-6 pb-4 border-b dark:border-slate-800 bg-linear-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/60 ring-2 ring-indigo-200 dark:ring-indigo-700">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <SheetTitle className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                {memberName}
              </SheetTitle>
              <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold uppercase tracking-wide mt-0.5 truncate max-w-[260px]">
                {registerLabel}
              </p>
            </div>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            {isRtl ? "جاري التحميل…" : "Loading…"}
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
            <CalendarDays className="w-10 h-10 opacity-30" />
            <p className="text-sm italic">
              {isRtl ? "لا توجد جلسات محفوظة بعد" : "No saved sessions yet"}
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* ── Rate Ring ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-6">
              <div className="relative flex items-center justify-center w-28 h-28 shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke={rateStroke}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={`text-2xl font-black ${rateColor}`}>
                    {attendanceRate}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    {isRtl ? "حضور" : "Rate"}
                  </span>
                </div>
              </div>

              {/* ── Summary Chips ────────────────────────────────────────── */}
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {total}{" "}
                  {isRtl ? "جلسة" : total === 1 ? "session" : "sessions"}
                </div>
                {(["P", "A", "L", "LV"] as const).map((s) => (
                  <div key={s} className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_META[s].bg} ${STATUS_META[s].color}`}
                    >
                      {s}
                      <span className="font-black">{counts[s]}</span>
                    </span>
                    <div className="h-1.5 flex-1 mx-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width:
                            total > 0 ? `${(counts[s] / total) * 100}%` : "0%",
                          backgroundColor: rateStroke,
                          opacity:
                            s === "P"
                              ? 1
                              : s === "L"
                                ? 0.7
                                : s === "A"
                                  ? 0.4
                                  : 0.55,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold w-8 text-end">
                      {total > 0 ? Math.round((counts[s] / total) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Session Timeline ─────────────────────────────────────────── */}
            <div>
              <h4 className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-3">
                {isRtl ? "سجل الجلسات" : "Session History"}
              </h4>
              <div className="space-y-2">
                {history.map(({ session, record }) => {
                  const status = record?.status ?? "";
                  const meta = STATUS_META[status] ?? STATUS_META[""];
                  const date = new Date(session.date).toLocaleDateString(
                    locale,
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  );

                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-800 transition-colors"
                    >
                      {/* Status dot */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-xs ring-1 ${meta.bg} ${meta.color} ${meta.ring}`}
                      >
                        {status || "—"}
                      </div>

                      {/* Date & shift */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {date}
                        </p>
                        {record?.remarks && (
                          <p className="text-[11px] text-slate-400 italic truncate mt-0.5">
                            {record.remarks}
                          </p>
                        )}
                      </div>

                      {/* Shift badge */}
                      <span className="text-[10px] uppercase font-bold text-indigo-400 dark:text-indigo-500 shrink-0">
                        {session.shift}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
