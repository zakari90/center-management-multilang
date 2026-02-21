"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/authContext";
import {
  subjectActions,
  studentSubjectActions,
  studentActions,
  teacherActions,
  teacherSubjectActions,
} from "@/lib/dexie/dexieActions";

interface TopSubject {
  id: string;
  name: string;
  grade: string;
  teacherName: string;
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
      const [subjectsData, studentSubjectsData, studentsData, teachersData] =
        await Promise.all([
          subjectActions.getAll(),
          studentSubjectActions.getAll(),
          studentActions.getAll(),
          teacherActions.getAll(),
        ]);

      // Filter by status only (managers see ALL students)
      const managerStudents = studentsData.filter((s) => s.status !== "0");
      const activeSubjects = subjectsData.filter((s) => s.status !== "0");
      const activeEnrollments = studentSubjectsData.filter(
        (ss) =>
          ss.status !== "0" &&
          managerStudents.some((s) => s.id === ss.studentId),
      );

      // Group by (SubjectId, TeacherId)
      const subjectTeacherMap = new Map<
        string,
        {
          subjectId: string;
          teacherId: string;
          students: number;
        }
      >();

      activeEnrollments.forEach((enrollment) => {
        const key = `${enrollment.subjectId}-${enrollment.teacherId}`;
        const existing = subjectTeacherMap.get(key);
        if (existing) {
          existing.students += 1;
        } else {
          subjectTeacherMap.set(key, {
            subjectId: enrollment.subjectId,
            teacherId: enrollment.teacherId,
            students: 1,
          });
        }
      });

      // Map to finalized TopSubject structure
      const topSubjectsData: TopSubject[] = Array.from(
        subjectTeacherMap.values(),
      )
        .map((entry) => {
          const subject = activeSubjects.find((s) => s.id === entry.subjectId);
          const teacher = teachersData.find((t) => t.id === entry.teacherId);

          if (!subject) return null;

          return {
            id: `${entry.subjectId}-${entry.teacherId}`,
            name: subject.name,
            grade: subject.grade,
            teacherName: teacher?.name || tGlobal("unknownManager"),
            students: entry.students,
            revenue: subject.price * entry.students,
            maxCapacity: 100, // Hardcoded as in API
          };
        })
        .filter((s): s is TopSubject => s !== null)
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
                        {subject.name} - {subject.teacherName}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-xs text-wrap w-fit"
                      >
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
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
