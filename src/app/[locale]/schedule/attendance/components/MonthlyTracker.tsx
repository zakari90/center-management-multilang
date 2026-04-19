"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Info, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AttendanceRecord,
  AttendanceSession,
  RegisterMember,
} from "@/freelib/dexie/scheduleDb";
import { AttendanceLegend } from "./AttendanceLegend";
import PdfExporter from "@/components/freeinUse/pdfExporter";

interface MonthlyTrackerProps {
  scheduleId: string;
  currentMonthIndex: number;
  currentYear: string;
  isRtl: boolean;
  getMonthlyData: (monthIndex: number, year: string) => Promise<{
    members: RegisterMember[];
    sessions: AttendanceSession[];
    recordsBySession: Record<string, AttendanceRecord[]>;
  }>;
  t: any;
  locale: string;
}

export function MonthlyTracker({
  scheduleId,
  currentMonthIndex,
  currentYear,
  isRtl,
  getMonthlyData,
  t,
  locale,
}: MonthlyTrackerProps) {
  const [viewMonthIndex, setViewMonthIndex] = useState(currentMonthIndex);
  const [viewYear, setViewYear] = useState(currentYear);

  // Use useLiveQuery to make the tracker reactive to database changes
  const data = useLiveQuery(async () => {
    if (!scheduleId) return null;
    return await getMonthlyData(viewMonthIndex, viewYear);
  }, [scheduleId, viewMonthIndex, viewYear]);

  const loading = data === undefined;

  // Localized month name for display
  const viewMonthName = useMemo(() => {
    const d = new Date(parseInt(viewYear), viewMonthIndex - 1, 15);
    return d.toLocaleString(locale, { month: "long" });
  }, [viewMonthIndex, viewYear, locale]);

  // Determine the days in the month to show a full grid
  const daysInMonth = useMemo(() => {
    const yearNum = parseInt(viewYear);
    const lastDay = new Date(yearNum, viewMonthIndex, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }, [viewMonthIndex, viewYear]);

  const handlePrevMonth = () => {
    let newMonth = viewMonthIndex - 1;
    let newYear = parseInt(viewYear);
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setViewMonthIndex(newMonth);
    setViewYear(newYear.toString());
  };

  const handleNextMonth = () => {
    let newMonth = viewMonthIndex + 1;
    let newYear = parseInt(viewYear);
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setViewMonthIndex(newMonth);
    setViewYear(newYear.toString());
  };

  const handleBackToToday = () => {
    setViewMonthIndex(currentMonthIndex);
    setViewYear(currentYear);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() + 1 === viewMonthIndex &&
      today.getFullYear().toString() === viewYear
    );
  };

  if (!scheduleId) return null;

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        {isRtl ? "جاري تحميل سجل الشهر..." : "Loading monthly tracker..."}
      </div>
    );
  }

  // Create a map for quick lookup: map[memberName][day] = status
  const statusMap: Record<string, Record<number, string>> = {};

  if (data) {
    data.members.forEach((m) => {
      statusMap[m.name] = {};
    });

    data.sessions.forEach((session) => {
      const day = new Date(session.date).getDate();
      const records = data.recordsBySession[session.id] || [];
      records.forEach((record) => {
        if (statusMap[record.name]) {
          statusMap[record.name][day] = record.status;
        }
      });
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "P":
        return "bg-emerald-500 text-white";
      case "A":
        return "bg-rose-500 text-white";
      case "L":
        return "bg-amber-500 text-white";
      case "LV":
        return "bg-indigo-500 text-white";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-transparent";
    }
  };

  const hasData = data && data.members.length > 0;

  return (
    <PdfExporter 
      fileName={`Attendance-Tracker-${viewMonthName}-${viewYear}.pdf`} 
      buttonText={isRtl ? "تصدير PDF" : "Export PDF"}
    >
      <Card className="mt-8 mb-12 overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900 mx-4 print:shadow-none print:mt-4">
        <div className="bg-slate-900 dark:bg-slate-950 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Calendar className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase">
                {isRtl ? "سجل الحضور الشهري" : "Monthly Attendance Tracker"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="text-sm text-slate-400 font-bold min-w-[120px] text-center">
                  {viewMonthName} {viewYear}
                </p>
                <button 
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {(viewMonthIndex !== currentMonthIndex || viewYear !== currentYear) && (
                  <button 
                    onClick={handleBackToToday}
                    className="text-[10px] bg-indigo-500 hover:bg-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-2"
                  >
                    {isRtl ? "اليوم" : "Today"}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 self-start md:self-center">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold uppercase tracking-wider">
              {data?.members.length || 0} {isRtl ? "عضو" : "Members"}
            </span>
          </div>
        </div>

        {!hasData ? (
          <div className="p-20 text-center bg-slate-50 dark:bg-slate-900/50">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 italic">
              {isRtl
                ? "لا توجد سجلات لهذا الشهر"
                : "No records found for this month"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <TableHead className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 min-w-[200px] font-black uppercase text-[11px] text-slate-500 tracking-widest border-r dark:border-slate-700">
                    {isRtl ? "الاسم" : "Member Name"}
                  </TableHead>
                  {daysInMonth.map((day) => (
                    <TableHead
                      key={day}
                      className={`text-center p-0 min-w-[32px] font-bold text-[10px] border-r dark:border-slate-700/50 ${isToday(day) ? "bg-indigo-50/50 dark:bg-indigo-900/20" : ""}`}
                    >
                      <div className={`py-3 px-1 ${isToday(day) ? "text-indigo-600 dark:text-indigo-400 font-black scale-110" : ""}`}>
                        {day}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.members.map((member, idx) => (
                  <TableRow
                    key={member.id}
                    className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors"
                  >
                    <TableCell className="sticky left-0 z-10 bg-white dark:bg-slate-900 font-bold text-sm border-r dark:border-slate-700 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-300 w-4">
                          {idx + 1}
                        </span>
                        <span className="truncate">{member.name}</span>
                      </div>
                    </TableCell>
                    {daysInMonth.map((day) => {
                      const status = statusMap[member.name][day];
                      return (
                        <TableCell
                          key={day}
                          className={`p-1 border-r dark:border-slate-700/50 text-center ${isToday(day) ? "bg-indigo-50/20 dark:bg-indigo-950/10" : ""}`}
                        >
                          <div
                            className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center text-[10px] font-black transition-all ${getStatusColor(status)} ${isToday(day) ? "ring-2 ring-indigo-500/30" : ""}`}
                          >
                            {status || ""}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <AttendanceLegend t={t} />
      </Card>
    </PdfExporter>
  );
}
