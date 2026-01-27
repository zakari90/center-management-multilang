"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { ProgramGrid } from "./ProgramGrid";
import { AddClassDialog } from "./AddClassDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar } from "lucide-react";
import { TeacherList } from "./TeacherList";
import {
  scheduleActions,
  teacherActions,
  subjectActions,
  centerActions,
  teacherSubjectActions,
} from "@/lib/dexie/dexieActions";
import { useAuth } from "@/context/authContext";

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

export function ProgramView() {
  const t = useTranslations("Program");
  const { user } = useAuth();

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
          // Simplified calculation: assuming each slot is 1 hour
          const hourCount = activeSchedules.filter(
            (s) => s.teacherId === t.id,
          ).length;

          return {
            id: t.id,
            name: t.name,
            email: t.email,
            phone: t.phone,
            subjects: subjectsForTeacher,
            teachingHours: hourCount,
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
          <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-background to-muted/20">
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
      />
    </div>
  );
}
