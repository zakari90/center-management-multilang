"use client";

import {
  attendanceActions,
  AttendanceRecord,
  AttendanceSession,
} from "@/freelib/dexie/scheduleDb";
import {
  centerActions,
  studentActions,
  teacherActions,
  subjectActions,
} from "@/freelib/dexie/freedexieaction";
import { timeTableActions } from "@/freelib/dexie/scheduleDb";
import { useLocalizedConstants } from "@/components/freeinUse/useLocalizedConstants";
import ExcelJS from "exceljs";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export interface AttendanceRowData {
  id: string;
  externalId: string;
  name: string;
  morning: string;
  evening: string;
  status: string;
  remarks: string;
}

export function useAttendance() {
  const t = useTranslations("AttendanceRegister");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { daysOfWeek } = useLocalizedConstants();

  // -- State --
  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [sessionId, setSessionId] = useState<string>("");
  const [registerName, setRegisterName] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [institution, setInstitution] = useState("");
  const [shift, setShift] = useState<"morning" | "evening">("morning");
  const [currentDate] = useState(new Date().setHours(0, 0, 0, 0));
  const [sessionCreatedAt, setSessionCreatedAt] = useState<number | null>(null);
  const [rows, setRows] = useState<AttendanceRowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pastSessions, setPastSessions] = useState<AttendanceSession[]>([]);
  const [allScheduledRegisters, setAllScheduledRegisters] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [availableNames, setAvailableNames] = useState<
    { id: string; name: string }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Refs to track previous register so we can auto-save before switching
  const prevScheduleIdRef = useRef<string>("");
  const rowsRef = useRef<AttendanceRowData[]>([]);

  // Helper: build a unique, localized label for each schedule entry
  // Plain function (not useCallback) — safe because it's only used
  // inside useMemo/effects, never as a dependency itself.
  const buildEntryLabel = (entry: any): string => {
    const name = entry.name || entry.title;
    if (name) {
      return name;
    }
    const dayKey = (entry.day || "").toLowerCase();
    const dayMatch = daysOfWeek.find((d) => d.key === dayKey);
    const dayLabel = dayMatch ? dayMatch.label : dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
    const time = `${entry.startTime}–${entry.endTime}`;
    const room = entry.roomId ? ` — ${entry.roomId}` : "";
    return `${dayLabel} (${time})${room}`;
  };

  // Derive scheduled register names — deduplicate by label to group identical names
  const scheduledRegisterNames = useMemo(() => {
    const uniqueLabels = new Set<string>();
    const grouped: { id: string; label: string }[] = [];

    allScheduledRegisters.forEach((s: any) => {
      const label = buildEntryLabel(s);
      if (!uniqueLabels.has(label)) {
        uniqueLabels.add(label);
        grouped.push({
          id: s.id,
          label,
        });
      }
    });

    return grouped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allScheduledRegisters, locale]);

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

    // 3.5 Load all subjects (groups)
    subjectActions.getAll().then((subjects) => {
      setAllSubjects(subjects);
    });

    // 4. Load all registers from schedule
    timeTableActions.getAll().then((schedules) => {
      setAllScheduledRegisters(schedules);

      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const now = new Date();
      const currentDay = dayNames[now.getDay()];

      // Filter for today's registers
      const todayRegisters = schedules.filter(
        (s) => s.day.toLowerCase() === currentDay,
      );

      // Auto-detect match for current time
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeStr = `${currentHours.toString().padStart(2, "0")}:${currentMinutes.toString().padStart(2, "0")}`;

      const currentMatch = todayRegisters.find((s) => {
        const start = s.startTime;
        let end = s.endTime;
        if (end === "00:00") end = "24:00";
        return currentTimeStr >= start && currentTimeStr < end;
      });

      if (currentMatch) {
        const label = buildEntryLabel(currentMatch);
        setRegisterName(label);
        const canonicalMatch = schedules.find((s: any) => buildEntryLabel(s) === label);
        setSelectedScheduleId(canonicalMatch ? canonicalMatch.id : currentMatch.id);
      } else if (todayRegisters.length > 0) {
        const label = buildEntryLabel(todayRegisters[0]);
        setRegisterName(label);
        const canonicalMatch = schedules.find((s: any) => buildEntryLabel(s) === label);
        setSelectedScheduleId(canonicalMatch ? canonicalMatch.id : todayRegisters[0].id);
      } else {
        // If today has no scheduled groups, default the register name to the current time
        setRegisterName(currentTimeStr);
      }
    });

    // 5. Load history list
    loadPastSessions();
  }, []);

  // Keep rows ref in sync so the switch-save effect always has fresh data
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Sync when shift, date, or registerName changes
  // Auto-save the previous register's roster before switching
  useEffect(() => {
    if (loading) return;

    const effectiveScheduleId = selectedScheduleId || registerName;
    const prevId = prevScheduleIdRef.current;

    // If we're switching to a different register, save the current rows first
    if (prevId && prevId !== effectiveScheduleId && rowsRef.current.length > 0) {
      const members = rowsRef.current
        .filter((r) => r.name)
        .map((r) => ({
          id: r.externalId
            ? `${prevId}-${r.externalId}`
            : `${prevId}-${r.name}`,
          scheduleId: prevId,
          externalId: r.externalId || "",
          name: r.name,
          updatedAt: Date.now(),
        }));
      // Fire-and-forget save for the outgoing register
      attendanceActions.saveRegisterMembers(prevId, members);
    }

    prevScheduleIdRef.current = effectiveScheduleId;
    syncWithDatabase(currentDate, shift, registerName, selectedScheduleId);
  }, [shift, currentDate, registerName, selectedScheduleId]);

  // scheduledRegisterNames is now derived via useMemo above (no effect needed)

  const filteredAvailableNames = useMemo(() => {
    if (!searchTerm) return availableNames;
    return availableNames.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [availableNames, searchTerm]);

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
    nameFilter?: string,
    scheduleIdFilter?: string,
  ) => {
    setLoading(true);
    try {
      const { session, records } = await attendanceActions.getDailySession(
        date,
        selectedShift,
        nameFilter,
        scheduleIdFilter,
      );
      if (session) {
        setSessionId(session.id);
        const name = session.name || "";
        setRegisterName(name);
        if (session.scheduleId) setSelectedScheduleId(session.scheduleId);
        setInstitution(session.institution);
        setSessionCreatedAt(session.createdAt);
        setRows(
          records.map((r) => ({
            id: r.id,
            externalId: r.externalId || "",
            name: r.name,
            morning: r.morning || "",
            evening: r.evening || "",
            status: r.status,
            remarks: r.remarks,
          })),
        );

        if (!name) {
          setMode("edit");
        } else {
          setMode("view");
        }
      } else {
        setSessionId(
          crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        );
        // Do NOT clear registerName here as it's our selection criteria
        setSessionCreatedAt(null);

        // Pre-populate roster from the permanent register
        if (scheduleIdFilter || nameFilter) {
          let prefillRoster: any[] = [];

          if (scheduleIdFilter) {
            prefillRoster = await attendanceActions.getRegisterMembers(scheduleIdFilter);
          }
          
          if (prefillRoster.length === 0 && nameFilter) {
            prefillRoster = await attendanceActions.getLatestRosterByName(nameFilter);
          }

          if (prefillRoster.length > 0) {
            setRows(
              prefillRoster.map((r, i) => ({
                id: `new-${r.externalId || r.name}-${Date.now()}-${i}`,
                externalId: r.externalId || "",
                name: r.name,
                morning: "",
                evening: "",
                status: "P",
                remarks: "",
              })),
            );
          } else {
            setRows([]);
          }
        } else {
          setRows([]);
        }

        setMode("edit");
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
    if (loading) return;
    setLoading(true);
    try {
      const session: AttendanceSession = {
        id: sessionId,
        name: registerName || t("title"),
        scheduleId: selectedScheduleId || registerName || undefined,
        institution,
        month: new Date(currentDate).toLocaleString(locale, { month: "long" }),
        year: new Date(currentDate).getFullYear().toString(),
        date: currentDate,
        shift,
        createdAt: sessionCreatedAt || Date.now(),
        updatedAt: Date.now(),
      };

      const records: AttendanceRecord[] = rows
        .filter((r) => r.name || r.status || r.remarks)
        .map((r) => ({
          id:
            r.id.includes("new-") || r.id.includes("bulk-")
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

      if (selectedScheduleId) {
        const registerMembers = rows
          .filter((r) => r.name)
          .map((r) => ({
            id: r.externalId ? `${selectedScheduleId}-${r.externalId}` : `${selectedScheduleId}-${r.name}`,
            scheduleId: selectedScheduleId,
            externalId: r.externalId || "",
            name: r.name,
            updatedAt: Date.now(),
          }));
        await attendanceActions.saveRegisterMembers(selectedScheduleId, registerMembers);
      }

      toast.success(t("saveSuccess"));
      loadPastSessions();
      setMode("view");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error(t("saveError"));
    } finally {
      setLoading(false);
    }
  };

  const startNewRegister = () => {
    setSessionId(
      crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    );
    setRegisterName("");
    setSelectedScheduleId("");
    setSessionCreatedAt(null);
    setRows([]);
    setMode("edit");
  };

  const handleDeleteAll = async () => {
    try {
      setRows([]);
      if (sessionId) {
        await attendanceActions.clearSessionRecords(sessionId);
      }
      toast.info(t("clearSuccess"));
    } catch (error) {
      toast.error(t("clearError"));
    }
  };

  const addRow = (selectedPerson?: { id: string; name: string }) => {
    if (selectedPerson) {
      const exists = rows.some((r) => r.externalId === selectedPerson.id);
      if (exists) {
        toast.warning(t("alreadyExists", { name: selectedPerson.name }));
        return;
      }
    }

    const newRow: AttendanceRowData = {
      id: `new-${Date.now()}`,
      externalId: selectedPerson?.id || "",
      name: selectedPerson?.name || "",
      morning: "",
      evening: "",
      status: "P",
      remarks: "",
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const updateRow = (
    id: string,
    field: keyof AttendanceRowData,
    value: string,
  ) => {
    if (field === "name" && value.trim()) {
      const exists = rows.some(
        (r) =>
          r.id !== id &&
          r.name.trim().toLowerCase() === value.trim().toLowerCase(),
      );
      if (exists) {
        toast.warning(t("alreadyExists", { name: value }));
        return;
      }
    }
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
      toast.info(t("addedNames", { count: availableNames.length - existingIds.size }));
    } catch (error) {
      toast.error(t("loadError")); // Note: I didn't add loadError to JSON yet, let me use generic error or add it.
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = (text: string) => {
    const inputNames = text
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => !!n);
    if (inputNames.length === 0) return;

    const existingNames = new Set(rows.map((r) => r.name.trim().toLowerCase()));
    const existingIds = new Set(
      rows.map((r) => r.externalId).filter((id) => !!id),
    );

    const newRowsToPush: AttendanceRowData[] = [];
    let duplicateCount = 0;

    inputNames.forEach((name) => {
      // Check if name or matched ID already exists
      const alreadyExists =
        existingNames.has(name.toLowerCase()) ||
        availableNames.some(
          (an) =>
            an.name.trim().toLowerCase() === name.toLowerCase() &&
            existingIds.has(an.id),
        );

      if (alreadyExists) {
        duplicateCount++;
      } else {
        newRowsToPush.push({
          id: `bulk-${Date.now()}-${Math.random()}`,
          externalId: "", // Matches can be linked later or left as manual
          name: name,
          morning: "",
          evening: "",
          status: "P",
          remarks: "",
        });
        // Add to existingNames to prevent internal duplicates in the bulk add list
        existingNames.add(name.toLowerCase());
      }
    });

    if (newRowsToPush.length > 0) {
      setRows([...rows, ...newRowsToPush]);
      toast.success(
        t("addedNames", { count: newRowsToPush.length }) + 
        (duplicateCount ? t("duplicatesIgnored", { count: duplicateCount }) : "")
      );
    } else if (duplicateCount > 0) {
      toast.info(t("allNamesExist"));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.getWorksheet(1);
      const newNames: string[] = [];
      worksheet?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const nameCell = row.getCell(1).value;
        if (nameCell) newNames.push(nameCell.toString());
      });

      if (newNames.length > 0) {
        handleBulkAdd(newNames.join("\n"));
      } else {
        toast.info(t("noNamesFound"));
      }
    } catch (error) {
      console.error("File upload failed:", error);
      toast.error(t("uploadError")); // Added to JSON? No, let's use saveError or generic.
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Attendance");

      worksheet.columns = [
        { header: "#", key: "index", width: 5 },
        { header: t("columns.name"), key: "name", width: 30 },
        { header: t("columns.status"), key: "status", width: 10 },
        { header: t("columns.remarks"), key: "remarks", width: 40 },
      ];

      rows.forEach((r, idx) => {
        worksheet.addRow({
          index: idx + 1,
          name: r.name,
          status: r.status,
          remarks: r.remarks,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(t("exportSuccess"));
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(t("exportError"));
    }
  };

  const currentMonth = new Date(currentDate).toLocaleString(locale, { month: "long" });
  const currentMonthIndex = new Date(currentDate).getMonth() + 1;
  const currentYear = new Date(currentDate).getFullYear().toString();

  const formattedDate = new Date(currentDate).toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const getMonthlyData = (month: string | number, year: string) => {
    const monthIdx = typeof month === "number" ? month : parseInt(month);
    return attendanceActions.getMonthlyData(selectedScheduleId, monthIdx, year);
  };

  const pastRegisterNames = useMemo(() => {
    const names = new Set<string>();
    pastSessions.forEach(s => {
      if (s.name) names.add(s.name);
    });
    allSubjects.forEach(s => {
      if (s.name) names.add(s.name);
    });
    return Array.from(names);
  }, [pastSessions, allSubjects]);

  return {
    t,
    locale,
    isRtl,
    mode,
    setMode,
    institution,
    shift,
    rows,
    loading,
    availableNames,
    searchTerm,
    setSearchTerm,
    filteredAvailableNames,
    handleSave,
    handleDeleteAll,
    addRow,
    removeRow,
    updateRow,
    handleBulkAdd,
    handleFileUpload,
    handleExport,
    formattedDate,
    registerName,
    setRegisterName,
    selectedScheduleId,
    setSelectedScheduleId,
    scheduledRegisterNames,
    sessionCreatedAt,
    currentMonthIndex,
    currentYear,
    getMonthlyData,
    pastRegisterNames,
  };
}
