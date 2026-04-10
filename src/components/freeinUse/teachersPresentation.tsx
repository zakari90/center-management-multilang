/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/freecomponents/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/freecomponents/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/freecomponents/ui/dropdown-menu";
import { Input } from "@/freecomponents/ui/input";
// import axios from 'axios' // ✅ Commented out - using local DB

import { StatCard } from "@/freecomponents/ui/stat-card";
import { useAuth } from "@/freelib/context/authContext";
import {
  centerActions,
  receiptActions,
  studentSubjectActions,
  subjectActions,
  teacherActions,
  teacherSubjectActions,
} from "@/freelib/dexie/freedexieaction";
import { checkPaymentStatus, PaymentStatus } from "@/freelib/payment-utils";
import { BookOpen, ChevronDown, Loader2, UserCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useState } from "react";
import AddTeacherDialog from "./AddTeacherDialog";
import PageHeader from "./page-header";
import { TeachersTableView } from "./teachers/TeachersTableView";
import { Alert, AlertDescription } from "@/freecomponents/ui/alert";

export interface TeacherSubject {
  id: string;
  percentage: number | null;
  hourlyRate: number | null;
  subject: {
    id: string;
    name: string;
    grade: string;
    price: number;
  };
}

export interface Teacher {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  weeklySchedule: any;
  createdAt: string;
  teacherSubjects: TeacherSubject[];
  paymentStatus: PaymentStatus;
  estimatedIncome?: number;
}

