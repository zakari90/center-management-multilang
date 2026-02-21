"use client";

// import axios from 'axios' // ✅ Commented out - using localDB instead
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/authContext";
import {
  studentActions,
  studentSubjectActions,
  subjectActions,
  teacherActions,
  teacherSubjectActions,
} from "@/lib/dexie/dexieActions";
import { getChartColorArray } from "@/lib/utils/themeColors";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useLiveQuery } from "dexie-react-hooks";

interface SubjectEnrollment {
  subject: string;
  students: number;
  revenue: number;
  teacherName: string;
  originalSubjectName: string;
}

export default function EnrollmentChart() {
  const t = useTranslations("EnrollmentChart");
  const { user } = useAuth();
  const tGlobal = useTranslations("AllUsersTable");

  const data = useLiveQuery(async () => {
    try {
      if (!user) return [];

      const [studentSubjects, subjects, students, teachersData] =
        await Promise.all([
          studentSubjectActions.getAll(),
          subjectActions.getAll(),
          studentActions.getAll(),
          teacherActions.getAll(),
        ]);

      // Filter by status only (managers see ALL students)
      const managerStudents = students.filter((s) => s.status !== "0");
      const activeSubjects = subjects.filter((s) => s.status !== "0");
      const activeEnrollments = studentSubjects.filter(
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

      // Join with subjects and calculate revenue
      const chartData = Array.from(subjectTeacherMap.values())
        .map((entry) => {
          const subject = activeSubjects.find((s) => s.id === entry.subjectId);
          const teacher = teachersData.find((t) => t.id === entry.teacherId);

          if (!subject) return null;

          const teacherName = teacher?.name || tGlobal("unknownManager");

          return {
            subject: `${subject.name} (${teacherName})`,
            students: entry.students,
            revenue: subject.price * entry.students,
            teacherName: teacherName,
            originalSubjectName: subject.name,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .sort((a, b) => b.students - a.students) // Sort by most students
        .slice(0, 6); // Take top 6 pairings

      return chartData;
    } catch (err) {
      console.error("Failed to fetch enrollment data:", err);
      return [];
    }
  }, [user]);

  const isLoading = data === undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground">
            {t("noData")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="subject"
                angle={0} // ← Changed to -45 for angled labels
                textAnchor="end" // ← Keep this for angled text
                height={80} // ← Reduced height
                interval={0} // ← Show all labels
              />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "revenue") return `MAD ${value.toFixed(2)}`;
                  return value;
                }}
                labelFormatter={(label, items) => {
                  const item = items?.[0]?.payload as
                    | SubjectEnrollment
                    | undefined;
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">
                        {item?.originalSubjectName || label}
                      </span>
                      {item?.teacherName && (
                        <span className="text-xs italic text-muted-foreground">
                          {tGlobal("teacher")}: {item.teacherName}
                        </span>
                      )}
                    </div>
                  );
                }}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="students"
                fill="var(--chart-1)"
                name={t("chart.students")}
                radius={[8, 8, 0, 0]}
              >
                {data.map((entry, index) => {
                  const colors = getChartColorArray();
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
