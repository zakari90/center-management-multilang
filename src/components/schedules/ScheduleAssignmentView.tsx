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
import {
  CheckCircle,
  Clock,
  LayoutGrid,
  Loader2,
  MapPin,
  Search,
  User,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback, useMemo } from "react";
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
import { Input } from "@/components/ui/input";

// --- Types ---

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

// Reuse same time slots for consistency
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
];

// --- Helper Functions ---

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

  return availability.some((slot: any) => {
    return (
      slot.day === day && startTime >= slot.startTime && endTime <= slot.endTime
    );
  });
};

export default function ScheduleAssignmentView({
  centerId,
  refreshKey,
  onScheduleChangeAction,
}: {
  centerId?: string;
  refreshKey?: number;
  onScheduleChangeAction?: () => void;
}) {
  const t = useTranslations("ScheduleAssignment");
  const { daysOfWeek, availableClassrooms } = useLocalizedConstants();
  const { user, isLoading: authLoading } = useAuth();

  // Data State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [rooms, setRooms] = useState<string[]>(availableClassrooms);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>("Monday"); // Default to Monday (or first day)

  // Assignment Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    roomId: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const [newEntry, setNewEntry] = useState({
    teacherId: "",
    subjectId: "",
  });

  const [teacherSearch, setTeacherSearch] = useState("");
  const [conflictingScheduleIds, setConflictingScheduleIds] = useState<
    string[]
  >([]);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    console.log("[ScheduleAssignmentView] Starting fetchData");
    try {
      if (!user && !authLoading) {
        setError("Unauthorized");
        setIsLoading(false);
        return;
      }
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

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
      console.log("[ScheduleAssignmentView] Fetched all entities from Dexie:", {
        teachersCount: allTeachers.length,
        subjectsCount: allSubjects.length,
        schedulesCount: allSchedules.length,
        centersCount: allCenters.length,
        teacherSubjectsCount: allTeacherSubjects.length,
      });

      const isAdmin = user.role?.toUpperCase() === "ADMIN";

      // --- Filter Teachers ---
      let relevantTeachers: typeof allTeachers = [];
      if (isAdmin) {
        if (centerId) {
          const center = allCenters.find(
            (c) => c.id === centerId && c.status !== "0",
          );
          const managerIds = [...(center?.managers || []), user.id];
          relevantTeachers = allTeachers.filter(
            (t) =>
              t.status !== "0" &&
              (managerIds.includes(t.managerId) || !t.managerId),
          );
        } else {
          const adminCenters = allCenters.filter(
            (c) => c.adminId === user.id && c.status !== "0",
          );
          const adminManagerIds = [
            ...adminCenters.flatMap((c) => c.managers || []),
            user.id,
          ];
          relevantTeachers = allTeachers.filter(
            (t) =>
              t.status !== "0" &&
              (adminManagerIds.includes(t.managerId) || !t.managerId),
          );
        }
      } else {
        relevantTeachers = allTeachers.filter(
          (t) => t.managerId === user.id && t.status !== "0",
        );
      }

      setTeachers(
        relevantTeachers.map((t) => ({
          id: t.id,
          name: t.name,
          weeklySchedule: t.weeklySchedule,
        })),
      );

      // --- Filter Subjects ---
      let relevantCenterIds: string[] = [];
      if (isAdmin) {
        if (centerId) relevantCenterIds = [centerId];
        else {
          const adminCenters = allCenters.filter(
            (c) => c.adminId === user.id && c.status !== "0",
          );
          relevantCenterIds = adminCenters.map((c) => c.id);
        }
      } else {
        const managerCenters = allCenters.filter(
          (c) => (c.managers || []).includes(user.id) && c.status !== "0",
        );
        relevantCenterIds = managerCenters.map((c) => c.id);
      }

      const managerSubjects = allSubjects
        .filter((s) => {
          if (centerId) return s.centerId === centerId && s.status !== "0";
          return relevantCenterIds.includes(s.centerId) && s.status !== "0";
        })
        .map((s) => ({ id: s.id, name: s.name, grade: s.grade }));

      // --- Filter Schedules ---
      let filteredSchedules = allSchedules.filter((s) => s.status !== "0");
      // (Simplified logic: consistent with existing component)
      if (isAdmin) {
        if (centerId) {
          const center = allCenters.find(
            (c) => c.id === centerId && c.status !== "0",
          );
          const managerIds = [...(center?.managers || []), user.id];
          filteredSchedules = filteredSchedules.filter(
            (s) => s.centerId === centerId || managerIds.includes(s.managerId),
          );
        } else {
          const adminCenters = allCenters.filter(
            (c) => c.adminId === user.id && c.status !== "0",
          );
          const adminCenterIds = adminCenters.map((c) => c.id);
          const adminManagerIds = [
            ...adminCenters.flatMap((c) => c.managers || []),
            user.id,
          ];
          filteredSchedules = filteredSchedules.filter(
            (s) =>
              (s.centerId && adminCenterIds.includes(s.centerId)) ||
              adminManagerIds.includes(s.managerId),
          );
        }
      } else {
        filteredSchedules = filteredSchedules
          .filter((s) => s.managerId === user.id)
          .filter((s) => !centerId || s.centerId === centerId);
      }

      setSubjects(managerSubjects);
      setTeacherSubjects(
        allTeacherSubjects
          .filter((ts) => ts.status !== "0")
          .map((ts) => ({ teacherId: ts.teacherId, subjectId: ts.subjectId })),
      );

      setSchedule(
        filteredSchedules.map((s) => ({
          id: s.id,
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          teacherId: s.teacherId,
          subjectId: s.subjectId,
          roomId: s.roomId,
        })),
      );

      console.log("[ScheduleAssignmentView] Filtered relevant data:", {
        relevantTeachersCount: relevantTeachers.length,
        managerSubjectsCount: managerSubjects.length,
        relevantSchedulesCount: filteredSchedules.length,
      });

      // --- Filter Rooms ---
      if (centerId) {
        const center = allCenters.find(
          (c) => c.id === centerId && c.status !== "0",
        );
        if (center?.classrooms?.length) setRooms(center.classrooms);
        else setRooms(availableClassrooms);
      } else {
        const relevantCenters = isAdmin
          ? allCenters.filter((c) => c.adminId === user.id && c.status !== "0")
          : allCenters.filter(
              (c) => (c.managers || []).includes(user.id) && c.status !== "0",
            );

        const allManagerClassrooms = relevantCenters
          .flatMap((c) => c.classrooms || [])
          .filter((room, index, self) => self.indexOf(room) === index);

        if (allManagerClassrooms.length > 0) setRooms(allManagerClassrooms);
        else setRooms(availableClassrooms);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [user, user?.id, user?.role, authLoading, centerId, availableClassrooms]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData, refreshKey]);

  useEffect(() => {
    // Set default day to today or Monday
    // const today = new Date().toLocaleDateString('en-US', { weekday: 'Long' });
    // Simplify: Just default to first day in list for now or keep 'Monday'
    if (
      daysOfWeek.length > 0 &&
      !daysOfWeek.find((d) => d.label === selectedDay)
    ) {
      setSelectedDay(daysOfWeek[0].label);
    }
  }, [daysOfWeek, selectedDay]);

  // --- Handlers ---

  const handleSlotClick = (room: string, startTime: string) => {
    const endTimeIndex = TIME_SLOTS.indexOf(startTime) + 1;
    const endTime = TIME_SLOTS[endTimeIndex] || "18:00";

    setSelectedSlot({ roomId: room, startTime, endTime });
    setNewEntry({ teacherId: "", subjectId: "" });
    setError("");
    setConflictingScheduleIds([]);
    setIsDialogOpen(true);
  };

  const handleSave = async (force = false) => {
    if (!selectedSlot || !newEntry.teacherId || !newEntry.subjectId) {
      setError("Please fill all fields");
      return;
    }
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const allSchedules = await scheduleActions.getAll();
      const activeSchedules = allSchedules.filter((s) => s.status !== "0");

      // Conflict Checks
      // 1. Teacher Conflict: Is this teacher busy elsewhere at this time?
      const teacherConflict = activeSchedules.find(
        (s) =>
          s.teacherId === newEntry.teacherId &&
          s.day === selectedDay &&
          s.startTime === selectedSlot.startTime &&
          s.id !== (conflictingScheduleIds[0] || "new"), // exclude self if editing (not implemented yet, but good practice)
      );

      // 2. Room Conflict: Is this room occupied at this time?
      const roomConflict = activeSchedules.find(
        (s) =>
          s.roomId === selectedSlot.roomId &&
          s.day === selectedDay &&
          s.startTime === selectedSlot.startTime &&
          (centerId ? s.centerId === centerId : true),
      );

      if ((teacherConflict || roomConflict) && !force) {
        const conflicts = [teacherConflict, roomConflict].filter(
          Boolean,
        ) as any[];
        setConflictingScheduleIds(conflicts.map((c) => c.id));
        setError(
          teacherConflict
            ? t("teacherBusy") + (roomConflict ? " & " + t("roomOccupied") : "")
            : t("roomOccupied"),
        );
        setIsSaving(false);
        return;
      }

      // Force overwrite: delete conflicts
      if (force && conflictingScheduleIds.length > 0) {
        for (const id of conflictingScheduleIds) {
          await scheduleActions.markForDelete(id);
        }
        setSchedule((prev) =>
          prev.filter((s) => !conflictingScheduleIds.includes(s.id!)),
        );
        setConflictingScheduleIds([]);
      }

      const allTeachers = await teacherActions.getAll();
      const selectedTeacher = allTeachers.find(
        (t) => t.id === newEntry.teacherId,
      );
      const scheduleManagerId = selectedTeacher?.managerId || user.id;

      const now = Date.now();
      const scheduleId = generateObjectId();

      const newSchedule = {
        id: scheduleId,
        day: selectedDay,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        teacherId: newEntry.teacherId,
        subjectId: newEntry.subjectId,
        roomId: selectedSlot.roomId,
        managerId: scheduleManagerId,
        centerId: centerId || undefined,
        status: "w" as const,
        createdAt: now,
        updatedAt: now,
      };

      await scheduleActions.putLocal(newSchedule);

      setSchedule((prev) => [
        ...prev,
        {
          ...newSchedule,
          teacherId: newEntry.teacherId,
          subjectId: newEntry.subjectId,
          roomId: selectedSlot.roomId,
        },
      ]);

      setIsDialogOpen(false);
      onScheduleChangeAction?.();
    } catch (err) {
      console.error(err);
      setError("Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render Helpers ---

  // Get filtered teachers for the sidebar
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) =>
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()),
    );
  }, [teachers, teacherSearch]);

  // Get teacher availability status for the CURRENT selected day/time (if a slot is selected)
  // OR just general stats if no slot selected.
  // For the sidebar list, we want to show if they are available today (selectedDay).

  const getSlotContent = (room: string, startTime: string) => {
    return schedule.find(
      (s) =>
        s.day === selectedDay && s.roomId === room && s.startTime === startTime,
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)] min-h-[600px]">
      {/* Left Sidebar: Teachers & Controls */}
      <Card className="w-full lg:w-80 flex flex-col h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("teacherView")}</CardTitle>
          <div className="pt-2">
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((d) => (
                  <SelectItem key={d.key} value={d.label}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="pt-2 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("selectTeacher")}
              className="pl-8"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full overflow-y-auto px-4 pb-4">
            <div className="space-y-2 pt-2">
              {filteredTeachers.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">
                  No teachers found
                </p>
              )}
              {filteredTeachers.map((teacher) => {
                // Calculate availability for this day
                // const isAvailableToday = ...
                return (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-2 rounded-md border text-sm hover:bg-accent cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="truncate">
                        <p className="font-medium truncate">{teacher.name}</p>
                        {/* <p className="text-xs text-muted-foreground">Math, French</p> */}
                      </div>
                    </div>
                    {/* Availability badge logic could go here */}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Center: Room Grid */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("roomView")}</CardTitle>
              <CardDescription>{selectedDay}</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>{" "}
                {t("availableTeachers")}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>{" "}
                {t("assignToSlot")}
              </div>
            </div>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-auto relative">
          {/* Grid Header: Rooms */}
          <div className="flex sticky top-0 z-20 bg-background border-b min-w-[800px]">
            <div className="w-20 shrink-0 border-r p-2 bg-muted/30 flex items-center justify-center font-medium text-sm sticky left-0 z-30">
              <Clock className="h-4 w-4" />
            </div>
            {rooms.map((room) => (
              <div
                key={room}
                className="flex-1 min-w-[120px] p-2 text-center font-medium text-sm border-r last:border-r-0"
              >
                {room}
              </div>
            ))}
          </div>

          {/* Grid Body: Time Slots */}
          <div className="min-w-[800px]">
            {TIME_SLOTS.slice(0, -1).map((time, timeIndex) => (
              <div
                key={time}
                className="flex border-b last:border-b-0 h-[80px]"
              >
                {/* Time Column */}
                <div className="w-20 shrink-0 border-r bg-muted/10 flex flex-col items-center justify-center text-xs text-muted-foreground sticky left-0 z-10">
                  <span>{time}</span>
                  <span className="text-[10px] opacity-70">
                    {TIME_SLOTS[timeIndex + 1]}
                  </span>
                </div>

                {/* Room Cells */}
                {rooms.map((room) => {
                  const slot = getSlotContent(room, time);
                  const teacher = slot
                    ? teachers.find((t) => t.id === slot.teacherId)
                    : null;
                  const subject = slot
                    ? subjects.find((s) => s.id === slot.subjectId)
                    : null;

                  return (
                    <div
                      key={`${room}-${time}`}
                      onClick={() => handleSlotClick(room, time)}
                      className={cn(
                        "flex-1 min-w-[120px] border-r last:border-r-0 p-1 cursor-pointer transition-colors hover:bg-accent/50",
                        slot ? "bg-blue-50 hover:bg-blue-100" : "",
                      )}
                    >
                      {slot ? (
                        <div className="h-full w-full rounded border bg-white p-1 shadow-sm text-xs flex flex-col gap-0.5 overflow-hidden">
                          <div className="font-semibold text-primary truncate">
                            {teacher?.name || "Unknown"}
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1 h-4 w-fit max-w-full truncate"
                          >
                            {subject?.name}
                          </Badge>
                        </div>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100">
                          <LayoutGrid className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("assignToSlot")}</DialogTitle>
            <DialogDescription>
              {selectedDay} • {selectedSlot?.startTime} -{" "}
              {selectedSlot?.endTime} • {selectedSlot?.roomId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>{t("selectTeacher")}</Label>
              <Select
                value={newEntry.teacherId}
                onValueChange={(val) =>
                  setNewEntry((prev) => ({ ...prev, teacherId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectTeacher")} />
                </SelectTrigger>
                <SelectContent>
                  {/* Filter teachers mainly by who is available, but show others as busy */}
                  {teachers.map((teacher) => {
                    const available = selectedSlot
                      ? isTeacherAvailable(
                          teacher,
                          selectedDay,
                          selectedSlot.startTime,
                          selectedSlot.endTime,
                        )
                      : false;
                    return (
                      <SelectItem
                        key={teacher.id}
                        value={teacher.id}
                        className="flex justify-between items-center w-full"
                      >
                        <span
                          className={cn(
                            !available &&
                              "opacity-50 line-through decoration-destructive",
                          )}
                        >
                          {teacher.name}
                        </span>
                        {available && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-[10px] bg-green-50 text-green-700 border-green-200"
                          >
                            Available
                          </Badge>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.raw("subject") || "Subject"}</Label>
              <Select
                value={newEntry.subjectId}
                onValueChange={(val) =>
                  setNewEntry((prev) => ({ ...prev, subjectId: val }))
                }
                disabled={!newEntry.teacherId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects
                    .filter((s) => {
                      // Show subjects this teacher teaches, OR all subjects (fallback)
                      const teachesSubject = teacherSubjects.some(
                        (ts) =>
                          ts.teacherId === newEntry.teacherId &&
                          ts.subjectId === s.id,
                      );
                      return teachesSubject;
                    })
                    .map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.grade})
                      </SelectItem>
                    ))}
                  {/* Show other subjects in a separate group or just at bottom? For now, just show assigned ones for strictness */}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            {conflictingScheduleIds.length > 0 ? (
              <Button
                variant="destructive"
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                Overwrite & Save
              </Button>
            ) : (
              <Button onClick={() => handleSave(false)} disabled={isSaving}>
                Save Assignment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
