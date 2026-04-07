"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { ProgramGrid } from "./ProgramGrid";
import { AddClassDialog } from "./AddClassDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar } from "lucide-react";
import {
  scheduleActions,
  teacherActions,
  subjectActions,
  centerActions,
  teacherSubjectActions,
} from "@/lib/dexie/dexieActions";
import { useAuth } from "@/context/authContext";
import { TeacherList } from "./TeacherList";
import { SyncIssuesPanel } from "./SyncIssuesPanel";

// Detailed types for the new implementation
export interface ScheduleSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  subjectId: string;
  roomId: string;
}

export interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  teachingHours?: number;
  availableHours?: number;
  subjects?: string[];
}

export interface Subject {
  id: string;
  name: string;
  grade: string;
}

export interface TeacherSubject {
  teacherId: string;
  subjectId: string;
  percentage?: number;
  hourlyRate?: number;
}

interface ProgramViewProps {
  onScheduleChangeAction?: () => void;
  isFree?: boolean;
}

export function ProgramView({ onScheduleChangeAction, isFree = false }: ProgramViewProps) {
  const t = useTranslations("Program");
  const { user, isFreeMode: contextIsFree } = useAuth();
  const isFreeMode = isFree || contextIsFree;

  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        allSchedules,
        allTeachers,
        allSubjects,
        allCenters,
        allTeacherSubjects,
      ] = await Promise.all([
        scheduleActions.getAll(),
        teacherActions.getAll(),
        subjectActions.getAll(),
        centerActions.getAll(),
        teacherSubjectActions.getAll(),
      ]);

      // Filter active records and cast to our local UI interface
      const activeSchedules = allSchedules.filter((s) => s.status !== "0");
      setSchedules(activeSchedules as unknown as ScheduleSlot[]);

      const activeSubjects = allSubjects.filter((s) => s.status !== "0");
      setSubjects(
        activeSubjects.map((s) => ({ id: s.id, name: s.name, grade: s.grade })),
      );

      setTeacherSubjects(
        allTeacherSubjects.filter(
          (ts) => ts.status !== "0",
        ) as unknown as TeacherSubject[],
      );

      // Helper to calculate duration in hours
      const calculateDuration = (start: string, end: string): number => {
        if (!start || !end) return 0;
        const [startH, startM] = start.split(":").map(Number);
        const [endH, endM] = end.split(":").map(Number);
        const startTotalMinutes = (startH || 0) * 60 + (startM || 0);
        const endTotalMinutes = (endH || 0) * 60 + (endM || 0);
        return Math.max(0, (endTotalMinutes - startTotalMinutes) / 60);
      };

      // Enhance teachers with subjects and calculated hours
      const activeTeachers = allTeachers
        .filter((t) => t.status !== "0")
        .map((t) => {
          // Find subjects for this teacher
          const subjectsForTeacher = allTeacherSubjects
            .filter((ts) => ts.teacherId === t.id && ts.status !== "0")
            .map((ts) => {
              const sub = activeSubjects.find((s) => s.id === ts.subjectId);
              return sub ? `${sub.name} (${sub.grade})` : null;
            })
            .filter(Boolean) as string[];

          // Calculate hours from schedule
          let teachingHours = 0;
          activeSchedules.forEach((s) => {
            if (s.teacherId === t.id) {
              teachingHours += calculateDuration(s.startTime, s.endTime);
            }
          });

          // Calculate potential hours from weeklySchedule
          let potentialHours = 0;
          if (t.weeklySchedule) {
            try {
              const schedule =
                typeof t.weeklySchedule === "string"
                  ? JSON.parse(t.weeklySchedule)
                  : t.weeklySchedule;

              if (Array.isArray(schedule)) {
                schedule.forEach((slotData) => {
                  const slot =
                    typeof slotData === "string"
                      ? JSON.parse(slotData)
                      : slotData;
                  if (slot.startTime && slot.endTime) {
                    potentialHours += calculateDuration(
                      slot.startTime,
                      slot.endTime,
                    );
                  }
                });
              }
            } catch (e) {
              console.error("Error parsing weekly schedule for teacher:", e);
            }
          }

          return {
            id: t.id,
            name: t.name,
            email: t.email,
            phone: t.phone,
            subjects: subjectsForTeacher,
            teachingHours: Math.round(teachingHours * 10) / 10,
            availableHours: Math.max(
              0,
              Math.round((potentialHours - teachingHours) * 10) / 10,
            ),
          };
        });
      setTeachers(activeTeachers);

      // Get rooms from centers logic
      const uniqueRooms = Array.from(
        new Set(
          allCenters
            .filter((c) => c.status !== "0")
            .flatMap((c) => c.classrooms || []),
        ),
      );

      if (uniqueRooms.length === 0) {
        setRooms(["Room 1", "Room 2", "Room 3", "Hall A"]);
      } else {
        setRooms(uniqueRooms);
      }
    } catch (error) {
      console.error("Failed to fetch program data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSlotClick = (day: string, startTime: string, endTime: string) => {
    setSelectedSlot({ day, startTime, endTime });
    setIsDialogOpen(true);
  };

  const handleSuccess = async () => {
    await fetchData();
    setIsDialogOpen(false);
    onScheduleChangeAction?.();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          {t("loading") || "Building your program..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Issues Panel - hide in Free Mode */}
      {!isFreeMode && (
        <SyncIssuesPanel
          onResolved={fetchData}
          teachers={teachers}
          subjects={subjects}
        />
      )}

      <Tabs defaultValue="schedule" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger
              value="schedule"
              className="rounded-lg flex items-center gap-2 px-4 py-2"
            >
              <Calendar className="w-4 h-4" />
              {t("weeklySchedule") || "Weekly Schedule"}
            </TabsTrigger>
            <TabsTrigger
              value="teachers"
              className="rounded-lg flex items-center gap-2 px-4 py-2"
            >
              <Users className="w-4 h-4" />
              {t("teachersList") || "Teachers List"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="schedule"
          className="mt-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Card className="border-none shadow-md overflow-hidden bg-linear-to-br from-background to-muted/20">
            <CardHeader className="bg-primary/5 pb-6">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full block" />
                {t("weeklyTimetable") || "Weekly Timetable"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <ProgramGrid
                schedules={schedules}
                teachers={teachers}
                subjects={subjects}
                onSlotClick={handleSlotClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="mt-0 outline-none">
          <TeacherList
            teachers={teachers}
            teacherSubjects={teacherSubjects}
            subjects={subjects}
          />
        </TabsContent>
      </Tabs>

      <AddClassDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={selectedSlot}
        teachers={teachers}
        subjects={subjects}
        rooms={rooms}
        existingSchedules={schedules}
        onSuccess={handleSuccess}
        userId={user?.id || ""}
        isFreeMode={isFreeMode}
      />
    </div>
  );
}
