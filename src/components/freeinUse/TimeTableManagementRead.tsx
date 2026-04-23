"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/freelib/utils";
import { Clock, Loader2, MapPin, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/freelib/dexie/dbSchema";
import { useAuth } from "@/freelib/context/freeauthContext";
import { useLocalizedConstants } from "@/components/freeinUse/useLocalizedConstants";

interface Teacher {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  grade: string;
}

interface ScheduleSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  subjectId: string;
  roomId: string;
  teacher?: { id: string; name: string };
  subject?: { id: string; name: string; grade: string };
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
];

const normalizeDayKey = (day: string): string => {
  if (!day) return "";
  const d = day.toLowerCase().trim();
  // English
  if (d === "monday" || d === "mon") return "monday";
  if (d === "tuesday" || d === "tue") return "tuesday";
  if (d === "wednesday" || d === "wed") return "wednesday";
  if (d === "thursday" || d === "thu") return "thursday";
  if (d === "friday" || d === "fri") return "friday";
  if (d === "saturday" || d === "sat") return "saturday";
  if (d === "sunday" || d === "sun") return "sunday";

  // French
  if (d === "lundi") return "monday";
  if (d === "mardi") return "tuesday";
  if (d === "mercredi") return "wednesday";
  if (d === "jeudi") return "thursday";
  if (d === "vendredi") return "friday";
  if (d === "samedi") return "saturday";
  if (d === "dimanche") return "sunday";

  // Arabic (with and without hamza)
  if (d === "الاثنين" || d === "الإثنين") return "monday";
  if (d === "الثلاثاء") return "tuesday";
  if (d === "الأربعاء" || d === "الاربعاء") return "wednesday";
  if (d === "الخميس") return "thursday";
  if (d === "الجمعة") return "friday";
  if (d === "السبت") return "saturday";
  if (d === "الأحد" || d === "الاحد") return "sunday";

  return d; // Return as is if already a key or unknown
};

