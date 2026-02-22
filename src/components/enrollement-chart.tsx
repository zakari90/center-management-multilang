"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/authContext";
import {
  studentActions,
  studentSubjectActions,
  subjectActions,
  teacherActions,
  teacherSubjectActions,
} from "@/lib/dexie/dexieActions";
import { getChartColorArray } from "@/lib/utils/themeColors";
import { Loader2, Users, BookOpen, DollarSign, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useLiveQuery } from "dexie-react-hooks";

interface EnrollmentData {
  subject: string;
  grade: string;
  students: number;
  revenue: number;
  teachers: string[];
  price: number;
}

export default function EnrollmentChart() {
  const t = useTranslations("EnrollmentChart");
  const tGlobal = useTranslations("AllUsersTable");
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<EnrollmentData | null>(
    null,
  );

  const data = useLiveQuery(async () => {
    try {
      if (!user) return [];

      const [
        studentSubjects,
        subjects,
        students,
        teacherSubjectsData,
        teachersData,
      ] = await Promise.all([
        studentSubjectActions.getAll(),
        subjectActions.getAll(),
        studentActions.getAll(),
        teacherSubjectActions.getAll(),
        teacherActions.getAll(),
      ]);

      const managerStudents = students.filter((s) => s.status !== "0");
      const activeSubjects = subjects.filter((s) => s.status !== "0");
      const activeEnrollments = studentSubjects.filter(
        (ss) =>
          ss.status !== "0" &&
          managerStudents.some((s) => s.id === ss.studentId),
      );

      const enrollmentMap = new Map<string, number>();
      activeEnrollments.forEach((enrollment) => {
        const count = enrollmentMap.get(enrollment.subjectId) || 0;
        enrollmentMap.set(enrollment.subjectId, count + 1);
      });

      const chartData: EnrollmentData[] = Array.from(enrollmentMap.entries())
        .map(([subjectId, studentsCount]) => {
          const subject = activeSubjects.find((s) => s.id === subjectId);

          const assignedTeachers = teacherSubjectsData
            .filter((ts) => ts.subjectId === subjectId && ts.status !== "0")
            .map((ts) => {
              const teacher = teachersData.find((t) => t.id === ts.teacherId);
              return teacher?.name;
            })
            .filter(Boolean) as string[];

          return {
            subject: subject?.name || "Unknown",
            grade: subject?.grade || "",
            students: studentsCount,
            revenue: (subject?.price || 0) * studentsCount,
            teachers: assignedTeachers,
            price: subject?.price || 0,
          };
        })
        .sort((a, b) => b.students - a.students)
        .slice(0, 6);

      return chartData;
    } catch (err) {
      console.error("Failed to fetch enrollment data:", err);
      return [];
    }
  }, [user]);

  const isLoading = data === undefined;
  const colors = getChartColorArray();

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const item: EnrollmentData = payload[0]?.payload;
    return (
      <div className="bg-popover border rounded-lg p-3 shadow-lg min-w-[180px]">
        <p className="font-semibold text-sm mb-1">{item.subject}</p>
        {item.grade && (
          <p className="text-xs text-muted-foreground mb-2">{item.grade}</p>
        )}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {t("chart.students")}
            </span>
            <span className="font-medium">{item.students}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {t("revenue")}
            </span>
            <span className="font-medium text-green-600">
              MAD {item.revenue.toFixed(2)}
            </span>
          </div>
          {item.teachers.length > 0 && (
            <div className="pt-1 border-t mt-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {tGlobal("teacher")}:
              </span>
              <span className="font-medium">{item.teachers.join(", ")}</span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic">
          {t("clickForMore")}
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground">
            {t("noData")}
          </div>
        ) : (
          <>
            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data}
                onClick={(state: any) => {
                  if (state?.activePayload?.[0]?.payload) {
                    setSelectedSubject(state.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="subject"
                  angle={0}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="students"
                  fill="var(--chart-1)"
                  name={t("chart.students")}
                  radius={[8, 8, 0, 0]}
                  cursor="pointer"
                >
                  {data.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Custom Legend: Subject → Teacher mapping */}
            <div className="border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {t("legend")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.map((item, index) => (
                  <button
                    key={item.subject}
                    onClick={() => setSelectedSubject(item)}
                    className="flex items-start gap-2 text-left p-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <span
                      className="w-3 h-3 rounded-sm mt-0.5 shrink-0"
                      style={{
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {item.subject}
                        {item.grade && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            · {item.grade}
                          </span>
                        )}
                      </p>
                      {item.teachers.length > 0 ? (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {tGlobal("teacher")}: {item.teachers.join(", ")}
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic">
                          {t("noTeacher")}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Click Detail Panel */}
            {selectedSubject && (
              <div className="border rounded-lg p-4 bg-muted/30 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {selectedSubject.subject}
                    {selectedSubject.grade && (
                      <Badge variant="secondary" className="text-[10px]">
                        {selectedSubject.grade}
                      </Badge>
                    )}
                  </h4>
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {t("chart.students")}
                    </p>
                    <p className="text-lg font-bold flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-500" />
                      {selectedSubject.students}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {t("revenue")}
                    </p>
                    <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {selectedSubject.revenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {t("pricePerStudent")}
                    </p>
                    <p className="text-sm font-semibold">
                      MAD {selectedSubject.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                {selectedSubject.teachers.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                      {tGlobal("teacher")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedSubject.teachers.map((teacher) => (
                        <Badge
                          key={teacher}
                          variant="outline"
                          className="text-xs"
                        >
                          {teacher}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
