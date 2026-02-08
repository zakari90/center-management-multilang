/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
// import axios from 'axios' // ✅ Commented out - using local DB
import {
  Clock,
  Eye,
  Loader2,
  MapPin,
  Trash2,
  User,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";
import ExcelJS from "exceljs";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocalizedConstants } from "../useLocalizedConstants";
import {
  scheduleActions,
  teacherActions,
  subjectActions,
  centerActions,
  teacherSubjectActions,
} from "@/lib/dexie/dexieActions";
import { generateObjectId } from "@/lib/utils/generateObjectId";
import { useAuth } from "@/context/authContext";
import { EntitySyncControls } from "@/components/EntitySyncControls";

interface Teacher {
  id: string;
  name: string;
  weeklySchedule?: any;
}

interface Subject {
  id: string;
  name: string;
  grade: string;
}

interface TeacherSubject {
  teacherId: string;
  subjectId: string;
}

interface ScheduleSlot {
  id?: string;
  day: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  subjectId: string;
  roomId: string;
}

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
];

const parseWeeklySchedule = (schedule: any): any[] => {
  if (!schedule) return [];
  if (Array.isArray(schedule)) {
    return schedule.map((slot) =>
      typeof slot === "string" ? JSON.parse(slot) : slot,
    );
  }
  if (typeof schedule === "string") {
    try {
      return JSON.parse(schedule);
    } catch {
      return [];
    }
  }
  return [];
};

const isTeacherAvailable = (
  teacher: any,
  day: string,
  startTime: string,
  endTime: string,
): boolean => {
  const availability = parseWeeklySchedule(teacher?.weeklySchedule);
  if (!availability || availability.length === 0) return false;

  return availability.some((slot) => {
    return (
      slot.day === day && startTime >= slot.startTime && endTime <= slot.endTime
    );
  });
};

