"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  studentActions,
  centerActions,
  teacherActions,
} from "@/freelib/dexie/freedexieaction";
import {
  attendanceActions,
  AttendanceSession,
  AttendanceRecord,
} from "@/freelib/dexie/attendanceDb";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Printer,
  Users,
  Plus,
  Trash2,
  Home,
  Save,
  History,
  ChevronDown,
  Eye,
  Edit3,
  Trash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Student } from "@/freelib/dexie/dbSchema";

export default function AttendancePage() {
  const t = useTranslations("AttendanceRegister");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  // -- State --
  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [sessionId, setSessionId] = useState<string>("");
  const [institution, setInstitution] = useState("");
  const [shift, setShift] = useState<"morning" | "evening">("morning");
  const [currentDate] = useState(new Date().setHours(0, 0, 0, 0));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pastSessions, setPastSessions] = useState<AttendanceSession[]>([]);
  const [availableNames, setAvailableNames] = useState<
    { id: string; name: string }[]
  >([]);

  // -- Initialization --
  useEffect(() => {
    // 1. Auto-detect shift
    const hour = new Date().getHours();
    const detectedShift = hour >= 6 && hour < 12 ? "morning" : "evening";
    setShift(detectedShift);

    // 2. Load center info
    centerActions.getAll().then((centers) => {
      if (centers.length > 0) setInstitution(centers[0].name);
    });

    // 3. Load available students & teachers
    loadAvailableNames();

    // 4. Initial Load for today's detected shift
    syncWithDatabase(currentDate, detectedShift);

    // 5. Load history list
    loadPastSessions();
  }, []);

  // Sync when shift or date changes
  useEffect(() => {
    if (loading) return; // Prevent infinite loops or redundant calls during initial load
    syncWithDatabase(currentDate, shift);
  }, [shift, currentDate]);

  const loadAvailableNames = async () => {
    try {
      const [students, teachers] = await Promise.all([
        studentActions.getAll(),
        teacherActions.getAll(),
      ]);
      const combined = [
        ...students.map((s) => ({ id: s.id, name: s.name })),
        ...teachers.map((t) => ({ id: t.id, name: t.name })),
      ];
      setAvailableNames(combined);
    } catch (error) {
      console.error("Failed to load names:", error);
    }
  };

  const syncWithDatabase = async (
    date: number,
    selectedShift: "morning" | "evening",
  ) => {
    setLoading(true);
    try {
      const { session, records } = await attendanceActions.getDailySession(
        date,
        selectedShift,
      );
      if (session) {
        setSessionId(session.id);
        setInstitution(session.institution);
        setRows(
          records.map((r) => ({
            id: r.id,
            externalId: r.externalId,
            name: r.name,
            morning: r.morning,
            evening: r.evening,
            status: r.status,
            remarks: r.remarks,
          })),
        );
        setMode("view"); // Default to view if session exists
      } else {
        // New session for today/shift
        setSessionId(
          crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        );
        setRows([]); // Start empty for Daily Log
        setMode("edit"); // Default to edit for new session
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPastSessions = async () => {
    const sessions = await attendanceActions.getAllSessions();
    setPastSessions(sessions);
  };

  // -- Actions --
  const handleSave = async () => {
    setLoading(true);
    try {
      const session: AttendanceSession = {
        id: sessionId,
        institution,
        month: new Date(currentDate).toLocaleString(locale, { month: "long" }),
        year: new Date(currentDate).getFullYear().toString(),
        date: currentDate,
        shift,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const records: AttendanceRecord[] = rows
        .filter((r) => r.name || r.status || r.remarks)
        .map((r) => ({
          id: r.id.includes("new-")
            ? crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36)
            : r.id,
          sessionId: sessionId,
          externalId: r.externalId || "",
          name: r.name,
          morning: r.morning || "",
          evening: r.evening || "",
          status: r.status,
          remarks: r.remarks,
          updatedAt: Date.now(),
        }));

      await attendanceActions.saveSession(session, records);
      toast.success(isRtl ? "تم حفظ السجل" : "Attendance saved");
      loadPastSessions();
      setMode("view");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error(isRtl ? "فشل الحفظ" : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setRows([]);
      if (sessionId) {
        await attendanceActions.clearSessionRecords(sessionId);
      }
      toast.info(isRtl ? "تم مسح جميع السجلات" : "All records cleared");
    } catch (error) {
      toast.error("Error clearing records");
    }
  };

  const addRow = (selectedPerson?: { id: string; name: string }) => {
    const newRow = {
      id: `new-${Date.now()}`,
      externalId: selectedPerson?.id || "",
      name: selectedPerson?.name || "",
      morning: "",
      evening: "",
      status: "P", // Default to present for new entries
      remarks: "",
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: string, value: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const loadAllMembers = async () => {
    setLoading(true);
    try {
      const existingIds = new Set(
        rows.map((r) => r.externalId).filter((id) => !!id),
      );
      const newRows = [...rows];

      availableNames.forEach((p) => {
        if (!existingIds.has(p.id)) {
          newRows.push({
            id: `new-${p.id}-${Date.now()}`,
            externalId: p.id,
            name: p.name,
            morning: "",
            evening: "",
            status: "P",
            remarks: "",
          });
        }
      });

      setRows(newRows);
      toast.info(
        isRtl
          ? `تمت إضافة ${availableNames.length - existingIds.size} اسماً`
          : `Added ${availableNames.length - existingIds.size} names`,
      );
    } catch (error) {
      toast.error("Failed to load all members");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = (text: string) => {
    const names = text
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => !!n);
    if (names.length === 0) return;

    const newRows = [...rows];
    names.forEach((name) => {
      newRows.push({
        id: `bulk-${Date.now()}-${Math.random()}`,
        externalId: "",
        name: name,
        morning: "",
        evening: "",
        status: "P",
        remarks: "",
      });
    });
    setRows(newRows);
    toast.success(
      isRtl ? `تمت إضافة ${names.length} اسماً` : `Added ${names.length} names`,
    );
  };

  const formattedDate = new Date(currentDate).toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 print:bg-white print:p-0"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* --- Action Bar --- */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-wrap gap-4 items-center justify-between print:hidden">
        {/* Left Side (End in RTL): Actions */}
        <div className="flex flex-wrap gap-3 order-2 md:order-1">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="gap-2 rounded-full"
          >
            <Printer size={18} />
            {t("print")}
          </Button>

          {mode === "edit" && (
            <>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Save size={18} />
                {isRtl ? "حفظ" : "Save"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2 rounded-full"
                  >
                    <Trash size={16} />
                    {t("deleteAll")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir={isRtl ? "rtl" : "ltr"}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("confirmDeleteAll")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("confirmDeleteAllDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel>
                      {isRtl ? "إلغاء" : "Cancel"}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAll}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isRtl ? "حذف" : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          <DropdownMenu dir={isRtl ? "rtl" : "ltr"}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <History size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuLabel>
                {t("history") || (isRtl ? "سجلات سابقة" : "History")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {pastSessions.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => syncWithDatabase(s.date, s.shift)}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">
                      {new Date(s.date).toLocaleDateString(locale)}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {t(s.shift)}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Side (Start in RTL): Navigation & Modes */}
        <div className="flex items-center gap-4 order-1 md:order-2">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
            <Button
              variant={mode === "view" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("view")}
              className={`rounded-full gap-2 ${mode === "view" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
            >
              <Eye size={16} /> {t("viewMode")}
            </Button>
            <Button
              variant={mode === "edit" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("edit")}
              className={`rounded-full gap-2 ${mode === "edit" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
            >
              <Edit3 size={16} /> {t("editMode")}
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <Home size={18} />
          </Button>
        </div>
      </div>

      {/* --- Attendance Register Card --- */}
      <Card className="max-w-6xl mx-auto shadow-2xl border-none print:shadow-none print:bg-white overflow-hidden bg-white dark:bg-slate-900">
        {/* Card Header */}
        <div className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-start space-y-1">
              <h2 className="text-3xl font-black uppercase text-slate-900 dark:text-white print:text-black">
                {t("title")}
              </h2>
              <p className="text-indigo-600 font-bold tracking-widest text-sm uppercase">
                {institution}
              </p>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                  {isRtl ? "التاريخ" : "Date"}
                </p>
                <p className="text-xl font-black text-slate-800 dark:text-white print:text-black">
                  {formattedDate}
                </p>
              </div>
              <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block" />
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                  {isRtl ? "الفترة" : "Shift"}
                </p>
                <p className="text-xl font-black text-indigo-600 uppercase">
                  {t(shift)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Entry Form (Edit Mode) --- */}
        {mode === "edit" && (
          <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/5 border-b dark:border-slate-800 print:hidden flex flex-wrap items-center gap-6">
            {/* Add Name Dropdown (Right side in RTL) */}
            <div className="space-y-2 flex-1 min-w-[300px]">
              <Label className="text-xs font-bold uppercase text-slate-500">
                {t("addName")}
              </Label>
              <Select
                onValueChange={(val) => {
                  const person = availableNames.find((p) => p.id === val);
                  if (person) addRow(person);
                }}
              >
                <SelectTrigger className="w-full bg-white dark:bg-slate-950 border-slate-200 hover:border-indigo-400 transition-colors">
                  <SelectValue
                    placeholder={
                      isRtl ? "اختر من القائمة..." : "Select student/teacher..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableNames.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs text-indigo-600"
                    onClick={() => addRow()}
                  >
                    <Plus size={12} className="mr-2" />{" "}
                    {isRtl ? "إضافة يدوي" : "Add Manually"}
                  </Button>
                </SelectContent>
              </Select>
            </div>

            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block self-end mb-2" />

            {/* Actions (Load All / Bulk) */}
            <div className="flex items-center gap-2 self-end mb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAllMembers}
                className="rounded-full gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Users size={14} /> {t("uploadNames")}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 border-slate-200"
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

            {/* Shift Toggle (Left side in RTL) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">
                {isRtl ? "الفترة" : "Shift"}
              </Label>
              <div className="flex items-center gap-2 h-10 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                <button
                  onClick={() => setShift("morning")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded transition-all ${shift === "morning" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-indigo-600"}`}
                >
                  {t("morning")}
                </button>
                <button
                  onClick={() => setShift("evening")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded transition-all ${shift === "evening" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-indigo-600"}`}
                >
                  {t("evening")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Register Table --- */}
        <div className="overflow-x-auto min-h-[400px]">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50 print:bg-slate-100">
                <TableHead className="w-16 text-center font-bold">#</TableHead>
                <TableHead className="min-w-[250px] font-bold">
                  {t("columns.name")}
                </TableHead>
                <TableHead className="w-48 text-center font-bold">
                  {t("columns.status")}
                </TableHead>
                <TableHead className="font-bold">
                  {t("columns.remarks")}
                </TableHead>
                {mode === "edit" && (
                  <TableHead className="w-12 print:hidden"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-slate-400 italic"
                  >
                    {mode === "edit"
                      ? isRtl
                        ? "أضف أسماء لبدء التحضير"
                        : "Add names to start marking"
                      : isRtl
                        ? "لا توجد سجلات بعد"
                        : "No records yet"}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/5 transition-colors border-b dark:border-slate-800 print:border-black"
                  >
                    <TableCell className="text-center font-medium text-slate-400">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="p-0 border-e dark:border-slate-800 print:border-black">
                      {mode === "edit" ? (
                        <Select
                          value={row.externalId}
                          onValueChange={(val) => {
                            const person = availableNames.find(
                              (p) => p.id === val,
                            );
                            if (person) {
                              updateRow(row.id, "externalId", person.id);
                              updateRow(row.id, "name", person.name);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full h-12 border-0 rounded-none focus:ring-0 px-4 bg-transparent">
                            <SelectValue
                              placeholder={isRtl ? "اختر..." : "Select..."}
                            >
                              {row.name}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableNames.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="px-4 py-3 block font-semibold text-slate-800 dark:text-slate-200">
                          {row.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="p-0">
                      <div className="flex justify-center items-center h-12 gap-2 px-1">
                        <StatusBox
                          label="P"
                          value="P"
                          current={row.status}
                          disabled={mode === "view"}
                          onClick={() =>
                            updateRow(
                              row.id,
                              "status",
                              row.status === "P" ? "" : "P",
                            )
                          }
                        />
                        <StatusBox
                          label="A"
                          value="A"
                          current={row.status}
                          disabled={mode === "view"}
                          onClick={() =>
                            updateRow(
                              row.id,
                              "status",
                              row.status === "A" ? "" : "A",
                            )
                          }
                        />
                        <StatusBox
                          label="L"
                          value="L"
                          current={row.status}
                          disabled={mode === "view"}
                          onClick={() =>
                            updateRow(
                              row.id,
                              "status",
                              row.status === "L" ? "" : "L",
                            )
                          }
                        />
                        <StatusBox
                          label="LV"
                          value="LV"
                          current={row.status}
                          disabled={mode === "view"}
                          onClick={() =>
                            updateRow(
                              row.id,
                              "status",
                              row.status === "LV" ? "" : "LV",
                            )
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="p-0">
                      {mode === "edit" ? (
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) =>
                            updateRow(row.id, "remarks", e.target.value)
                          }
                          className="w-full h-12 px-4 bg-transparent focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500/30 font-light text-sm"
                        />
                      ) : (
                        <span className="px-4 py-3 block text-sm text-slate-500">
                          {row.remarks}
                        </span>
                      )}
                    </TableCell>
                    {mode === "edit" && (
                      <TableCell className="p-0 print:hidden text-center">
                        <button
                          onClick={() => removeRow(row.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-t dark:border-slate-800 flex flex-wrap gap-6 text-[10px] items-center print:bg-transparent print:border-black">
          <span className="font-bold uppercase text-slate-400">
            {t("legend")}:
          </span>
          {["present", "absent", "late", "leave"].map((st) => (
            <div key={st} className="flex items-center gap-1.5 capitalize">
              <span
                className={`w-4 h-4 rounded-sm border flex items-center justify-center text-[8px] ${st === "present" ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300"}`}
              >
                {st.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium text-slate-600 dark:text-slate-400 print:text-black">
                {t(`status.${st}`)}
              </span>
            </div>
          ))}
        </div>

        {/* Footer for print */}
        <div className="hidden print:block p-12 mt-auto border-t border-black">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="border-b border-black border-dotted pb-2 flex justify-between">
                <span className="font-bold">Signature:</span>
              </div>
              <div className="border-b border-black border-dotted pb-2 flex justify-between">
                <span className="font-bold">Date:</span>
              </div>
            </div>
            <div className="flex flex-col justify-end items-end text-[10px] italic opacity-50">
              Center Management System - Daily Attendance Report
            </div>
          </div>
        </div>
      </Card>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
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
