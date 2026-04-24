"use client";
import { FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
// import axios from 'axios' // ✅ Commented out - using local DB instead
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/freelib/context/freeauthContext";
import {
  centerActions,
  scheduleActions,
  subjectActions,
  teacherActions,
} from "@/freelib/dexie/freedexieaction";
import { Role } from "@/freelib/dexie/dbSchema";
import { cn } from "@/freelib/utils";
import ExcelJS from "exceljs";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import PageHeader from "./page-header";

// ==================== TYPES & INTERFACES ====================

interface WeeklyScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  weeklySchedule?: WeeklyScheduleSlot[] | string | string[];
  overrideConflicts?: boolean;
}

interface Schedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  roomId: string;
  teacher: {
    id: string;
    name: string;
    email?: string;
    weeklySchedule?: WeeklyScheduleSlot[] | string;
  };
  subject: { id: string; name: string; grade: string };
  teacherId: string;
  subjectId: string;
}

interface TeacherWithSchedule extends Teacher {
  weeklySchedule: WeeklyScheduleSlot[];
  schedules: Schedule[];
  subjectsCount: number;
  conflicts: Schedule[];
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const normalizeDayKey = (day: string): string => {
  if (!day) return "";
  const d = day.toLowerCase().trim();
  if (d === "monday" || d === "mon") return "monday";
  if (d === "tuesday" || d === "tue") return "tuesday";
  if (d === "wednesday" || d === "wed") return "wednesday";
  if (d === "thursday" || d === "thu") return "thursday";
  if (d === "friday" || d === "fri") return "friday";
  if (d === "saturday" || d === "sat") return "saturday";
  if (d === "sunday" || d === "sun") return "sunday";
  if (d === "lundi") return "monday";
  if (d === "mardi") return "tuesday";
  if (d === "mercredi") return "wednesday";
  if (d === "jeudi") return "thursday";
  if (d === "vendredi") return "friday";
  if (d === "samedi") return "saturday";
  if (d === "dimanche") return "sunday";
  if (d === "الاثنين" || d === "الإثنين") return "monday";
  if (d === "الثلاثاء") return "tuesday";
  if (d === "الأربعاء" || d === "الاربعاء") return "wednesday";
  if (d === "الخميس") return "thursday";
  if (d === "الجمعة") return "friday";
  if (d === "السبت") return "saturday";
  if (d === "الأحد" || d === "الاحد") return "sunday";
  return d;
};

// ==================== HELPER FUNCTIONS ====================

const parseWeeklySchedule = (
  schedule:
    | WeeklyScheduleSlot[]
    | string
    | string[]
    | Record<string, unknown>
    | undefined,
): WeeklyScheduleSlot[] => {
  if (!schedule) return [];
  if (Array.isArray(schedule)) {
    if (schedule.length > 0 && typeof schedule[0] === "string") {
      try {
        return schedule.map((slot) =>
          typeof slot === "string" ? JSON.parse(slot) : slot,
        );
      } catch {
        return [];
      }
    }
    return schedule as WeeklyScheduleSlot[];
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



const isWithinAvailability = (
  schedule: Schedule,
  availability: WeeklyScheduleSlot[],
): boolean => {
  return true;
};

const timeToPosition = (time: string): number => {
  if (!time || typeof time !== "string") return 0;
  const parts = time.split(":");
  if (parts.length < 2) return 0;
  const [hours, minutes] = parts.map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  const totalMinutes = hours * 60 + minutes;
  const dayStart = 360;
  const dayEnd = 1200;
  const position = ((totalMinutes - dayStart) / (dayEnd - dayStart)) * 100;
  return Math.max(0, Math.min(100, position));
};

const exportTeacherSchedule = (
  teacher: TeacherWithSchedule,
  t: ReturnType<typeof useTranslations<"TeacherScheduleView">>,
) => {
  let text = `${t("title")} - ${teacher.name}\n`;
  text += `${"=".repeat(50)}\n\n`;
  text += `Email: ${teacher.email || "N/A"}\n`;
  text += `${t("phone")}: ${teacher.phone || "N/A"}\n`;




  if (teacher.conflicts.length > 0) {
    text += `⚠️  ${t("conflictsAlert").toUpperCase()} (${teacher.conflicts.length}):\n`;
    text += `${"-".repeat(50)}\n`;
    teacher.conflicts.forEach((conflict) => {
      text += `  ⚠️  ${conflict.day} ${conflict.startTime}-${conflict.endTime}: ${conflict.subject.name} (${conflict.subject.grade})\n`;
    });
    text += "\n";
  }

  text += `${t("classes").toUpperCase()}:\n`;
  text += `${"-".repeat(50)}\n`;
  const schedulesByDay = teacher.schedules.reduce(
    (acc, schedule) => {
      if (!acc[schedule.day]) acc[schedule.day] = [];
      acc[schedule.day].push(schedule);
      return acc;
    },
    {} as Record<string, Schedule[]>,
  );

  DAYS.forEach((day) => {
    const daySchedules = schedulesByDay[day] || [];
    if (daySchedules.length > 0) {
      text += `\n${day}:\n`;
      daySchedules
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .forEach((schedule) => {
          text += `  ✓ ${schedule.startTime}-${schedule.endTime}: ${schedule.subject.name} (${schedule.subject.grade}) - ${t("room")}: ${schedule.roomId}\n`;
        });
    }
  });

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${teacher.name.replace(/\s+/g, "_")}_schedule.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportTeacherScheduleToExcel = async (
  teacher: TeacherWithSchedule,
  t: ReturnType<typeof useTranslations<"TeacherScheduleView">>,
) => {
  const workbook = new ExcelJS.Workbook();

  const infoSheet = workbook.addWorksheet("Teacher Info");
  infoSheet.columns = [
    { header: "Field", key: "field", width: 25 },
    { header: "Value", key: "value", width: 30 },
  ];
  infoSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  infoSheet.getRow(1).fill = {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  const infoData = [
    { field: t("title"), value: teacher.name },
    { field: "Email", value: teacher.email || "N/A" },
    { field: t("phone"), value: teacher.phone || "N/A" },
    { field: "", value: "" },
    { field: "Statistics", value: "" },

    { field: t("classes"), value: teacher.schedules.length },
    { field: t("subjects"), value: teacher.subjectsCount },
    { field: t("conflict"), value: teacher.conflicts.length },
  ];
  infoSheet.addRows(infoData);


  const schedulesSheet = workbook.addWorksheet(t("classes"));
  schedulesSheet.columns = [
    { header: "Day", key: "day", width: 12 },
    { header: "Start Time", key: "startTime", width: 12 },
    { header: "End Time", key: "endTime", width: 12 },
    { header: "Subject", key: "subject", width: 20 },
    { header: "Grade", key: "grade", width: 10 },
    { header: t("room"), key: "room", width: 12 },
    { header: "Status", key: "status", width: 12 },
  ];
  schedulesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  schedulesSheet.getRow(1).fill = {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  const sortedSchedules = [...teacher.schedules].sort((a, b) => {
    const dayCompare =
      DAYS.indexOf(normalizeDayKey(a.day)) -
      DAYS.indexOf(normalizeDayKey(b.day));
    if (dayCompare !== 0) return dayCompare;
    return a.startTime.localeCompare(b.startTime);
  });
  const schedulesData = sortedSchedules.map((schedule) => {
    const status = "OK";
    return {
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      subject: schedule.subject.name,
      grade: schedule.subject.grade,
      room: schedule.roomId,
      status,
    };
  });
  schedulesSheet.addRows(schedulesData);
  schedulesSheet.addRow({});

  schedulesSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const statusCell = row.getCell("status");
      if (statusCell.value?.toString().includes("OK")) {
        statusCell.fill = {
          type: "pattern" as const,
          pattern: "solid",
          fgColor: { argb: "FFC6EFCE" },
        };
        statusCell.font = { color: { argb: "FF006100" } };
      }
    }
  });

  if (teacher.conflicts.length > 0) {
    const conflictsSheet = workbook.addWorksheet(t("conflict"));
    conflictsSheet.columns = [
      { header: "Day", key: "day", width: 12 },
      { header: "Scheduled Time", key: "scheduledTime", width: 18 },
      { header: "Subject", key: "subject", width: 20 },
      { header: "Grade", key: "grade", width: 10 },
      { header: t("room"), key: "room", width: 12 },
      { header: "Issue", key: "issue", width: 40 },
    ];
    conflictsSheet.getRow(1).font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    conflictsSheet.getRow(1).fill = {
      type: "pattern" as const,
      pattern: "solid",
      fgColor: { argb: "FFC00000" },
    };
    const conflictsData = teacher.conflicts.map((conflict) => {
      const issue = "Conflict";
      return {
        day: conflict.day,
        scheduledTime: `${conflict.startTime} - ${conflict.endTime}`,
        subject: conflict.subject.name,
        grade: conflict.subject.grade,
        room: conflict.roomId,
        issue,
      };
    });
    conflictsSheet.addRows(conflictsData);
    conflictsSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.fill = {
          type: "pattern" as const,
          pattern: "solid",
          fgColor: { argb: "FFFFE6E6" },
        };
      }
    });
  }