export default function TimetableManagement({
  centerId,
  refreshKey,
  onScheduleChangeAction,
  readOnly = false,
}: {
  centerId?: string;
  refreshKey?: number;
  onScheduleChangeAction?: () => void;
  readOnly?: boolean;
}) {
  // Translate using the 'TimetableManagement' namespace
  const t = useTranslations("TimetableManagement");
  const { daysOfWeek, availableClassrooms } = useLocalizedConstants();
  const { user, isLoading: authLoading } = useAuth(); // ✅ Get current user and loading state from AuthContext

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [rooms, setRooms] = useState<string[]>(availableClassrooms);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const [newEntry, setNewEntry] = useState({
    teacherId: "",
    subjectId: "",
    roomId: "",
  });

  const [viewMode, setViewMode] = useState<"all" | "teacher" | "room">("all");
  const [selectedFilter, setSelectedFilter] = useState<string>("");

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedScheduleDetails, setSelectedScheduleDetails] =
    useState<ScheduleSlot | null>(null);

  const isSubmittingRef = useRef(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    console.log("[TimetableManagement] Starting fetchData");
    try {
      // Only proceed if auth has finished loading and user is available
      if (!user && !authLoading) {
        setError(t("unauthorized") || "Unauthorized: Please log in again");
        setIsLoading(false);
        return;
      }

      if (!user?.id) {
        setError(
          t("unauthorized") || "User ID not available. Please log in again.",
        );
        setIsLoading(false);
        return;
      }

      // ✅ Fetch from local DB
      const [
        allTeachers,
        allSubjects,
        allSchedules,
        allCenters,
        allTeacherSubjects,
      ] = await Promise.all([
        teacherActions.getAll(),
        subjectActions.getAll(),
        scheduleActions.getAll(),
        centerActions.getAll(),
        teacherSubjectActions.getAll(),
      ]);
      console.log("[TimetableManagement] Fetched all entities from Dexie:", {
        teachersCount: allTeachers.length,
        subjectsCount: allSubjects.length,
        schedulesCount: allSchedules.length,
        centersCount: allCenters.length,
      });

      // ✅ Check if user is admin
      const isAdmin = user.role?.toUpperCase() === "ADMIN";

      // ✅ Filter teachers: for admin, show all teachers; for manager, filter by managerId
      let relevantTeachers: typeof allTeachers = [];

      if (isAdmin) {
        // For admin, if centerId is provided, show teachers from that center's managers
        if (centerId) {
          const center = allCenters.find(
            (c) => c.id === centerId && c.status !== "0",
          );
          // ✅ FIX: Include Admin (user.id) in managerIds
          const managerIds = [...(center?.managers || []), user.id];

          relevantTeachers = allTeachers.filter(
            (t) =>
              t.status !== "0" &&
              // Include if managed by any manager in this center, OR directly by admin, OR orphaned (no manager)
              (managerIds.includes(t.managerId) || !t.managerId),
          );
        } else {
          // If no centerId, show all active teachers from admin's centers
          const adminCenters = allCenters.filter(
            (c) => c.adminId === user.id && c.status !== "0",
          );
          // ✅ FIX: Include Admin (user.id) in managerIds
          const adminManagerIds = [
            ...adminCenters.flatMap((c) => c.managers || []),
            user.id,
          ];

          relevantTeachers = allTeachers.filter(
            (t) =>
              t.status !== "0" &&
              // Include if managed by any manager in admin's centers, OR directly by admin, OR orphaned
              (adminManagerIds.includes(t.managerId) || !t.managerId),
          );
        }
      } else {
        // Manager sees only their teachers
        relevantTeachers = allTeachers.filter(
          (t) => t.managerId === user.id && t.status !== "0",
        );
      }

      const managerTeachers = relevantTeachers.map((t) => ({
        id: t.id,
        name: t.name,
        weeklySchedule: t.weeklySchedule,
      }));

      // ✅ Filter subjects by center or manager's centers
      let relevantCenterIds: string[] = [];
      if (isAdmin) {
        if (centerId) {
          relevantCenterIds = [centerId];
        } else {
          // Admin sees all centers they own
          const adminCenters = allCenters.filter(
            (c) => c.adminId === user.id && c.status !== "0",
          );
          relevantCenterIds = adminCenters.map((c) => c.id);
        }
      } else {
        // Manager sees centers they manage
        const managerCenters = allCenters.filter(
          (c) => (c.managers || []).includes(user.id) && c.status !== "0",
        );
        relevantCenterIds = managerCenters.map((c) => c.id);
      }

      const managerSubjects = allSubjects
        .filter((s) => {
          if (centerId) {
            return s.centerId === centerId && s.status !== "0";
          }
          return relevantCenterIds.includes(s.centerId) && s.status !== "0";
        })
        .map((s) => ({ id: s.id, name: s.name, grade: s.grade }));

      // ✅ Filter schedules: for admin, show all schedules; for manager, filter by managerId
      let filteredSchedules = allSchedules.filter((s) => s.status !== "0");

      if (isAdmin) {
        // Admin sees all schedules for their center(s)
        if (centerId) {
          // Get manager IDs for this center
          const center = allCenters.find(
            (c) => c.id === centerId && c.status !== "0",
          );
          const managerIds = [...(center?.managers || []), user.id];
          // Show schedules from managers in this center OR schedules directly for this center
          filteredSchedules = filteredSchedules.filter((s) => {
            // Include if schedule belongs to this center (by centerId)
            if (s.centerId === centerId) {
              return true;
            }
            // OR if schedule's manager is in this center's managers list
            if (managerIds.includes(s.managerId)) {
              return true;
            }
            return false;
          });
        } else {
          // Filter by admin's centers and their managers
          const adminCenters = allCenters.filter(
            (c) => c.adminId === user.id && c.status !== "0",
          );
          const adminCenterIds = adminCenters.map((c) => c.id);
          const adminManagerIds = [
            ...adminCenters.flatMap((c) => c.managers || []),
            user.id,
          ];
          filteredSchedules = filteredSchedules.filter((s) => {
            // Include if: schedule is in admin's center OR schedule's manager is in admin's centers
            return (
              (s.centerId && adminCenterIds.includes(s.centerId)) ||
              adminManagerIds.includes(s.managerId)
            );
          });
        }
      } else {
        // Manager sees only their schedules
        filteredSchedules = filteredSchedules
          .filter((s) => s.managerId === user.id)
          .filter((s) => !centerId || s.centerId === centerId);
      }

      // ✅ Transform schedules to match ScheduleSlot interface
      const scheduleSlots: ScheduleSlot[] = filteredSchedules.map((s) => ({
        id: s.id,
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        teacherId: s.teacherId,
        subjectId: s.subjectId,
        roomId: s.roomId,
      }));

      setTeachers(managerTeachers);
      setSubjects(managerSubjects);
      setTeacherSubjects(
        allTeacherSubjects
          .filter((ts) => ts.status !== "0")
          .map((ts) => ({ teacherId: ts.teacherId, subjectId: ts.subjectId })),
      );
      setSchedule(scheduleSlots);

      console.log("[TimetableManagement] Filtered relevant data:", {
        relevantTeachersCount: relevantTeachers.length,
        managerSubjectsCount: managerSubjects.length,
        relevantSchedulesCount: filteredSchedules.length,
        roomsCount: rooms.length,
      });

      // ✅ Get rooms from relevant centers
      if (centerId) {
        const center = allCenters.find(
          (c) => c.id === centerId && c.status !== "0",
        );
        if (center?.classrooms?.length) {
          setRooms(center.classrooms);
        } else {
          setRooms(availableClassrooms);
        }
      } else {
        // Get all unique classrooms from relevant centers
        const relevantCenters = isAdmin
          ? allCenters.filter((c) => c.adminId === user.id && c.status !== "0")
          : allCenters.filter(
              (c) => (c.managers || []).includes(user.id) && c.status !== "0",
            );

        const allManagerClassrooms = relevantCenters
          .flatMap((c) => c.classrooms || [])
          .filter((room, index, self) => self.indexOf(room) === index); // Remove duplicates

        if (allManagerClassrooms.length > 0) {
          setRooms(allManagerClassrooms);
        } else {
          setRooms(availableClassrooms);
        }
      }

      // ✅ Commented out online fetch
      // const [teachersRes, subjectsRes, scheduleRes, centerRes] = await Promise.all([
      //   axios.get('/api/admin/teachers'),
      //   axios.get('/api/subjects'),
      //   axios.get(`/api/admin/schedule${centerId ? `?centerId=${centerId}` : ''}`),
      //   centerId ? axios.get(`/api/admin/centers/${centerId}`) : Promise.resolve(null)
      // ])
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(t("errorLoadData"));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, authLoading, centerId, t]);

  useEffect(() => {
    // Wait for auth to finish loading before fetching data
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData, refreshKey]);

  const handleSlotClick = (day: string, startTime: string) => {
    if (readOnly) return;
    const endTimeIndex = TIME_SLOTS.indexOf(startTime) + 1;
    const endTime = TIME_SLOTS[endTimeIndex] || "18:00";

    setSelectedSlot({ day, startTime, endTime });

    // Pre-fill based on current view filter
    setNewEntry({
      teacherId: viewMode === "teacher" && selectedFilter ? selectedFilter : "",
      subjectId: "",
      roomId: viewMode === "room" && selectedFilter ? selectedFilter : "",
    });

    setError("");
    setIsDialogOpen(true);
  };

  const [conflictingScheduleIds, setConflictingScheduleIds] = useState<
    string[]
  >([]);

  const handleAddSchedule = async (force = false) => {
    if (isSubmittingRef.current) return;

    if (
      !selectedSlot ||
      !newEntry.teacherId ||
      !newEntry.subjectId ||
      !newEntry.roomId
    ) {
      setError(t("errorFillAllFields"));
      return;
    }

    if (!user || !user.id) {
      setError(t("unauthorized") || "Unauthorized: Please log in again");
      return;
    }

    isSubmittingRef.current = true;
    setIsSaving(true);
    try {
      // ✅ Check for conflicts in local DB
      const allSchedules = await scheduleActions.getAll();
      const activeSchedules = allSchedules.filter((s) => s.status !== "0");

      // Check teacher conflict
      const teacherConflict = activeSchedules.find(
        (s) =>
          s.teacherId === newEntry.teacherId &&
          s.day === selectedSlot.day &&
          s.startTime === selectedSlot.startTime,
      );

      // Check room conflict
      const roomConflict = activeSchedules.find(
        (s) =>
          s.roomId === newEntry.roomId &&
          s.day === selectedSlot.day &&
          s.startTime === selectedSlot.startTime &&
          (centerId ? s.centerId === centerId : true),
      );

      if ((teacherConflict || roomConflict) && !force) {
        const conflicts = [teacherConflict, roomConflict].filter(
          Boolean,
        ) as ScheduleSlot[];
        setConflictingScheduleIds(conflicts.map((c) => c.id!).filter(Boolean));
        setError(
          teacherConflict
            ? t("teacherConflict") + " " + t("overwritePrompt")
            : t("roomConflict") + " " + t("overwritePrompt"),
        );
        setIsSaving(false);
        return;
      }

      // ✅ If force is true, delete conflicting schedules first
      if (force && conflictingScheduleIds.length > 0) {
        for (const id of conflictingScheduleIds) {
          await scheduleActions.markForDelete(id);
        }
        // Update local state to remove deleted schedules
        setSchedule((prev) =>
          prev.filter((s) => !conflictingScheduleIds.includes(s.id!)),
        );
        setConflictingScheduleIds([]);
      }

      // ✅ Get teacher's managerId (for admin-created schedules, use teacher's managerId)
      const allTeachers = await teacherActions.getAll();
      const selectedTeacher = allTeachers.find(
        (t) => t.id === newEntry.teacherId,
      );
      const scheduleManagerId = selectedTeacher?.managerId || user.id;

      // ✅ Create schedule in local DB
      const now = Date.now();
      const scheduleId = generateObjectId();
      const newSchedule = {
        id: scheduleId,
        day: selectedSlot.day,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        teacherId: newEntry.teacherId,
        subjectId: newEntry.subjectId,
        roomId: newEntry.roomId,
        managerId: scheduleManagerId,
        centerId: centerId || undefined,
        status: "w" as const, // Waiting for sync
        createdAt: now,
        updatedAt: now,
      };

      await scheduleActions.putLocal(newSchedule);

      // ✅ Update local state (REMOVED to prevent duplication - we rely on onScheduleChangeAction -> refresh)
      /* 
      const scheduleSlot: ScheduleSlot = {
        id: scheduleId,
        day: selectedSlot.day,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        teacherId: newEntry.teacherId,
        subjectId: newEntry.subjectId,
        roomId: newEntry.roomId,
      };

      setSchedule((prev) => [...prev, scheduleSlot]);
      */
      setIsDialogOpen(false);
      setNewEntry({ teacherId: "", subjectId: "", roomId: "" });
      setError("");
      setConflictingScheduleIds([]); // Clear conflicts
      onScheduleChangeAction?.();

      // ✅ Commented out online creation
      // const { data } = await axios.post('/api/admin/schedule', {
      //   day: selectedSlot.day,
      //   startTime: selectedSlot.startTime,
      //   endTime: selectedSlot.endTime,
      //   teacherId: newEntry.teacherId,
      //   subjectId: newEntry.subjectId,
      //   roomId: newEntry.roomId,
      //   centerId,
      // })
    } catch (err) {
      console.error("Failed to add schedule:", err);
      setError(t("errorAddSchedule"));
    } finally {
      setIsSaving(false);
      isSubmittingRef.current = false;
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      // ✅ Soft delete in local DB
      await scheduleActions.markForDelete(scheduleId);

      // ✅ Update local state (REMOVED to prevent race conditions)
      // setSchedule((prev) => prev.filter((s) => s.id !== scheduleId));

      onScheduleChangeAction?.();

      // ✅ Commented out online delete
      // await axios.delete(`/api/admin/schedule/${scheduleId}`)
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      setError(t("errorDeleteSchedule"));
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Timetable");

      // Set columns
      const headerRow = ["Time", ...daysOfWeek.map((day) => day.label)];
      worksheet.addRow(headerRow);

      // Apply styling to header
      const firstRow = worksheet.getRow(1);
      firstRow.font = { bold: true };
      firstRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
      firstRow.alignment = { horizontal: "center", vertical: "middle" };

      // Add data rows
      TIME_SLOTS.slice(0, -1).forEach((time, index) => {
        const timeLabel = `${time} - ${TIME_SLOTS[index + 1]}`;
        const rowData = [timeLabel];

        daysOfWeek.forEach((day) => {
          const slots = getSlotsByDayAndTime(day.label, time);
          if (slots.length > 0) {
            const cellText = slots
              .map((slot) => {
                const teacher = teachers.find((t) => t.id === slot.teacherId);
                const subject = subjects.find((s) => s.id === slot.subjectId);
                return `${subject?.name || "N/A"} - ${teacher?.name || "N/A"} (${slot.roomId})`;
              })
              .join("\n");
            rowData.push(cellText);
          } else {
            rowData.push("");
          }
        });

        const addedRow = worksheet.addRow(rowData);
        addedRow.alignment = { wrapText: true, vertical: "top" };
      });

      // Simple column widths
      worksheet.columns.forEach((col, idx) => {
        col.width = idx === 0 ? 15 : 25;
      });

      // Add borders
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Timetable_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export Excel:", err);
      setError("Failed to export Excel file");
    }
  };

  const handleViewDetails = (slot: ScheduleSlot) => {
    setSelectedScheduleDetails(slot);
    setIsDetailsDialogOpen(true);
  };

  const filteredSchedule = schedule.filter((slot) => {
    if (viewMode === "teacher" && selectedFilter) {
      return slot.teacherId === selectedFilter;
    }
    if (viewMode === "room" && selectedFilter) {
      return slot.roomId === selectedFilter;
    }
    return true;
  });

  const getSlotsByDayAndTime = (day: string, time: string) => {
    return filteredSchedule.filter(
      (s) => s.day === day && s.startTime === time,
    );
  };

  // Show loading while auth is checking or data is fetching
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("exportExcel") || "Export Excel"}
            </span>
          </Button>
          {!readOnly && <EntitySyncControls entity="schedules" />}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {conflictingScheduleIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="ml-4 bg-red-700 hover:bg-red-800"
                onClick={() => handleAddSchedule(true)} // Force overwrite
              >
                {t("overwrite") || "Overwrite"}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("viewOptions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <Label>{t("viewMode")}</Label>
              <Select
                value={viewMode}
                onValueChange={(value: "all" | "teacher" | "room") => {
                  setViewMode(value);
                  setSelectedFilter("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allSchedules")}</SelectItem>
                  <SelectItem value="teacher">{t("byTeacher")}</SelectItem>
                  <SelectItem value="room">{t("byRoom")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {viewMode === "teacher" && (
              <div className="flex-1 min-w-[150px]">
                <Label>{t("selectTeacher")}</Label>
                <Select
                  value={selectedFilter}
                  onValueChange={setSelectedFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("chooseTeacher")} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {viewMode === "room" && (
              <div className="flex-1 min-w-[150px]">
                <Label>{t("selectRoom")}</Label>
                <Select
                  value={selectedFilter}
                  onValueChange={setSelectedFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("chooseRoom")} />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room} value={room}>
                        {room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      <Card>
        <CardHeader>
          <CardTitle>{t("weeklySchedule")}</CardTitle>
          <CardDescription>{t("weeklyScheduleDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto relative">
            <div className="min-w-[1200px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-2 ">
                <div className="font-semibold text-sm text-muted-foreground p-2 border rounded-md sticky left-0 bg-background z-10">
                  {t("time")}
                </div>
                {daysOfWeek.map((day) => (
                  <div
                    key={day.key}
                    className="font-semibold text-sm text-center p-2 bg-primary/10 rounded-md sticky top-0 z-20"
                  >
                    {day.label}
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              <div className="space-y-2 sticky">
                {TIME_SLOTS.slice(0, -1).map((time, timeIndex) => (
                  <div key={time} className="grid grid-cols-8 gap-2">
                    {/* Time Label - fixed on left */}
                    <div className="flex items-center justify-center text-sm font-medium text-muted-foreground p-2 border rounded-md sticky left-0 bg-background z-10">
                      <Clock className="h-3 w-3 mr-1" />
                      {time} - {TIME_SLOTS[timeIndex + 1]}
                    </div>

                    {/* Day  */}
                    {daysOfWeek.map((day) => {
                      const slots = getSlotsByDayAndTime(day.label, time);
                      const hasConflict = slots.length > 1;

                      // Check availability for teacher view
                      const currentTeacher =
                        viewMode === "teacher" && selectedFilter
                          ? teachers.find((t) => t.id === selectedFilter)
                          : null;

                      // Calculate the end time for this slot
                      const slotEndTime = TIME_SLOTS[timeIndex + 1] || "23:59";

                      const isAvailable =
                        slots.length === 0 &&
                        currentTeacher &&
                        isTeacherAvailable(
                          currentTeacher,
                          day.label,
                          time,
                          slotEndTime,
                        );

                      return (
                        <div
                          key={`${day.key}-${time}`}
                          onClick={() =>
                            !readOnly && handleSlotClick(day.label, time)
                          }
                          className={cn(
                            "min-h-[80px] p-1.5 border rounded-md transition-all flex flex-col relative group/cell",
                            !readOnly && "cursor-pointer",
                            // Default state
                            "bg-background hover:border-primary/50",
                            // Empty & Available state
                            slots.length === 0 &&
                              isAvailable &&
                              "bg-green-50/60 hover:bg-green-100/50 border-green-200/50",
                            // Empty & Not Available (if filtering by teacher)
                            slots.length === 0 &&
                              currentTeacher &&
                              !isAvailable &&
                              "bg-muted/10 opacity-60",
                            // Conflict state
                            hasConflict &&
                              "bg-destructive/10 border-destructive/50",
                          )}
                        >
                          {/* Availability Indicator */}
                          {isAvailable && slots.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="flex flex-col items-center opacity-40 group-hover/cell:opacity-100 transition-opacity">
                                <CheckCircle className="h-4 w-4 text-green-600 mb-0.5" />
                                <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider">
                                  {t("available") || "Available"}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Hover Add Icon (if empty) */}
                          {slots.length === 0 && !readOnly && (
                            <div
                              className={cn(
                                "absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity z-10",
                                isAvailable ? "hidden" : "", // Hide if available icon is already showing, or show overlaid? Let's show overlay.
                              )}
                            >
                              <div className="bg-primary/10 p-1.5 rounded-full backdrop-blur-[2px]">
                                <Clock className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          )}

                          <div className="space-y-1 z-20 relative">
                            {slots.map((slot, idx) => {
                              const teacher = teachers.find(
                                (t) => t.id === slot.teacherId,
                              );
                              const subject = subjects.find(
                                (s) => s.id === slot.subjectId,
                              );

                              return (
                                <div
                                  key={slot.id || idx}
                                  className="p-1.5 bg-card border shadow-sm rounded text-xs space-y-1 group/card relative overflow-hidden hover:shadow-md transition-all border-l-2 border-l-primary"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent slot click
                                    if (slot) handleViewDetails(slot);
                                  }}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="font-semibold truncate pr-4 text-primary">
                                      {subject?.name}
                                    </span>
                                  </div>

                                  <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3 opacity-70" />
                                      <span className="truncate">
                                        {teacher?.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 opacity-70" />
                                      <span>{slot.roomId}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addClassSchedule")}</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  {selectedSlot.day}, {selectedSlot.startTime} -{" "}
                  {selectedSlot.endTime}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                {conflictingScheduleIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-4 bg-red-700 hover:bg-red-800"
                    onClick={() => handleAddSchedule(true)} // Force overwrite
                  >
                    {t("overwrite") || "Overwrite"}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {t("teacher")} {t("required")}
              </Label>
              <Select
                value={newEntry.teacherId}
                onValueChange={(value) =>
                  setNewEntry((prev) => ({ ...prev, teacherId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectTeacherPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {t("subject")} {t("required")}
              </Label>
              <Select
                value={newEntry.subjectId}
                onValueChange={(value) =>
                  setNewEntry((prev) => ({ ...prev, subjectId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectSubjectPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="text-wrap">
                  {subjects
                    .filter((subject) => {
                      if (!newEntry.teacherId) return true;
                      return teacherSubjects.some(
                        (ts) =>
                          ts.teacherId === newEntry.teacherId &&
                          ts.subjectId === subject.id,
                      );
                    })
                    .map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.grade})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {t("room")} {t("required")}
              </Label>
              <Select
                value={newEntry.roomId}
                onValueChange={(value) =>
                  setNewEntry((prev) => ({ ...prev, roomId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectRoomPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room} value={room}>
                      {room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => handleAddSchedule(false)}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("addToSchedule")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("scheduleDetails") || "Schedule Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedScheduleDetails && (
                <>
                  {selectedScheduleDetails.day},{" "}
                  {selectedScheduleDetails.startTime} -{" "}
                  {selectedScheduleDetails.endTime}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedScheduleDetails && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t("teacher")}</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {teachers.find(
                      (t) => t.id === selectedScheduleDetails.teacherId,
                    )?.name || "N/A"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t("subject")}</Label>
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <span>
                      {subjects.find(
                        (s) => s.id === selectedScheduleDetails.subjectId,
                      )?.name || "N/A"}
                    </span>
                    {subjects.find(
                      (s) => s.id === selectedScheduleDetails.subjectId,
                    )?.grade && (
                      <Badge variant="secondary">
                        {
                          subjects.find(
                            (s) => s.id === selectedScheduleDetails.subjectId,
                          )?.grade
                        }
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t("room")}</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedScheduleDetails.roomId}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t("time")}</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedScheduleDetails.startTime} -{" "}
                    {selectedScheduleDetails.endTime}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  {t("day") || "Day"}
                </Label>
                <div className="p-3 bg-muted rounded-md">
                  <span>{selectedScheduleDetails.day}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center w-full sm:justify-between">
            {!readOnly && selectedScheduleDetails?.id && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedScheduleDetails.id) {
                    handleDeleteSchedule(selectedScheduleDetails.id);
                    setIsDetailsDialogOpen(false);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("delete") || "Delete"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              {t("close") || "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
