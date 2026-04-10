"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { IdCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import StudentCard from "@/components/freeinUse/studentCard";
import PdfExporter from "@/components/freeinUse/pdfExporter";
import {
  studentActions,
  studentSubjectActions,
  subjectActions,
  teacherActions,
} from "@/freelib/dexie/freedexieaction";

interface Subject {
  id: string;
  name: string;
  grade: string;
  price?: number;
}

interface Teacher {
  id: string;
  name: string;
}

interface StudentSubject {
  id: string;
  subject: Subject;
  teacher: Teacher;
}

interface Student {
  id: string;
  name: string;
  grade: string | null;
  email: string | null;
  phone: string | null;
  studentSubjects: StudentSubject[];
}

interface ViewStudentCardDialogProps {
  studentId: string;
  trigger?: React.ReactNode;
}

export default function ViewStudentCardDialog({
  studentId,
  trigger,
}: ViewStudentCardDialogProps) {
  const t = useTranslations("StudentCardPage");
  const [open, setOpen] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allStudents, allStudentSubjects, allSubjects, allTeachers] =
        await Promise.all([
          studentActions.getAll(),
          studentSubjectActions.getAll(),
          subjectActions.getAll(),
          teacherActions.getAll(),
        ]);

      const studentData = allStudents.find((s) => s.id === studentId);
      if (!studentData) {
        setError(t("studentNotFound"));
        return;
      }

      const studentSubjectsData = allStudentSubjects
        .filter((ss) => ss.studentId === studentId)
        .map((ss) => {
          const subject = allSubjects.find((s) => s.id === ss.subjectId);
          const teacher = allTeachers.find((t) => t.id === ss.teacherId);
          if (!subject || !teacher) return null;
          return {
            id: ss.id,
            subject: {
              id: subject.id,
              name: subject.name,
              grade: subject.grade,
              price: subject.price,
            },
            teacher: {
              id: teacher.id,
              name: teacher.name,
            },
          };
        })
        .filter((ss) => ss !== null) as StudentSubject[];

      setStudent({
        id: studentData.id,
        name: studentData.name,
        email: studentData.email ?? null,
        phone: studentData.phone ?? null,
        grade: studentData.grade ?? null,
        studentSubjects: studentSubjectsData,
      });
    } catch (err) {
      console.error(t("errorFetchStudent"), err);
      setError(t("errorFetchStudent"));
    } finally {
      setIsLoading(false);
    }
  }, [studentId, t]);

  useEffect(() => {
    if (open && studentId) {
      fetchStudent();
    }
  }, [open, studentId, fetchStudent]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" title={t("title")}>
            <IdCard className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("title")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error || !student ? (
          <Alert variant="destructive">
            <AlertDescription>{error || t("studentNotFound")}</AlertDescription>
          </Alert>
        ) : (
          <div className="p-2">
            <PdfExporter fileName={student.name}>
              <StudentCard student={student} showQR={true} />
            </PdfExporter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