  const weeklySheet = workbook.addWorksheet(t("weeklyTimeline"));
  const timeSlots = [
    "06:00",
    "07:00",
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
  ];
  weeklySheet.columns = [
    { header: "Time", key: "time", width: 8 },
    ...DAYS.map((day) => ({ header: day, key: day, width: 18 })),
  ];
  weeklySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  weeklySheet.getRow(1).fill = {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  timeSlots.forEach((time) => {
    const row: Record<string, string> = { time };
    DAYS.forEach((dayKey) => {
      const schedule = teacher.schedules.find(
        (s) =>
          normalizeDayKey(s.day) === dayKey &&
          s.startTime <= time &&
          s.endTime > time,
      );
      if (schedule) {
        row[dayKey] = `${schedule.subject.name} (${schedule.roomId})`;
      } else {
        row[dayKey] = "-";
      }
    });
    weeklySheet.addRow(row);
  });
  weeklySheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      DAYS.forEach((dayKey) => {
        const cell = row.getCell(dayKey);
        if (cell.value && cell.value !== "-") {
          cell.fill = {
            type: "pattern" as const,
            pattern: "solid",
            fgColor: { argb: "FFDFE9F3" },
          };
        }
      });
    }
  });

  const fileName = `${teacher.name.replace(/\s+/g, "_")}_schedule_${new Date().toISOString().split("T")[0]}.xlsx`;
  await workbook.xlsx.writeFile(fileName);
};

