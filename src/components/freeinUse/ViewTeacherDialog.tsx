"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  teacherActions,
  teacherSubjectActions,
  subjectActions,
} from "@/freelib/dexie/freedexieaction";
import EditTeacherDialog from "@/components/freeinUse/EditTeacherDialog";

interface Subject {
  id: string;
  name: string;
  grade: string;
  price: number;
}

interface TeacherSubject {
  id: string;
  subjectId: string;
  percentage: number | null;
  hourlyRate: number | null;
  subject: Subject;
}

interface DaySchedule {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface Teacher {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  weeklySchedule: DaySchedule[];
  teacherSubjects: TeacherSubject[];
}

interface ViewTeacherDialogProps {
  teacherId: string;
  trigger?: React.ReactNode;
}

export default function ViewTeacherDialog({
  teacherId,
  trigger,
}: ViewTeacherDialogProps) {
  const t = useTranslations("TeacherProfile");
  const [open, setOpen] = useState(false);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTeacher = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [allTeachers, allTeacherSubjects, allSubjects] = await Promise.all([
        teacherActions.getAll(),
        teacherSubjectActions.getAll(),
        subjectActions.getAll(),
      ]);

      const teacherData = allTeachers.find((t) => t.id === teacherId);
      if (!teacherData) {
        throw new Error(t("notFound"));
      }

      const teacherSubjectsData = allTeacherSubjects
        .filter((ts) => ts.teacherId === teacherId)
        .map((ts) => {
          const subject = allSubjects.find((s) => s.id === ts.subjectId);
          if (!subject) return null;
          return {
            id: ts.id,
            subjectId: ts.subjectId,
            percentage: ts.percentage ?? null,
            hourlyRate: ts.hourlyRate ?? null,
            subject: {
              id: subject.id,
              name: subject.name,
              grade: subject.grade,
              price: subject.price,
            },
          };
        })
        .filter((ts) => ts !== null) as TeacherSubject[];

      let weeklyScheduleData: DaySchedule[] = [];
      if (teacherData.weeklySchedule) {
        try {
          const schedule =
            typeof teacherData.weeklySchedule === "string"
              ? JSON.parse(teacherData.weeklySchedule)
              : teacherData.weeklySchedule;

          if (Array.isArray(schedule)) {
            weeklyScheduleData = schedule.map((s: unknown) => {
              const parsed = typeof s === "string" ? JSON.parse(s) : s;
              return {
                day: (parsed as { day: string }).day,
                startTime: (parsed as { startTime: string }).startTime,
                endTime: (parsed as { endTime: string }).endTime,
                isAvailable: true,
              };
            });
          }
        } catch (e) {
          console.error("Error parsing weekly schedule:", e);
        }
      }

      setTeacher({
        id: teacherData.id,
        name: teacherData.name,
        email: teacherData.email ?? null,
        phone: teacherData.phone ?? null,
        address: teacherData.address ?? null,
        weeklySchedule: weeklyScheduleData,
        teacherSubjects: teacherSubjectsData,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t("errorLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [teacherId, t]);

  useEffect(() => {
    if (open && teacherId) {
      fetchTeacher();
    }
  }, [open, teacherId, fetchTeacher]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" title={t("viewDetails")}>
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{teacher?.name || t("teacherDetails")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("viewDetails")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error || !teacher ? (
          <Alert variant="destructive">
            <AlertDescription>{error || t("notFound")}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("overview")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("email")}
                    </p>
                    <p className="font-medium">{teacher.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("phone")}
                    </p>
                    <p className="font-medium">{teacher.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("address")}
                    </p>
                    <p className="font-medium">{teacher.address || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("totalSubjects")}
                    </p>
                    <p className="font-medium">
                      {teacher.teacherSubjects?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subjects */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("subjectsTitle")}</CardTitle>
                <CardDescription>{t("subjectsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {teacher.teacherSubjects?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("noSubjects")}
                  </p>
                ) : (
                  teacher.teacherSubjects.map((ts) => (
                    <div
                      key={ts.id}
                      className="border p-3 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{ts.subject.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("grade")}: {ts.subject.grade}
                        </p>
                      </div>
                      <div>
                        {ts.percentage ? (
                          <Badge variant="secondary">{ts.percentage}%</Badge>
                        ) : ts.hourlyRate ? (
                          <Badge variant="secondary">
                            MAD {ts.hourlyRate}/hr
                          </Badge>
                        ) : (
                          <Badge>{t("noCompensation")}</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Schedule */}
            {teacher.weeklySchedule?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {t("scheduleTitle")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {teacher.weeklySchedule.map((day) => (
                    <div
                      key={day.day}
                      className="flex justify-between items-center border rounded-md p-2"
                    >
                      <span className="font-medium text-sm">{day.day}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Edit Button */}
            <div className="flex justify-end pt-2">
              <EditTeacherDialog
                teacherId={teacher.id}
                onTeacherUpdated={fetchTeacher}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
