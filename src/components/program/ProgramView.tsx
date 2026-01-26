"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { ProgramGrid } from "./ProgramGrid";
import { AddClassDialog } from "./AddClassDialog";
import {
  scheduleActions,
  teacherActions,
  subjectActions,
  centerActions,
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
}

export interface Subject {
  id: string;
  name: string;
  grade: string;
}

export function ProgramView() {
  const t = useTranslations("Program");
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allSchedules, allTeachers, allSubjects, allCenters] =
        await Promise.all([
          scheduleActions.getAll(),
          teacherActions.getAll(),
          subjectActions.getAll(),
          centerActions.getAll(),
        ]);

      // Filter active records and cast to our local UI interface
      const activeSchedules = allSchedules.filter((s) => s.status !== "0");
      setSchedules(activeSchedules as unknown as ScheduleSlot[]);

      setTeachers(
        allTeachers
          .filter((t) => t.status !== "0")
          .map((t) => ({ id: t.id, name: t.name })),
      );
      setSubjects(
        allSubjects
          .filter((s) => s.status !== "0")
          .map((s) => ({ id: s.id, name: s.name, grade: s.grade })),
      );

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
