"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { studentActions, centerActions } from "@/freelib/dexie/freedexieaction";
import { attendanceActions, AttendanceSession, AttendanceRecord } from "@/freelib/dexie/attendanceDb";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Printer, Users, Plus, Trash2, Home, Save, History, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Student } from "@/freelib/dexie/dbSchema";
import { toast } from "sonner";

export default function AttendancePage() {
  const t = useTranslations("AttendanceRegister");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  
  const [sessionId, setSessionId] = useState<string>("");
  const [institution, setInstitution] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pastSessions, setPastSessions] = useState<AttendanceSession[]>([]);

  // Initialize with some blank rows
  useEffect(() => {
    const initialRows = Array.from({ length: 15 }, (_, i) => ({
      id: `blank-${i}`,
      date: "",
      name: "",
      rollNumber: "",
      department: "",
      status: "",
      remarks: "",
    }));
    setRows(initialRows);
    setSessionId(crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());

    // Try to load center name
    centerActions.getAll().then((centers) => {
      if (centers.length > 0) {
        setInstitution(centers[0].name);
      }
    });

    // Auto-set current month
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    setMonth(monthNames[new Date().getMonth()]);

    // Load past sessions
    loadPastSessions();
  }, []);

  const loadPastSessions = async () => {
    const sessions = await attendanceActions.getAllSessions();
    setPastSessions(sessions);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const session: AttendanceSession = {
        id: sessionId,
        institution,
        month,
        year,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const records: AttendanceRecord[] = rows
        .filter(r => r.name || r.date) // Only save rows with some data
        .map(r => ({
          id: r.id.startsWith("blank-") ? crypto.randomUUID() : r.id,
          sessionId: sessionId,
          studentId: r.studentId || "",
          studentName: r.name,
          rollNumber: r.rollNumber,
          department: r.department,
          status: r.status,
          remarks: r.remarks,
          updatedAt: Date.now(),
        }));

      await attendanceActions.saveSession(session, records);
      toast.success(isRtl ? "تم حفظ السجل بنجاح" : "Attendance record saved successfully");
      loadPastSessions();
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast.error(isRtl ? "فشل حفظ السجل" : "Failed to save attendance record");
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (id: string) => {
    setLoading(true);
    try {
      const { session, records } = await attendanceActions.getSession(id);
      if (session) {
        setSessionId(session.id);
        setInstitution(session.institution);
        setMonth(session.month);
        setYear(session.year);
        
        const loadedRows = records.map(r => ({
          id: r.id,
          studentId: r.studentId,
          date: "", // Date is usually per-day, but records are snapshots
          name: r.studentName,
          rollNumber: r.rollNumber,
          department: r.department,
          status: r.status,
          remarks: r.remarks,
        }));
        
        // Ensure at least some blank rows
        if (loadedRows.length < 15) {
          const blanks = Array.from({ length: 15 - loadedRows.length }, (_, i) => ({
            id: `blank-${Date.now()}-${i}`,
            date: "",
            name: "",
            rollNumber: "",
            department: "",
            status: "",
            remarks: "",
          }));
          setRows([...loadedRows, ...blanks]);
        } else {
          setRows(loadedRows);
        }
        
        toast.success(isRtl ? "تم تحميل السجل" : "Session loaded");
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = () => {
    setSessionId(crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
    const initialRows = Array.from({ length: 15 }, (_, i) => ({
      id: `blank-${i}`,
      date: "",
      name: "",
      rollNumber: "",
      department: "",
      status: "",
      remarks: "",
    }));
    setRows(initialRows);
    toast.info(isRtl ? "بدء سجل جديد" : "New session started");
  };

  const loadFromDatabase = async () => {
    setLoading(true);
    try {
      const students = await studentActions.getAll();
      const studentRows = students.map((s: Student) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : `db-${s.id}-${Date.now()}`,
        studentId: s.id,
        date: "",
        name: s.name,
        rollNumber: s.id.slice(0, 8),
        department: s.grade || "",
        status: "",
        remarks: "",
      }));
      
      // Keep previous non-blank data if any? No, replace for clarity.
      if (studentRows.length < 15) {
        const blanks = Array.from({ length: 15 - studentRows.length }, (_, i) => ({
          id: `blank-${Date.now()}-${i}`,
          date: "",
          name: "",
          rollNumber: "",
          department: "",
          status: "",
          remarks: "",
        }));
        setRows([...studentRows, ...blanks]);
      } else {
        setRows(studentRows);
      }
      toast.success(isRtl ? "تم تحميل قائمة الطلاب" : "Students loaded from database");
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: `blank-${Date.now()}`,
        date: "",
        name: "",
        rollNumber: "",
        department: "",
        status: "",
        remarks: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: string, value: string) => {
    setRows(
      rows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 print:bg-white print:p-0" dir={isRtl ? "rtl" : "ltr"}>
      {/* Action Bar - Hidden on Print */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-wrap gap-4 items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <Home size={18} />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t("title")}</h1>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <DropdownMenu dir={isRtl ? "rtl" : "ltr"}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <History size={18} />
                {isRtl ? "السجلات السابقة" : "History"}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[250px]">
              <DropdownMenuLabel>{isRtl ? "الجلسات الأخيرة" : "Recent Sessions"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={createNewSession}>
                <Plus size={14} className="mr-2 rtl:ml-2 rtl:mr-0" />
                {isRtl ? "سجل جديد" : "New Session"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {pastSessions.length === 0 ? (
                <div className="p-2 text-xs text-center text-muted-foreground">
                  {isRtl ? "لا توجد سجلات محفوظة" : "No saved sessions"}
                </div>
              ) : (
                pastSessions.map(s => (
                  <DropdownMenuItem key={s.id} onClick={() => loadSession(s.id)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{s.institution || "Unnamed"}</span>
                      <span className="text-[10px] text-muted-foreground">{s.month} {s.year}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={loadFromDatabase} disabled={loading} className="gap-2">
            <Users size={18} />
            {t("loadStudents")}
          </Button>
          <Button variant="outline" onClick={addRow} className="gap-2">
            <Plus size={18} />
            {t("blankRows")}
          </Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200">
            <Save size={18} />
            {isRtl ? "حفظ" : "Save"}
          </Button>
          <Button onClick={handlePrint} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Printer size={18} />
            {t("print")}
          </Button>
        </div>
      </div>

      {/* Attendance Register Card */}
      <Card className="max-w-6xl mx-auto shadow-xl border-none print:shadow-none print:border-none overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
        {/* Register Header */}
        <div className="p-8 border-b dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
              {t("title")}
            </h2>
            <div className="h-1 w-24 bg-indigo-600 mx-auto print:bg-black"></div>
            <p className="text-[10px] text-muted-foreground print:hidden">ID: {sessionId}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 print:text-black">
                {t("institution")}
              </label>
              <Input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Name of school / Company"
                className="font-semibold text-lg border-0 border-b rounded-none focus-visible:ring-0 bg-transparent px-0 border-slate-200 dark:border-slate-700 print:border-black"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 print:text-black">
                {t("month")}
              </label>
              <Input
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="e.g. September"
                className="font-semibold text-lg border-0 border-b rounded-none focus-visible:ring-0 bg-transparent px-0 border-slate-200 dark:border-slate-700 print:border-black"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 print:text-black">
                {t("year")}
              </label>
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                className="font-semibold text-lg border-0 border-b rounded-none focus-visible:ring-0 bg-transparent px-0 border-slate-200 dark:border-slate-700 print:border-black"
              />
            </div>
          </div>
        </div>

        {/* Register Table */}
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 print:bg-slate-100">
                <TableHead className="w-24 font-bold text-slate-900 dark:text-white border-e print:border-black print:text-black">{t("columns.date")}</TableHead>
                <TableHead className="min-w-[200px] font-bold text-slate-900 dark:text-white border-e print:border-black print:text-black">{t("columns.name")}</TableHead>
                <TableHead className="w-32 font-bold text-slate-900 dark:text-white border-e print:border-black print:text-black">{t("columns.rollNumber")}</TableHead>
                <TableHead className="w-40 font-bold text-slate-900 dark:text-white border-e print:border-black print:text-black">{t("columns.department")}</TableHead>
                <TableHead className="w-48 font-bold text-slate-900 dark:text-white border-e print:border-black print:text-black text-center">{t("columns.status")}</TableHead>
                <TableHead className="font-bold text-slate-900 dark:text-white print:text-black">{t("columns.remarks")}</TableHead>
                <TableHead className="w-12 print:hidden"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors border-b dark:border-slate-800 print:border-black">
                  <TableCell className="p-0 border-e dark:border-slate-800 print:border-black">
                    <input
                      type="text"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, "date", e.target.value)}
                      className="w-full h-12 bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500/30 print:focus:ring-0"
                    />
                  </TableCell>
                  <TableCell className="p-0 border-e dark:border-slate-800 print:border-black">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, "name", e.target.value)}
                      className="w-full h-12 px-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500/30 print:focus:ring-0"
                    />
                  </TableCell>
                  <TableCell className="p-0 border-e dark:border-slate-800 print:border-black">
                    <input
                      type="text"
                      value={row.rollNumber}
                      onChange={(e) => updateRow(row.id, "rollNumber", e.target.value)}
                      className="w-full h-12 text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500/30 print:focus:ring-0"
                    />
                  </TableCell>
                  <TableCell className="p-0 border-e dark:border-slate-800 print:border-black">
                    <input
                      type="text"
                      value={row.department}
                      onChange={(e) => updateRow(row.id, "department", e.target.value)}
                      className="w-full h-12 text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500/30 print:focus:ring-0"
                    />
                  </TableCell>
                  <TableCell className="p-0 border-e dark:border-slate-800 print:border-black">
                    <div className="flex justify-center items-center h-12 gap-2 px-1">
                       <StatusBox label="P" value="P" current={row.status} onClick={() => updateRow(row.id, "status", row.status === "P" ? "" : "P")} />
                       <StatusBox label="A" value="A" current={row.status} onClick={() => updateRow(row.id, "status", row.status === "A" ? "" : "A")} />
                       <StatusBox label="L" value="L" current={row.status} onClick={() => updateRow(row.id, "status", row.status === "L" ? "" : "L")} />
                       <StatusBox label="LV" value="LV" current={row.status} onClick={() => updateRow(row.id, "status", row.status === "LV" ? "" : "LV")} />
                    </div>
                  </TableCell>
                  <TableCell className="p-0">
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={(e) => updateRow(row.id, "remarks", e.target.value)}
                      className="w-full h-12 px-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500/30 print:focus:ring-0"
                    />
                  </TableCell>
                  <TableCell className="p-0 print:hidden text-center">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                      title="Remove row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer info for print */}
        <div className="hidden print:block p-8 mt-auto">
          <div className="grid grid-cols-2 gap-8 border-t border-black pt-8">
            <div className="space-y-6">
              <div className="flex gap-2 items-end">
                <span className="font-bold whitespace-nowrap">Teacher/Supervisor Signature:</span>
                <div className="w-full border-b border-black border-dotted"></div>
              </div>
              <div className="flex gap-2 items-end">
                <span className="font-bold whitespace-nowrap">Date:</span>
                <div className="w-full border-b border-black border-dotted"></div>
              </div>
            </div>
            <div className="flex flex-col justify-end items-end text-[10px] text-slate-500 print:text-black italic">
              Generated by Center Management System
            </div>
          </div>
        </div>
      </Card>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            background-color: white !important;
          }
          .dark {
            color-scheme: light;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

function StatusBox({ label, value, current, onClick }: { label: string, value: string, current: string, onClick: () => void }) {
  const active = current === value;
  return (
    <div 
      className="flex flex-col items-center cursor-pointer group print:cursor-default"
      onClick={onClick}
    >
      <span className={`text-[8px] uppercase font-bold transition-colors ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 print:text-black'}`}>
        {label}
      </span>
      <div className={`w-4 h-4 border rounded-sm transition-all ${
        active 
          ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.4)]' 
          : 'border-slate-300 dark:border-slate-600 print:border-black group-hover:border-indigo-400'
      }`}>
        {active && (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full p-0.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </div>
  )
}
