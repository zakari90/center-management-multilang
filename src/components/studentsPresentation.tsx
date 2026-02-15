"use client";

import AddStudentDialog from "@/components/AddStudentDialog";
import { EntitySyncControls } from "@/components/EntitySyncControls";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/authContext";
import {
  studentActions,
  studentSubjectActions,
  subjectActions,
  teacherActions,
  receiptActions,
  centerActions,
} from "@/lib/dexie/dexieActions";
import { checkPaymentStatus } from "@/lib/payment-utils";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useState } from "react";
import PageHeader from "./page-header";

import { StudentsCardsView } from "./students/StudentsCardsView";
import { StudentsStats } from "./students/StudentsStats";
import { StudentsTableView } from "./students/StudentsTableView";

export interface StudentSubject {
  id: string;
  subject: {
    id: string;
    name: string;
    grade: string;
    price: number;
  };
  teacher: {
    id: string;
    name: string;
  };
}

export interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  grade: string | null;
  createdAt: string;
  studentSubjects: StudentSubject[];
  paymentStatus: {
    isPaid: boolean;
    status: "PAID" | "PARTIAL" | "UNPAID";
  };
}

export default function StudentsTable() {
  const t = useTranslations("StudentsTable");
  const { user, isLoading: authLoading } = useAuth(); // ✅ Get current user and loading state from AuthContext
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    contact: true,
    parent: true,
    subjects: true,
    monthlyFee: true,
    payment: true,
    actions: true,
  });

  const students = useLiveQuery(async () => {
    try {
      if (!user) return [];

      // ✅ Fetch from local DB and join with subjects and teachers
      const [
        allStudents,
        allStudentSubjects,
        allSubjects,
        allTeachers,
        allReceipts,
        allCenters,
      ] = await Promise.all([
        studentActions.getAll(),
        studentSubjectActions.getAll(),
        subjectActions.getAll(),
        teacherActions.getAll(),
        receiptActions.getAll(),
        centerActions.getAll(),
      ]);

      // Get center settings for payment cycle
      const currentCenter = allCenters.find((c) => c.status !== "0");
      const paymentStartDay = currentCenter?.paymentStartDay ?? 1;
      const paymentEndDay = currentCenter?.paymentEndDay ?? 30;

      const getTotalRevenueLocal = (studentSubjects: StudentSubject[]) => {
        return studentSubjects.reduce(
          (total, ss) => total + (ss?.subject?.price ?? 0),
          0,
        );
      };

      // ✅ Filter students by status only (managers see ALL students)
      const managerStudents = allStudents.filter((s) => s.status !== "0");

      // ✅ Build students with subjects
      const studentsWithSubjects: Student[] = managerStudents.map((student) => {
        const studentSubjectsForStudent = allStudentSubjects
          .filter((ss) => ss.studentId === student.id && ss.status !== "0")
          .map((ss) => {
            const subject = allSubjects.find(
              (s) => s.id === ss.subjectId && s.status !== "0",
            );
            const teacher = allTeachers.find(
              (t) => t.id === ss.teacherId && t.status !== "0",
            );
            return subject
              ? {
                  id: ss.id,
                  subject: {
                    id: subject.id,
                    name: subject.name,
                    grade: subject.grade,
                    price: subject.price,
                  },
                  teacher: teacher
                    ? {
                        id: teacher.id,
                        name: teacher.name,
                      }
                    : undefined,
                }
              : null;
          })
          .filter((ss) => ss !== null) as StudentSubject[];

        return {
          id: student.id,
          name: student.name,
          email: student.email ?? null,
          phone: student.phone ?? null,
          parentName: student.parentName ?? null,
          parentPhone: student.parentPhone ?? null,
          parentEmail: student.parentEmail ?? null,
          grade: student.grade ?? null,
          createdAt: new Date(student.createdAt).toISOString(),
          studentSubjects: studentSubjectsForStudent,
          paymentStatus: checkPaymentStatus(
            allReceipts.filter(
              (r) => r.studentId === student.id && r.status !== "0",
            ),
            paymentStartDay,
            paymentEndDay,
            getTotalRevenueLocal(studentSubjectsForStudent),
          ),
        };
      });

      return studentsWithSubjects;
    } catch (err) {
      console.error("Error fetching students:", err);
      return [];
    }
  }, [user]);

  const loading = students === undefined;

  const filteredStudents = (students || []).filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.includes(searchTerm) ||
      student.parentName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter;

    const matchesPayment =
      paymentFilter === "all" || student.paymentStatus.status === paymentFilter;

    return matchesSearch && matchesGrade && matchesPayment;
  });

  const grades = [
    "all",
    ...new Set((students || []).map((s) => s.grade).filter(Boolean)),
  ];

  const getTotalRevenue = (student: Student) => {
    if (!student?.studentSubjects) return 0;
    return student.studentSubjects.reduce(
      (total, ss) => total + (ss?.subject?.price ?? 0),
      0,
    );
  };

  const totalStudents = students?.length || 0;
  const totalRevenue = (students || []).reduce(
    (sum, student) => sum + getTotalRevenue(student),
    0,
  );
  const averageSubjects =
    totalStudents > 0
      ? (students || []).reduce(
          (sum, s) => sum + (s.studentSubjects?.length || 0),
          0,
        ) / totalStudents
      : 0;

  // Show loading while auth is checking or data is loading
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <AddStudentDialog />
          <EntitySyncControls entity="students" />
        </div>
      </div>
      {/* Stats Cards */}
      <StudentsStats
        totalStudents={totalStudents}
        filteredCount={filteredStudents.length}
        totalRevenue={totalRevenue}
        averageSubjects={averageSubjects}
      />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {grades.map((grade) => (
              <SelectItem key={grade} value={grade || ""}>
                {grade === "all" ? t("allGrades") : grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("allPaymentStatuses") || "All Payments"}
            </SelectItem>
            <SelectItem value="PAID">{t("paid")}</SelectItem>
            <SelectItem value="PARTIAL">{t("partial")}</SelectItem>
            <SelectItem value="UNPAID">{t("unpaid")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default">
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={columnVisibility.name}
                onCheckedChange={(value) =>
                  setColumnVisibility((prev) => ({ ...prev, name: !!value }))
                }
              >
                {t("name")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.contact}
                onCheckedChange={(value) =>
                  setColumnVisibility((prev) => ({ ...prev, contact: !!value }))
                }
              >
                {t("contact")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.parent}
                onCheckedChange={(value) =>
                  setColumnVisibility((prev) => ({ ...prev, parent: !!value }))
                }
              >
                {t("parent")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.subjects}
                onCheckedChange={(value) =>
                  setColumnVisibility((prev) => ({
                    ...prev,
                    subjects: !!value,
                  }))
                }
              >
                {t("subjects")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.monthlyFee}
                onCheckedChange={(value) =>
                  setColumnVisibility((prev) => ({
                    ...prev,
                    monthlyFee: !!value,
                  }))
                }
              >
                {t("monthlyFee")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.payment}
                onCheckedChange={(value) =>
                  setColumnVisibility((prev) => ({ ...prev, payment: !!value }))
                }
              >
                {t("payment")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.actions}
                onCheckedChange={(value) =>
                  setColumnVisibility((prev) => ({ ...prev, actions: !!value }))
                }
              >
                {t("actions")}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Students List - Responsive View */}

      <StudentsCardsView
        students={filteredStudents}
        getTotalRevenue={getTotalRevenue}
        onUpdate={() => {}}
        // adminMode={user?.role === "ADMIN"}
      />

      <StudentsTableView
        students={filteredStudents}
        columnVisibility={columnVisibility}
        getTotalRevenue={getTotalRevenue}
        onUpdate={() => {}}
        // adminMode={user?.role === "ADMIN"}
      />
    </div>
  );
}