export default function TeachersTable() {
  const t = useTranslations("TeachersTable");
  const { user } = useAuth(); // ✅ Get current user from AuthContext
  const [searchTerm, setSearchTerm] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({
    teacher: true,
    contact: true,
    subjects: true,
    schedule: true,
    joined: true,
    actions: true,
  });

  const teachers = useLiveQuery(async () => {
    try {
      if (!user) return [];

      // ✅ Fetch from local DB and join with subjects
      const [
        allTeachers,
        allTeacherSubjects,
        allSubjects,
        allReceipts,
        allCenters,
        allStudentSubjects,
      ] = await Promise.all([
        teacherActions.getAll(),
        teacherSubjectActions.getAll(),
        subjectActions.getAll(),
        receiptActions.getAll(),
        centerActions.getAll(),
        studentSubjectActions.getAll(),
      ]);

      const currentCenter = allCenters[0]; // Simplified for local mode
      const paymentStartDay = currentCenter?.paymentStartDay ?? 1;
      const paymentEndDay = currentCenter?.paymentEndDay ?? 30;

      // ✅ Use all teachers (admins see ALL teachers in local mode)
      const adminTeachers = allTeachers;

      // ✅ Build teachers with subjects
      const teachersWithSubjects: Teacher[] = adminTeachers.map((teacher) => {
        const teacherSubjectsForTeacher = allTeacherSubjects
          .filter((ts) => ts.teacherId === teacher.id)
          .map((ts) => {
            const subject = allSubjects.find((s) => s.id === ts.subjectId);
            return subject
              ? {
                  id: ts.id,
                  percentage: ts.percentage ?? null,
                  hourlyRate: ts.hourlyRate ?? null,
                  subject: {
                    id: subject.id,
                    name: subject.name,
                    grade: subject.grade,
                    price: subject.price,
                  },
                }
              : null;
          })
          .filter((ts) => ts !== null) as TeacherSubject[];

        // ✅ Parse weeklySchedule if it's an array of JSON strings
        let parsedSchedule: any = null;
        if (teacher.weeklySchedule) {
          if (Array.isArray(teacher.weeklySchedule)) {
            try {
              parsedSchedule = teacher.weeklySchedule.map((s: any) => {
                if (typeof s === "string") {
                  return JSON.parse(s);
                }
                return s;
              });
            } catch (e) {
              console.error("Error parsing schedule:", e);
              parsedSchedule = teacher.weeklySchedule;
            }
          } else {
            parsedSchedule = teacher.weeklySchedule;
          }
        }

        // Calculate expected earnings for payment status
        const expectedEarnings = teacherSubjectsForTeacher.reduce((sum, ts) => {
          const enrolledCount = allStudentSubjects.filter(
            (ss) =>
              ss.subjectId === ts.subject.id && ss.teacherId === teacher.id,
          ).length;

          let amount = 0;
          if (ts.percentage) {
            amount = ((ts.subject.price * ts.percentage) / 100) * enrolledCount;
          } else if (ts.hourlyRate) {
            amount = ts.hourlyRate * enrolledCount;
          }
          return sum + amount;
        }, 0);

        const teacherReceipts = allReceipts.filter(
          (r) => r.teacherId === teacher.id,
        );

        const paymentStatus = checkPaymentStatus(
          teacherReceipts,
          paymentStartDay,
          paymentEndDay,
          expectedEarnings > 0 ? expectedEarnings : undefined,
        );

        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email ?? null,
          phone: teacher.phone ?? null,
          address: teacher.address ?? null,
          weeklySchedule: parsedSchedule,
          createdAt: new Date(teacher.createdAt).toISOString(),
          teacherSubjects: teacherSubjectsForTeacher,
          paymentStatus,
          estimatedIncome: expectedEarnings,
        };
      });

      return teachersWithSubjects;
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
      return [];
    }
  }, [user]);

  const isLoading = teachers === undefined;

  const filteredTeachers = (teachers || []).filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.phone?.includes(searchTerm),
  );

  const getAvailableDays = (schedule: any) => {
    if (!schedule || !Array.isArray(schedule)) return t("notSet");
    return schedule.map((s: any) => s.day).join(", ") || t("notSet");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <AddTeacherDialog />
          {/* Legacy sync controls removed */}
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 m-3">
        <StatCard
          title={t("totalTeachers")}
          value={teachers?.length || 0}
          icon={Users}
        />
        <StatCard
          title={t("activeTeachers")}
          value={
            (teachers || []).filter((t) => t.teacherSubjects.length > 0).length
          }
          icon={UserCheck}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          valueColor="text-green-600"
        />
        <StatCard
          title={t("subjectsCovered")}
          value={
            new Set(
              (teachers || []).flatMap((t) =>
                t.teacherSubjects.map((ts) => ts.subject.id),
              ),
            ).size
          }
          icon={BookOpen}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          valueColor="text-blue-600"
        />
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader className="flex flex-col lg:flex-row justify-between gap-4 mb-2">
          <div className=" lg:w-1/3 ">
            <CardTitle>{t("teachersList")}</CardTitle>
            <CardDescription>
              {filteredTeachers.length > 0
                ? t("showing", {
                    count: filteredTeachers.length,
                    total: teachers?.length || 0,
                  })
                : t("noTeachersFound")}
            </CardDescription>
          </div>

          {/* Search Input & Column Visibility */}
          <div className="flex gap-2 lg:w-2/3">
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default">
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.teacher}
                  onCheckedChange={(value) =>
                    setColumnVisibility((prev) => ({
                      ...prev,
                      teacher: !!value,
                    }))
                  }
                >
                  {t("teacher")}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.contact}
                  onCheckedChange={(value) =>
                    setColumnVisibility((prev) => ({
                      ...prev,
                      contact: !!value,
                    }))
                  }
                >
                  {t("contact")}
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
                  checked={columnVisibility.schedule}
                  onCheckedChange={(value) =>
                    setColumnVisibility((prev) => ({
                      ...prev,
                      schedule: !!value,
                    }))
                  }
                >
                  {t("schedule")}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.joined}
                  onCheckedChange={(value) =>
                    setColumnVisibility((prev) => ({
                      ...prev,
                      joined: !!value,
                    }))
                  }
                >
                  {t("joined")}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.actions}
                  onCheckedChange={(value) =>
                    setColumnVisibility((prev) => ({
                      ...prev,
                      actions: !!value,
                    }))
                  }
                >
                  {t("actions")}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <TeachersTableView
            teachers={filteredTeachers}
            columnVisibility={columnVisibility}
            onUpdate={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  );
}
