import { useState, useCallback, useEffect } from "react";
import {
  teacherActions,
  scheduleActions,
  subjectActions,
  centerActions,
} from "@/freelib/dexie/freedexieaction";
import {
  WeeklyScheduleSlot,
  Teacher,
  Schedule,
  TeacherWithSchedule,
} from "./types";
import {
  parseWeeklySchedule,
  calculateHoursDifference,
  isWithinAvailability,
} from "./utils";
import { useAuth } from "@/freelib/context/authContext";
import { useTranslations } from "next-intl";

export function useTeacherSchedule(centerId?: string) {
  const t = useTranslations("TeacherScheduleView");
  const { user } = useAuth();

  const [teachers, setTeachers] = useState<TeacherWithSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTeacherSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!user) {
        setIsLoading(false);
        return;
      }

      const [allTeachers, allSchedules, allSubjects, allCenters] =
        await Promise.all([
          teacherActions.getAll(),
          scheduleActions.getAll(),
          subjectActions.getAll(),
          centerActions.getAll(),
        ]);

      let activeTeachers = allTeachers;
      let activeSchedules = allSchedules;
      if (centerId) {
        activeSchedules = activeSchedules.filter(
          (s: any) => s.centerId === centerId,
        );
      }

      const activeSubjects = allSubjects;

      const schedulesWithData: Schedule[] = activeSchedules.map(
        (schedule: any) => {
          const teacher = activeTeachers.find(
            (t) => t.id === schedule.teacherId,
          );
          const subject = activeSubjects.find(
            (s) => s.id === schedule.subjectId,
          );

          const teacherWeeklySchedule = teacher?.weeklySchedule
            ? typeof teacher.weeklySchedule === "string"
              ? JSON.parse(teacher.weeklySchedule)
              : Array.isArray(teacher.weeklySchedule)
                ? (teacher.weeklySchedule as WeeklyScheduleSlot[])
                : undefined
            : undefined;

          return {
            id: schedule.id,
            day: schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            roomId: schedule.roomId,
            teacherId: schedule.teacherId,
            subjectId: schedule.subjectId,
            teacher: teacher
              ? {
                  id: teacher.id,
                  name: teacher.name,
                  email: teacher.email,
                  weeklySchedule: teacherWeeklySchedule,
                }
              : {
                  id: schedule.teacherId,
                  name: "Unknown Teacher",
                  weeklySchedule: undefined,
                },
            subject: subject
              ? {
                  id: subject.id,
                  name: subject.name,
                  grade: subject.grade,
                }
              : {
                  id: schedule.subjectId,
                  name: "Unknown Subject",
                  grade: "N/A",
                },
          };
        },
      );

      const teachersData: Teacher[] = activeTeachers.map((teacher) => {
        const weeklySchedule = teacher.weeklySchedule
          ? typeof teacher.weeklySchedule === "string"
            ? JSON.parse(teacher.weeklySchedule)
            : Array.isArray(teacher.weeklySchedule)
              ? (teacher.weeklySchedule as WeeklyScheduleSlot[])
              : undefined
          : undefined;

        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          weeklySchedule,
        };
      });

      const teachersWithSchedules: TeacherWithSchedule[] = teachersData.map(
        (teacher) => {
          const teacherSchedules = schedulesWithData.filter(
            (s) => s.teacherId === teacher.id,
          );

          const weeklySchedule = parseWeeklySchedule(teacher.weeklySchedule);

          const availableHours = weeklySchedule.reduce((acc, slot) => {
            return acc + calculateHoursDifference(slot.startTime, slot.endTime);
          }, 0);

          const totalHours = teacherSchedules.reduce((acc, schedule) => {
            return (
              acc +
              calculateHoursDifference(schedule.startTime, schedule.endTime)
            );
          }, 0);

          const utilizationRate =
            availableHours > 0
              ? Math.round((totalHours / availableHours) * 100)
              : 0;

          const uniqueSubjects = new Set(
            teacherSchedules.map((s) => s.subjectId),
          );

          const conflicts = teacherSchedules.filter(
            (schedule) => !isWithinAvailability(schedule, weeklySchedule),
          );

          return {
            ...teacher,
            weeklySchedule,
            schedules: teacherSchedules,
            totalHours,
            availableHours,
            utilizationRate,
            subjectsCount: uniqueSubjects.size,
            conflicts,
          };
        },
      );

      setTeachers(teachersWithSchedules);
    } catch (err) {
      console.error("Failed to fetch teacher schedules from local DB:", err);
      setError(t("errorLoadSchedules"));
    } finally {
      setIsLoading(false);
    }
  }, [t, user, centerId]);

  useEffect(() => {
    fetchTeacherSchedules();
  }, [fetchTeacherSchedules]);

  return { teachers, isLoading, error };
}