// ==================== HELPERS (INITIALS + HUE) ====================

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

// ==================== SCROLL FADE ====================
// Wraps the horizontally-scrollable tab row and fades the edges when there
// is overflow content in that direction, signalling that the list scrolls.

function ScrollFade({
  children,
  bgVar = "hsl(var(--muted))",
}: {
  children: React.ReactNode;
  bgVar?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [fades, setFades] = useState({ left: false, right: false });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setFades({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    update();
    const el = ref.current;
    el?.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    if (el) ro.observe(el);
    return () => {
      el?.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* Left fade */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 40,
          pointerEvents: "none",
          zIndex: 2,
          background: `linear-gradient(to right, ${bgVar} 0%, transparent 100%)`,
          opacity: fades.left ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      />
      {/* Right fade */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 40,
          pointerEvents: "none",
          zIndex: 2,
          background: `linear-gradient(to left, ${bgVar} 0%, transparent 100%)`,
          opacity: fades.right ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      />
      {/* Scrollable inner row */}
      <div
        ref={ref}
        style={{
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: "4px 8px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function TeacherScheduleView({
  centerId,
  refreshKey,
  readOnly = false,
}: {
  centerId?: string;
  refreshKey?: number;
  readOnly?: boolean;
}) {
  const t = useTranslations("TeacherScheduleView");
  const tCommon = useTranslations("Common");
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dismissedConflicts, setDismissedConflicts] = useState<
    Record<string, boolean>
  >({});

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const queryData = useLiveQuery(async () => {
    try {
      if (!user) return null;

      const isAdmin = user.role === Role.ADMIN;

      const [allTeachers, allSchedules, allSubjects, allCenters] =
        await Promise.all([
          teacherActions.getAll(),
          scheduleActions.getAll(),
          subjectActions.getAll(),
          centerActions.getAll(),
        ]);

      const accessibleCenters = allCenters.filter((c) => {
        if (isAdmin) return c.adminId === user.id;
        return true; // Simplified for local mode
      });

      const accessibleCenterIds = accessibleCenters.map((c) => c.id);

      const targetCenterIds = centerId
        ? accessibleCenterIds.includes(centerId)
          ? [centerId]
          : []
        : accessibleCenterIds;

      const relevantAdminIds = new Set([
        ...accessibleCenters.flatMap((c) => [c.adminId]),
        user.id,
      ]);

      let activeTeachers = allTeachers;

      let activeSchedules = allSchedules.filter(
        (s) =>
          !centerId || (s.centerId && targetCenterIds.includes(s.centerId)),
      );

      const activeSubjects = allSubjects.filter(
        (s) => s.centerId && targetCenterIds.includes(s.centerId),
      );

      const schedulesWithData: Schedule[] = activeSchedules.map((schedule) => {
        const teacher = activeTeachers.find((t) => t.id === schedule.teacherId);
        const subject = activeSubjects.find((s) => s.id === schedule.subjectId);

        const teacherWeeklySchedule = teacher?.weeklySchedule
          ? typeof teacher.weeklySchedule === "string"
            ? JSON.parse(teacher.weeklySchedule)
            : teacher.weeklySchedule
          : [];

        return {
          ...schedule,
          teacher: {
            id: teacher?.id || schedule.teacherId,
            name: teacher?.name || "Unknown Teacher",
            email: teacher?.email,
            weeklySchedule: teacherWeeklySchedule,
          },
          subject: {
            id: subject?.id || schedule.subjectId,
            name: subject?.name || "Unknown Subject",
            grade: subject?.grade || "N/A",
          },
        };
      });

      const teachersWithDetails: TeacherWithSchedule[] = activeTeachers.map(
        (teacher) => {
          const teacherSchedules = schedulesWithData.filter(
            (s) => s.teacherId === teacher.id,
          );
          const weeklySchedule = parseWeeklySchedule(teacher.weeklySchedule);



          const teacherSubjectsSet = new Set(
            teacherSchedules.map((s) => s.subjectId),
          );

          const conflicts = teacherSchedules.filter(
            (s) => !isWithinAvailability(s, weeklySchedule),
          );

          return {
            ...teacher,
            weeklySchedule,
            schedules: teacherSchedules,
            subjectsCount: teacherSubjectsSet.size,
            conflicts,
          };
        },
      );

      return {
        teachers: teachersWithDetails,
      };
    } catch (err) {
      console.error("Failed to fetch teacher schedules:", err);
      return null;
    }
  }, [user?.id, user?.role, centerId, refreshKey]);

  const teachers = queryData?.teachers || [];
  const isLoading = queryData === undefined;
  const [error, setError] = useState("");

  const toggleDismissConflicts = useCallback(
    async (teacherId: string, dismissed: boolean) => {
      setDismissedConflicts((prev) => ({ ...prev, [teacherId]: dismissed }));
      try {
        await teacherActions.update(teacherId, {
          overrideConflicts: dismissed,
          status: "w",
          updatedAt: Date.now(),
        } as any);
      } catch (err) {
        console.error("Failed to persist conflict dismissal:", err);
      }
    },
    [],
  );

  useEffect(() => {
    if (teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId]);

  useEffect(() => {
    if (teachers.length > 0) {
      const initialDismissed: Record<string, boolean> = {};
      teachers.forEach((t) => {
        if (t.overrideConflicts) {
          initialDismissed[t.id] = true;
        }
      });
      setDismissedConflicts(initialDismissed);
    }
  }, [teachers]);

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const scrollToNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const scrollToPrevious = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchTeachers") || "Search teachers..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-[500px]"
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {filteredTeachers.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <h3 className="text-base font-semibold mb-1">
              {searchQuery
                ? t("noSearchResults") || "No teachers found"
                : t("noTeachersFound")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t("tryDifferentSearch") || "Try a different search term"
                : t("noTeachersDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
          {/* ── Tab bar ── */}
          <div className="relative border rounded-lg p-2 bg-muted/30">
            {/* Carousel nav — only shown when there are many teachers */}
            {filteredTeachers.length > 3 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background shadow-md hover:bg-accent"
                  onClick={scrollToPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background shadow-md hover:bg-accent"
                  onClick={scrollToNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/*
             * ScrollFade replaces the bare overflow-x div.
             * It fades edges reactively so users can see the list scrolls,
             * and passes the bg color so the gradient blends seamlessly.
             */}
            <ScrollFade bgVar="hsl(var(--muted) / 0.3)">
              <TabsList className="h-auto bg-transparent gap-1 p-0 flex flex-nowrap">
                {filteredTeachers.map((teacher) => {
                  const showConflict =
                    isAdmin &&
                    teacher.conflicts.length > 0 &&
                    !dismissedConflicts[teacher.id];

                  const hue = nameToHue(teacher.name);

                  return (
                    <TabsTrigger
                      key={teacher.id}
                      value={teacher.id}
                      className={cn(
                        // base layout
                        "relative flex items-center gap-2 px-3 h-10",
                        "rounded-md rounded-b-none whitespace-nowrap text-sm",
                        // border skeleton — bottom edge handled by active state
                        "border border-transparent border-b-0",
                        "transition-all duration-150",
                        // inactive
                        "text-muted-foreground bg-transparent",
                        "hover:text-foreground hover:bg-background/60",
                        // active — card surface merges with content panel below
                        "data-[state=active]:bg-background",
                        "data-[state=active]:border-border",
                        "data-[state=active]:border-b-background",
                        "data-[state=active]:text-foreground",
                        "data-[state=active]:font-medium",
                        // pull 1px down to visually connect to the panel
                        "data-[state=active]:translate-y-px",
                        "data-[state=active]:shadow-none",
                        // extra right room so the badge doesn't overlap the name
                        showConflict ? "pr-7" : "",
                      )}
                    >
                      {/* Avatar initials circle */}
                      <span
                        aria-hidden
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 8,
                          fontWeight: 600,
                          flexShrink: 0,
                          background: `hsl(${hue} 40% 88%)`,
                          color: `hsl(${hue} 55% 35%)`,
                          transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        {getInitials(teacher.name)}
                      </span>

                      {/* Teacher name */}
                      <span className="font-medium">{teacher.name}</span>

                      {/*
                       * Conflict badge — absolutely positioned so it never
                       * shifts tab widths. Clicking it dismisses without
                       * switching the active tab (stopPropagation).
                       */}
                      {showConflict && (
                        <span
                          role="status"
                          aria-label={`${teacher.conflicts.length} conflict${
                            teacher.conflicts.length !== 1 ? "s" : ""
                          }`}
                          title="Click to dismiss conflicts"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDismissConflicts(teacher.id, true);
                          }}
                          style={{
                            position: "absolute",
                            top: 3,
                            right: 3,
                            minWidth: 16,
                            height: 16,
                            borderRadius: 999,
                            background: "hsl(0 72% 51%)",
                            color: "#fff",
                            fontSize: 9,
                            fontWeight: 700,
                            lineHeight: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 3px",
                            cursor: "pointer",
                            zIndex: 1,
                          }}
                        >
                          {teacher.conflicts.length > 9
                            ? "9+"
                            : teacher.conflicts.length}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </ScrollFade>
          </div>

          {/* ── Tab content panels ── */}
          {filteredTeachers.map((teacher) => {
            const isDismissed =
              dismissedConflicts[teacher.id] !== undefined
                ? dismissedConflicts[teacher.id]
                : (teacher as any).overrideConflicts || false;

            return (
              <TabsContent
                key={teacher.id}
                value={teacher.id}
                className="space-y-4 mt-4"
              >
                <TeacherInfoCard
                  teacher={teacher}
                  isAdmin={isAdmin}
                  dismissed={isDismissed}
                  onDismissChange={(dismissed) =>
                    toggleDismissConflicts(teacher.id, dismissed)
                  }
                />



                <TableScheduleView
                  teacher={teacher}
                  tCommon={tCommon}
                  dismissed={isDismissed}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

// ==================== TEACHER INFO CARD ====================

function TeacherInfoCard({
  teacher,
  isAdmin,
  dismissed,
  onDismissChange,
}: {
  teacher: TeacherWithSchedule;
  isAdmin: boolean;
  dismissed: boolean;
  onDismissChange: (dismissed: boolean) => void;
}) {
  const t = useTranslations("TeacherScheduleView");

  const conflictsToShow = dismissed ? [] : teacher.conflicts;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {teacher.name}
            </CardTitle>
            <CardDescription className="mt-2 space-y-1">
              {teacher.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>{teacher.email}</span>
                </div>
              )}
              {teacher.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{teacher.phone}</span>
                </div>
              )}
            </CardDescription>
          </div>
          <ExportButton teacher={teacher} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">


          <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 dark:bg-purple-500/15 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {teacher.schedules.length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-foreground/60">
              {t("classes")}
            </div>
          </div>
          <div className="text-center p-4 bg-orange-500/10 border border-orange-500/20 dark:bg-orange-500/15 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {teacher.subjectsCount}
            </div>
            <div className="text-xs text-muted-foreground dark:text-foreground/60">
              {t("subjects")}
            </div>
          </div>
        </div>

        {conflictsToShow.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold">
                  {teacher.conflicts.length} {t("conflictsAlert")}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-background hover:bg-accent text-foreground border-destructive/30 hover:border-destructive/50"
                  onClick={() => onDismissChange(true)}
                >
                  {t("overrideAll") || "Override All"}
                </Button>
              </div>
              <ul className="space-y-2 text-sm">
                {teacher.conflicts.map((conflict) => {
                  const availability = teacher.weeklySchedule.find(
                    (slot) => slot.day === conflict.day,
                  );
                  return (
                    <li key={conflict.id} className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <div>
                        <div>
                          <span className="font-medium">{conflict.day}</span>{" "}
                          {conflict.startTime}-{conflict.endTime}
                          {" - "}
                          {conflict.subject.name} ({conflict.subject.grade})
                          {" - "}
                          {t("room")}: {conflict.roomId}
                        </div>
                        {availability ? (
                          <span className="text-xs block text-muted-foreground mt-0.5">
                            ✓ {t("available")}: {availability.startTime}-
                            {availability.endTime}
                          </span>
                        ) : (
                          <span className="text-xs block text-muted-foreground mt-0.5">
                            ✗ {t("notAvailableOn")} {conflict.day}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {dismissed && teacher.conflicts.length > 0 && (
          <Alert className="mt-4 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center">
              <span>
                {t("conflictsDismissed") || "Conflicts acknowledged"} (
                {teacher.conflicts.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs hover:bg-yellow-500/10"
                onClick={() => onDismissChange(false)}
              >
                {t("show") || "Show"}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}



// ==================== TABLE SCHEDULE VIEW ====================

function TableScheduleView({
  teacher,
  tCommon,
  dismissed,
}: {
  teacher: TeacherWithSchedule;
  tCommon: ReturnType<typeof useTranslations>;
  dismissed?: boolean;
}) {
  const t = useTranslations("TeacherScheduleView");

  const sortedSchedules = [...teacher.schedules].sort((a, b) => {
    const dayOrder = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    if (dayOrder !== 0) return dayOrder;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {t("scheduleTable") || "Schedule"}
        </CardTitle>
        <CardDescription>
          {sortedSchedules.length}{" "}
          {sortedSchedules.length === 1
            ? t("class")
            : t("classesPlural") || "classes"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedSchedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {t("noSchedules") || "No scheduled classes"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("day") || "Day"}</TableHead>
                  <TableHead>{t("time") || "Time"}</TableHead>
                  <TableHead>{t("subject") || "Subject"}</TableHead>
                  <TableHead>{t("grade") || "Grade"}</TableHead>
                  <TableHead>{t("room") || "Room"}</TableHead>
                  <TableHead className="text-center">
                    {t("status") || "Status"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSchedules.map((schedule) => {
                  const withinAvailability = isWithinAvailability(
                    schedule,
                    teacher.weeklySchedule,
                  );
                  const showAsNormal = withinAvailability || dismissed;

                  return (
                    <TableRow
                      key={schedule.id}
                      className={cn(
                        showAsNormal
                          ? ""
                          : "bg-destructive/5 hover:bg-destructive/10",
                      )}
                    >
                      <TableCell className="font-medium">
                        {tCommon(`daysOfWeek.${schedule.day}`)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {schedule.subject.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {schedule.subject.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {schedule.roomId}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {showAsNormal ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== GRID SCHEDULE VIEW ====================

function GridScheduleView({
  teacher,
  tCommon,
  dismissed,
}: {
  teacher: TeacherWithSchedule;
  tCommon: ReturnType<typeof useTranslations>;
  dismissed?: boolean;
}) {
  const t = useTranslations("TeacherScheduleView");

  const schedulesByDay = teacher.schedules.reduce(
    (acc, schedule) => {
      if (!acc[schedule.day]) acc[schedule.day] = [];
      acc[schedule.day].push(schedule);
      return acc;
    },
    {} as Record<string, Schedule[]>,
  );

  const availabilityByDay = teacher.weeklySchedule.reduce(
    (acc, slot) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day].push(slot);
      return acc;
    },
    {} as Record<string, WeeklyScheduleSlot[]>,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {DAYS.map((dayKey) => {
        const daySchedules = (schedulesByDay[dayKey] || []).sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        );
        const dayAvailability = availabilityByDay[dayKey] || [];
        const hasContent =
          daySchedules.length > 0 || dayAvailability.length > 0;

        if (!hasContent) return null;

        return (
          <Card key={dayKey}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {tCommon(`daysOfWeek.${dayKey}`)}
                </div>
                {daySchedules.length > 0 && (
                  <Badge variant="secondary">{daySchedules.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {daySchedules.length > 0 ? (
                <div className="space-y-2">
                  {daySchedules.map((schedule) => {
                    const withinAvailability = isWithinAvailability(
                      schedule,
                      teacher.weeklySchedule,
                    );
                    const showAsNormal = withinAvailability || dismissed;

                    return (
                      <div
                        key={schedule.id}
                        className={cn(
                          "p-3 rounded-md border space-y-2 transition-colors",
                          showAsNormal
                            ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10 dark:bg-green-500/10 dark:border-green-500/30"
                            : "bg-destructive/5 border-destructive/20 hover:bg-destructive/10 dark:bg-destructive/10 dark:border-destructive/30",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="h-3 w-3" />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                          {showAsNormal ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-3 w-3" />
                          <span className="font-medium">
                            {schedule.subject.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {schedule.subject.grade}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{schedule.roomId}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ==================== LIST SCHEDULE VIEW ====================

function ListScheduleView({
  teacher,
  tCommon,
}: {
  teacher: TeacherWithSchedule;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const t = useTranslations("TeacherScheduleView");

  const schedulesByDay = teacher.schedules.reduce(
    (acc, schedule) => {
      if (!acc[schedule.day]) acc[schedule.day] = [];
      acc[schedule.day].push(schedule);
      return acc;
    },
    {} as Record<string, Schedule[]>,
  );

  return (
    <div className="space-y-4">
      {DAYS.map((day) => {
        const daySchedules = (schedulesByDay[day] || []).sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        );
        if (daySchedules.length === 0) return null;

        const dayAvailability = teacher.weeklySchedule.find(
          (s) => s.day === day,
        );

        return (
          <Card key={day}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {tCommon(`daysOfWeek.${day}`)}
                </CardTitle>
                <div className="flex items-center gap-2">

                  <Badge variant="secondary">
                    {daySchedules.length}{" "}
                    {daySchedules.length === 1
                      ? t("class")
                      : t("classesPlural")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {daySchedules.map((schedule) => {
                  const withinAvailability = isWithinAvailability(
                    schedule,
                    teacher.weeklySchedule,
                  );

                  return (
                    <div
                      key={schedule.id}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-lg transition-colors",
                        withinAvailability
                          ? "hover:bg-secondary/10 border-secondary/20"
                          : "hover:bg-destructive/10 border-destructive/20 bg-destructive/10",
                      )}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {schedule.subject.name}
                          </span>
                          <Badge variant="outline">
                            {schedule.subject.grade}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {schedule.roomId}
                          </span>
                        </div>
                      </div>
                      <div>
                        {withinAvailability ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {teacher.schedules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("noClassesScheduled")}
            </h3>
            <p className="text-muted-foreground">{t("noClassesDescription")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== TIMELINE SCHEDULE VIEW ====================

function TimelineScheduleView({ teacher }: { teacher: TeacherWithSchedule }) {
  const t = useTranslations("TeacherScheduleView");
  const tCommon = useTranslations("Common");

  const schedulesByDay = teacher.schedules.reduce(
    (acc, schedule) => {
      const dayKey = normalizeDayKey(schedule.day);
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(schedule);
      return acc;
    },
    {} as Record<string, Schedule[]>,
  );

  const availabilityByDay = teacher.weeklySchedule.reduce(
    (acc, slot) => {
      const dayKey = normalizeDayKey(slot.day);
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(slot);
      return acc;
    },
    {} as Record<string, WeeklyScheduleSlot[]>,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("weeklyTimeline")}</CardTitle>
        <CardDescription>{t("weeklyTimelineDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 overflow-x-auto">
        {DAYS.map((day) => {
          const availability = availabilityByDay[day] || [];
          const schedules = schedulesByDay[day] || [];
          const hasContent = availability.length > 0 || schedules.length > 0;
          if (!hasContent) return null;

          return (
            <div key={day} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {tCommon(`daysOfWeek.${normalizeDayKey(day)}`)}
                </div>
                {schedules.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {schedules.length}{" "}
                    {schedules.length === 1 ? t("class") : t("classesPlural")}
                  </Badge>
                )}
              </div>

              <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden border">


                {schedules.map((schedule, idx) => {
                  const start = timeToPosition(schedule.startTime);
                  const width = timeToPosition(schedule.endTime) - start;
                  const isConflict = !isWithinAvailability(
                    schedule,
                    availability,
                  );
                  const topOffset = (idx % 2) * 6 + 2;

                  return (
                    <div
                      key={schedule.id}
                      className={cn(
                        "absolute h-10 rounded border-2 shadow-sm transition-all hover:shadow-md cursor-pointer",
                        isConflict
                          ? "bg-red-500 border-red-700 hover:bg-red-600"
                          : "bg-blue-500 border-blue-700 hover:bg-blue-600",
                      )}
                      style={{
                        left: `${start}%`,
                        width: `${Math.max(width, 5)}%`,
                        top: `${topOffset}px`,
                      }}
                      title={`${schedule.subject.name} (${schedule.subject.grade})\n${schedule.startTime} - ${schedule.endTime}\n${t("room")}: ${schedule.roomId}${isConflict ? `\n⚠️ ${t("outsideAvailableHours")}` : ""}`}
                    >
                      <div className="text-xs p-1 text-white font-medium truncate flex items-center gap-1">
                        {isConflict && (
                          <AlertCircle className="h-3 w-3 shrink-0" />
                        )}
                        <span className="truncate">
                          {schedule.subject.name}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {availability.length > 0 && (
                  <>
                    {availability[0] &&
                      timeToPosition(availability[0].startTime) > 0 && (
                        <div
                          className="absolute h-full bg-gray-300/40 pointer-events-none"
                          style={{
                            left: 0,
                            width: `${timeToPosition(availability[0].startTime)}%`,
                          }}
                        />
                      )}
                    {availability[availability.length - 1] &&
                      timeToPosition(
                        availability[availability.length - 1].endTime,
                      ) < 100 && (
                        <div
                          className="absolute h-full bg-gray-300/40 pointer-events-none"
                          style={{
                            left: `${timeToPosition(availability[availability.length - 1].endTime)}%`,
                            width: `${100 - timeToPosition(availability[availability.length - 1].endTime)}%`,
                          }}
                        />
                      )}
                  </>
                )}
              </div>

              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>6 AM</span>
                <span>9 AM</span>
                <span>12 PM</span>
                <span>3 PM</span>
                <span>6 PM</span>
                <span>8 PM</span>
              </div>

              {schedules.length > 0 && (
                <div className="mt-2 space-y-1">
                  {schedules
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((schedule) => {
                      const isConflict = !isWithinAvailability(
                        schedule,
                        availability,
                      );
                      return (
                        <div
                          key={schedule.id}
                          className={cn(
                            "text-xs p-2 rounded flex items-center justify-between",
                            isConflict
                              ? "bg-red-50 text-red-900"
                              : "bg-blue-50 text-blue-900",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isConflict ? (
                              <AlertCircle className="h-3 w-3 text-red-600" />
                            ) : (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            )}
                            <span className="font-medium">
                              {schedule.startTime}-{schedule.endTime}
                            </span>
                            <span>{schedule.subject.name}</span>
                            <Badge variant="outline" className="text-xs h-4">
                              {schedule.subject.grade}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground">
                            {schedule.roomId}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}

        <div className="border-t pt-4 mt-4">
          <div className="text-sm font-medium mb-2">{t("legend")}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-green-200/50 border border-green-400 rounded" />
              <span>{t("availableTime")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-blue-500 border-2 border-blue-700 rounded" />
              <span>{t("scheduledClass")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-red-500 border-2 border-red-700 rounded" />
              <span>{t("conflict")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-gray-300/40 rounded" />
              <span>{t("unavailable")}</span>
            </div>
          </div>
        </div>

        {teacher.schedules.length === 0 &&
          teacher.weeklySchedule.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">{t("noAvailabilityOrSchedules")}</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

// ==================== EXPORT BUTTON ====================

function ExportButton({ teacher }: { teacher: TeacherWithSchedule }) {
  const t = useTranslations("TeacherScheduleView");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
        <Download className="h-4 w-4 mr-2" />
        {t("export")}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border z-20 overflow-hidden">
            <button
              onClick={() => {
                exportTeacherSchedule(teacher, t);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {t("exportToText")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
