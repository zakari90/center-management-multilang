"use client";

import { Badge } from "@/freecomponents/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/freecomponents/ui/card";
import { Progress } from "@/freecomponents/ui/progress";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/freelib/context/authContext";
import {
  subjectActions,
  studentSubjectActions,
  studentActions,
  teacherActions,
  teacherSubjectActions,
} from "@/freelib/dexie/freedexieaction";

interface TopSubject {
  id: string;
  name: string;
  grade: string;
  students: number;
  revenue: number;
  maxCapacity: number;
}

import { useLiveQuery } from "dexie-react-hooks";

export default function TopSubjects() {
  const t = useTranslations("TopSubjects");
  const { user } = useAuth();
  const tGlobal = useTranslations("AllUsersTable"); // For "teacher" label

  const subjects = useLiveQuery(async () => {
    try {
      if (!user) return [];

      // ✅ Fetch from localDB instead of API
      const [
        subjectsData,
        studentSubjectsData,
        studentsData,
        teacherSubjectsData,
        teachersData,
      ] = await Promise.all([
        subjectActions.getAll(),
        studentSubjectActions.getAll(),
        studentActions.getAll(),
        teacherSubjectActions.getAll(),
        teacherActions.getAll(),
      ]);

      // Use all entities (status field is removed in local mode)
      const adminStudents = studentsData;
      const activeSubjects = subjectsData;
      const activeEnrollments = studentSubjectsData.filter((ss) =>
        adminStudents.some((s) => s.id === ss.studentId),
      );

      // Map subjects with enrollment counts and teachers
      const topSubjectsData = activeSubjects
        .map((subject) => {
          const enrollments = activeEnrollments.filter(
            (ss) => ss.subjectId === subject.id,
          );

          // Find teachers for this subject
          const assignedTeachers = teacherSubjectsData
            .filter((ts) => ts.subjectId === subject.id)
            .map((ts) => {
              const teacher = teachersData.find((t) => t.id === ts.teacherId);
              return teacher?.name;
            })
            .filter(Boolean) as string[];

          return {
            id: subject.id,
            name: subject.name,
            grade: subject.grade,
            teachers: assignedTeachers,
            students: enrollments.length,
            revenue: subject.price * enrollments.length,
            maxCapacity: 100, // Hardcoded as in API
          };
        })
        .filter((s) => s.students > 0) // Filter subjects with students
        .sort((a, b) => b.revenue - a.revenue) // Sort by revenue descending
        .slice(0, 5); // Take top 5

      return topSubjectsData;
    } catch (err) {
      console.error("Failed to fetch top subjects:", err);
      return [];
    }
  }, [user]);

  const isLoading = subjects === undefined;

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">{t("title")}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground text-sm">
            {t("noData")}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {subjects.map((subject, index) => (
              <div key={subject.id} className="space-y-2">
                {/* Header: Rank, Name, Grade, Revenue */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      variant="outline"
                      className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0 text-xs"
                    >
                      {index + 1}
                    </Badge>
                    <div className="flex flex-col">
                      <span className="font-medium truncate text-sm sm:text-base">
                        {subject.name}
                      </span>
                      <Badge variant="secondary" className="text-xs text-wrap">
                        {subject.grade}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-8 sm:ml-0">
                    <span className="text-xs sm:text-sm font-semibold text-green-600 whitespace-nowrap">
                      MAD {subject.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="flex items-center gap-2">
                  <Progress
                    value={(subject.students / subject.maxCapacity) * 100}
                    className="h-2 flex-1"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {subject.students}/{subject.maxCapacity}
                  </span>
                </div>

                {/* Students Info */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">
                    {t("studentsEnrolled", { count: subject.students })}
                  </p>
                  {subject.teachers.length > 0 && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground italic">
                      {tGlobal("teacher")}: {subject.teachers.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