export default function TimetableManagement({
  centerId,
}: {
  centerId?: string;
}) {
  const t = useTranslations("TimetableOverview");
  const { user, isLoading: authLoading } = useAuth();
  const { daysOfWeek } = useLocalizedConstants();

  const [viewMode, setViewMode] = useState<"all" | "teacher" | "room">("all");
  const [selectedFilter, setSelectedFilter] = useState<string>("");

  // Use useLiveQuery to reactively fetch data
  const data = useLiveQuery(async () => {
    if (!user?.id) return null;

    const [allSchedules, allTeachers, allSubjects, allCenters] =
      await Promise.all([
        getDb().schedules.toArray(),
        getDb().teachers.toArray(),
        getDb().subjects.toArray(),
        getDb().centers.toArray(),
      ]);

    const isAdmin = user.role?.toUpperCase() === "ADMIN";

    // ✅ Filter teachers (simplified for local admin mode)
    const relevantTeachers = allTeachers;

    const adminTeachers = relevantTeachers.map((t: any) => ({
      id: t.id,
      name: t.name,
    }));

    // ✅ Filter subjects by center or relevant centers
    let relevantCenterIds: string[] = [];
    if (isAdmin) {
      if (centerId) {
        relevantCenterIds = [centerId];
      } else {
        const adminCenters = allCenters.filter((c) => c.adminId === user.id);
        relevantCenterIds = adminCenters.map((c) => c.id);
      }
    } else {
      const adminCenters = allCenters;
      relevantCenterIds = adminCenters.map((c) => c.id);
    }

    const adminSubjects = allSubjects
      .filter((s: any) => {
        if (centerId) {
          return s.centerId === centerId;
        }
        return relevantCenterIds.includes(s.centerId);
      })
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
      }));

    // ✅ Cleaned schedules (status field is removed)
    let filteredSchedules = allSchedules;

    if (centerId) {
      filteredSchedules = filteredSchedules.filter(
        (s: any) => s.centerId === centerId,
      );
    }

    // Build schedule slots with related data — normalize day keys
    const schedulesWithData: ScheduleSlot[] = filteredSchedules.map(
      (schedule: any) => {
        const teacher = adminTeachers.find((t) => t.id === schedule.teacherId);
        const subject = adminSubjects.find((s) => s.id === schedule.subjectId);

        return {
          id: schedule.id,
          day: normalizeDayKey(schedule.day),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          teacherId: schedule.teacherId,
          subjectId: schedule.subjectId,
          roomId: schedule.roomId,
          teacher: teacher
            ? {
                id: teacher.id,
                name: teacher.name,
              }
            : undefined,
          subject: subject
            ? {
                id: subject.id,
                name: subject.name,
                grade: subject.grade,
              }
            : undefined,
        };
      },
    );

    // Get rooms
    let centerRooms: string[] = [];
    if (centerId) {
      const center = allCenters.find((c) => c.id === centerId);
      if (center?.classrooms) {
        centerRooms = center.classrooms;
      }
    } else {
      const relevantCenters = isAdmin
        ? allCenters.filter((c) => c.adminId === user.id)
        : allCenters;
      const allRooms = new Set<string>();
      relevantCenters.forEach((c) => {
        if (c.classrooms) {
          c.classrooms.forEach((room) => allRooms.add(room));
        }
      });
      centerRooms = Array.from(allRooms);
    }

    return {
      teachers: adminTeachers,
      subjects: adminSubjects,
      schedule: schedulesWithData,
      rooms:
        centerRooms.length > 0
          ? centerRooms
          : ["Room 1", "Room 2", "Room 3", "Room 4", "Room 5"],
    };
  }, [user, centerId]);

  const isLoading = !data && !authLoading;
  const error = !user && !authLoading ? t("unauthorized") : "";

  const {
    teachers = [],
    subjects = [],
    schedule = [],
    rooms = [],
  } = data || {};

  const filteredSchedule = schedule.filter((slot: any) => {
    if (viewMode === "teacher" && selectedFilter) {
      return slot.teacherId === selectedFilter;
    }
    if (viewMode === "room" && selectedFilter) {
      return slot.roomId === selectedFilter;
    }
    return true;
  });

  const getSlotsByDayAndTime = (dayKey: string, time: string) => {
    return filteredSchedule.filter(
      (s: any) =>
        normalizeDayKey(s.day) === normalizeDayKey(dayKey) &&
        s.startTime === time,
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                <SelectContent position="popper">
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
                  <SelectContent position="popper">
                    {teachers.map((teacher: any) => (
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
                  <SelectContent position="popper">
                    {rooms.map((room: any) => (
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

      <Card>
        <CardHeader>
          <CardTitle>{t("weeklySchedule")}</CardTitle>
          <CardDescription>{t("viewFullTimetable")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto relative">
            <div className="min-w-[1200px]">
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="font-semibold text-sm text-muted-foreground p-2 sticky left-0 bg-background z-10">
                  {t("time")}
                </div>
                {daysOfWeek.map((day: any) => (
                  <div
                    key={day.key}
                    className="font-semibold text-sm text-center p-2 bg-primary/10 rounded-md"
                  >
                    {day.label}
                  </div>
                ))}
              </div>

              <div className="space-y-2 sticky">
                {TIME_SLOTS.slice(0, -1).map((time, timeIndex) => (
                  <div key={time} className="grid grid-cols-8 gap-2">
                    <div className="flex items-center justify-center text-sm font-medium text-muted-foreground p-2 border rounded-md sticky left-0 bg-background z-10">
                      <Clock className="h-3 w-3 mr-1" />
                      {time} - {TIME_SLOTS[timeIndex + 1]}
                    </div>

                    {daysOfWeek.map((day: any) => {
                      const slots = getSlotsByDayAndTime(day.key, time);
                      const hasConflict = slots.length > 1;

                      return (
                        <div
                          key={`${day.key}-${time}`}
                          className={cn(
                            "min-h-[100px] p-2 border-2 rounded-md",
                            slots.length === 0 && "bg-muted/30",
                            hasConflict &&
                              "border-destructive bg-destructive/10",
                          )}
                        >
                          <div className="space-y-1">
                            {slots.map((slot, idx) => {
                              const teacher =
                                slot.teacher ||
                                teachers.find(
                                  (t: any) => t.id === slot.teacherId,
                                );
                              const subject =
                                slot.subject ||
                                subjects.find(
                                  (s: any) => s.id === slot.subjectId,
                                );

                              return (
                                <div
                                  key={slot.id || idx}
                                  className="p-2 bg-white dark:bg-muted border rounded text-xs space-y-1"
                                >
                                  <div className="flex justify-between items-start">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {subject?.name || t("unknownSubject")}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <UserIcon className="h-3 w-3" />
                                    <span>
                                      {teacher?.name || t("unknownTeacher")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{slot.roomId}</span>
                                  </div>
                                  {subject?.grade && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {t("grade")}: {subject.grade}
                                    </Badge>
                                  )}
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
    </div>
  );
}
