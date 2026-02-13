"use client";

import React, { useState, useEffect } from "react";
import {
  GenericDataTable,
  GenericDataTableModal,
  ColumnDef,
} from "@/components/ui/generic-data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Users,
  GraduationCap,
  BookOpen,
  Receipt,
  Calendar,
  Building2,
  Download,
} from "lucide-react";
import { localDb } from "@/lib/dexie/dbSchema";
import type {
  User,
  Teacher,
  Student,
  Subject,
  Receipt as ReceiptType,
  Schedule,
  Center,
  TeacherSubject,
  StudentSubject,
  PushSubscription,
} from "@/lib/dexie/dbSchema";
import { useLocale, useTranslations } from "next-intl";
import PageHeader from "./page-header";

// Helper to format timestamps into human-friendly dates
function formatDate(value: number | string | undefined | null): string {
  if (!value) return "-";
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Tables to hide from the grid
const HIDDEN_TABLES = new Set(["pushSubscriptions"]);

export function AllTablesViewer() {
  const t = useTranslations("AllTablesViewer");
  const locale = useLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";

  // Table configurations for all entities
  const TABLE_CONFIGS = {
    users: {
      name: t("tables.users"),
      icon: Users,
      color: "bg-blue-500",
      columns: [
        { key: "id", header: t("columns.id"), sortable: true },
        {
          key: "name",
          header: t("columns.name"),
          sortable: true,
          filterable: true,
        },
        {
          key: "email",
          header: t("columns.email"),
          sortable: true,
          filterable: true,
        },
        { key: "password", header: t("columns.password") },
        { key: "dataEpoch", header: t("columns.dataEpoch"), sortable: true },
        {
          key: "role",
          header: t("columns.role"),
          sortable: true,
          render: (value: string) => (
            <Badge variant={value === "ADMIN" ? "default" : "secondary"}>
              {value}
            </Badge>
          ),
        },
        {
          key: "status",
          header: t("columns.status"),
          render: (value: string) => (
            <Badge
              variant={
                value === "1"
                  ? "default"
                  : value === "w"
                    ? "secondary"
                    : "destructive"
              }
            >
              {value === "1"
                ? t("status.synced")
                : value === "w"
                  ? t("status.pending")
                  : t("status.deleted")}
            </Badge>
          ),
        },
        {
          key: "createdAt",
          header: t("columns.created"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        {
          key: "updatedAt",
          header: t("columns.updatedAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
      ] as ColumnDef<User>[],
      fetchData: () => localDb.users.toArray(),
    },

    teachers: {
      name: t("tables.teachers"),
      icon: GraduationCap,
      color: "bg-green-500",
      columns: [
        { key: "id", header: t("columns.id"), sortable: true },
        {
          key: "name",
          header: t("columns.name"),
          sortable: true,
          filterable: true,
        },
        { key: "email", header: t("columns.email"), sortable: true },
        { key: "phone", header: t("columns.phone") },
        { key: "address", header: t("columns.address") },
        {
          key: "weeklySchedule",
          header: t("columns.weeklySchedule"),
          render: (value: any) => (value ? JSON.stringify(value) : "-"),
        },
        {
          key: "status",
          header: t("columns.status"),
          render: (value: string) => (
            <Badge
              variant={
                value === "1"
                  ? "default"
                  : value === "w"
                    ? "secondary"
                    : "destructive"
              }
            >
              {value === "1"
                ? t("status.synced")
                : value === "w"
                  ? t("status.pending")
                  : t("status.deleted")}
            </Badge>
          ),
        },
        { key: "managerId", header: t("columns.managerId") },
        {
          key: "createdAt",
          header: t("columns.created"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        {
          key: "updatedAt",
          header: t("columns.updatedAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
      ] as ColumnDef<Teacher>[],
      fetchData: () => localDb.teachers.toArray(),
    },

    students: {
      name: t("tables.students"),
      icon: Users,
      color: "bg-purple-500",
      columns: [
        { key: "id", header: t("columns.id"), sortable: true },
        {
          key: "name",
          header: t("columns.name"),
          sortable: true,
          filterable: true,
        },
        { key: "email", header: t("columns.email"), sortable: true },
        { key: "phone", header: t("columns.phone") },
        { key: "grade", header: t("columns.grade"), sortable: true },
        { key: "parentName", header: t("columns.parent"), sortable: true },
        { key: "parentPhone", header: t("columns.phone") },
        { key: "parentEmail", header: t("columns.email") },
        {
          key: "status",
          header: t("columns.status"),
          render: (value: string) => (
            <Badge
              variant={
                value === "1"
                  ? "default"
                  : value === "w"
                    ? "secondary"
                    : "destructive"
              }
            >
              {value === "1"
                ? t("status.synced")
                : value === "w"
                  ? t("status.pending")
                  : t("status.deleted")}
            </Badge>
          ),
        },
        { key: "managerId", header: t("columns.managerId") },
        {
          key: "createdAt",
          header: t("columns.created"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        {
          key: "updatedAt",
          header: t("columns.updatedAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
      ] as ColumnDef<Student>[],
      fetchData: () => localDb.students.toArray(),
    },

    subjects: {
      name: t("tables.subjects"),
      icon: BookOpen,
      color: "bg-orange-500",
      columns: [
        { key: "id", header: t("columns.id"), sortable: true },
        {
          key: "name",
          header: t("columns.subject"),
          sortable: true,
          filterable: true,
        },
        { key: "grade", header: t("columns.grade"), sortable: true },
        {
          key: "price",
          header: t("columns.price"),
          render: (value: number) => `${value.toFixed(2)} MAD`,
        },
        { key: "duration", header: t("columns.duration"), sortable: true },
        { key: "centerId", header: t("columns.adminId") },
        {
          key: "status",
          header: t("columns.status"),
          render: (value: string) => (
            <Badge
              variant={
                value === "1"
                  ? "default"
                  : value === "w"
                    ? "secondary"
                    : "destructive"
              }
            >
              {value === "1"
                ? t("status.synced")
                : value === "w"
                  ? t("status.pending")
                  : t("status.deleted")}
            </Badge>
          ),
        },
        {
          key: "createdAt",
          header: t("columns.created"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        {
          key: "updatedAt",
          header: t("columns.updatedAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
      ] as ColumnDef<Subject>[],
      fetchData: () => localDb.subjects.toArray(),
    },

    teacherSubjects: {
      name: t("tables.teacherSubjects"),
      icon: GraduationCap,
      color: "bg-teal-500",
      columns: [
        { key: "id", header: t("columns.id"), sortable: true },
        { key: "teacherId", header: t("columns.teacherId"), sortable: true },
        { key: "subjectId", header: t("columns.subjectId"), sortable: true },
        {
          key: "percentage",
          header: t("columns.percentage"),
          render: (value?: number) => (value ? `${value}%` : "-"),
        },
        {
          key: "hourlyRate",
          header: t("columns.hourlyRate"),
          render: (value?: number) => (value ? `${value.toFixed(2)} MAD` : "-"),
        },
        {
          key: "assignedAt",
          header: t("columns.assignedAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        {
          key: "status",
          header: t("columns.status"),
          render: (value: string) => (
            <Badge
              variant={
                value === "1"
                  ? "default"
                  : value === "w"
                    ? "secondary"
                    : "destructive"
              }
            >
              {value === "1"
                ? t("status.synced")
                : value === "w"
                  ? t("status.pending")
                  : t("status.deleted")}
            </Badge>
          ),
        },
        {
          key: "createdAt",
          header: t("columns.created"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        {
          key: "updatedAt",
          header: t("columns.updatedAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
      ] as ColumnDef<TeacherSubject>[],
      fetchData: () => localDb.teacherSubjects.toArray(),
    },

    studentSubjects: {
      name: t("tables.studentSubjects"),
      icon: Users,
      color: "bg-indigo-500",
      columns: [
        { key: "id", header: t("columns.id"), sortable: true },
        { key: "studentId", header: t("columns.studentId"), sortable: true },
        { key: "subjectId", header: t("columns.subjectId"), sortable: true },
        { key: "teacherId", header: t("columns.teacherId"), sortable: true },
        {
          key: "enrolledAt",
          header: t("columns.enrolledAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        { key: "managerId", header: t("columns.managerId") },
        {
          key: "status",
          header: t("columns.status"),
          render: (value: string) => (
            <Badge
              variant={
                value === "1"
                  ? "default"
                  : value === "w"
                    ? "secondary"
                    : "destructive"
              }
            >
              {value === "1"
                ? t("status.synced")
                : value === "w"
                  ? t("status.pending")
                  : t("status.deleted")}
            </Badge>
          ),
        },
        {
          key: "createdAt",
          header: t("columns.created"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        {
          key: "updatedAt",
          header: t("columns.updatedAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
      ] as ColumnDef<StudentSubject>[],
      fetchData: () => localDb.studentSubjects.toArray(),
    },

    receipts: {
      name: t("tables.receipts"),
      icon: Receipt,
      color: "bg-red-500",
      columns: [
        { key: "id", header: t("columns.id"), sortable: true },
        {
          key: "receiptNumber",
          header: t("columns.receiptNumber"),
          sortable: true,
          filterable: true,
        },
        {
          key: "amount",
          header: t("columns.amount"),
          sortable: true,
          render: (value: number) => `${value.toFixed(2)} MAD`,
        },
        {
          key: "type",
          header: t("columns.type"),
          render: (value: string) => (
            <Badge
              variant={value === "STUDENT_PAYMENT" ? "default" : "secondary"}
            >
              {value === "STUDENT_PAYMENT"
                ? t("types.student")
                : t("types.teacher")}
            </Badge>
          ),
        },
        { key: "paymentMethod", header: t("columns.method") },
        {
          key: "date",
          header: t("columns.date"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        { key: "studentId", header: t("columns.studentId") },
        { key: "teacherId", header: t("columns.teacherId") },
        { key: "managerId", header: t("columns.managerId") },
        {
          key: "status",
          header: t("columns.status"),
          render: (value: string) => (
            <Badge
              variant={
                value === "1"
                  ? "default"
                  : value === "w"
                    ? "secondary"
                    : "destructive"
              }
            >
              {value === "1"
                ? t("status.synced")
                : value === "w"
                  ? t("status.pending")
                  : t("status.deleted")}
            </Badge>
          ),
        },
        {
          key: "createdAt",
          header: t("columns.created"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        {
          key: "updatedAt",
          header: t("columns.updatedAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
      ] as ColumnDef<ReceiptType>[],
      fetchData: () => localDb.receipts.toArray(),
    },

    schedules: {
      name: t("tables.schedules"),
      icon: Calendar,
      color: "bg-cyan-500",
      columns: [
        { key: "id", header: t("columns.id"), sortable: true },
        { key: "day", header: t("columns.day"), sortable: true },
        { key: "startTime", header: t("columns.startTime"), sortable: true },
        { key: "endTime", header: t("columns.endTime") },
        {
          key: "subjectName",
          header: t("columns.subject"),
          sortable: true,
          filterable: true,
        },
        {
          key: "teacherName",
          header: t("columns.teacher"),
          sortable: true,
          filterable: true,
        },
        { key: "roomId", header: t("columns.room") },
        { key: "teacherId", header: t("columns.teacherId") },
        { key: "subjectId", header: t("columns.subjectId") },
        { key: "managerId", header: t("columns.managerId") },
        { key: "centerId", header: t("columns.adminId") },
        {
          key: "status",
          header: t("columns.status"),
          render: (value: string) => (
            <Badge
              variant={
                value === "1"
                  ? "default"
                  : value === "w"
                    ? "secondary"
                    : "destructive"
              }
            >
              {value === "1"
                ? t("status.synced")
                : value === "w"
                  ? t("status.pending")
                  : t("status.deleted")}
            </Badge>
          ),
        },
        {
          key: "createdAt",
          header: t("columns.created"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        {
          key: "updatedAt",
          header: t("columns.updatedAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
      ] as ColumnDef<
        Schedule & { teacherName?: string; subjectName?: string }
      >[],
      fetchData: async () => {
        const [schedules, teachers, subjects] = await Promise.all([
          localDb.schedules.toArray(),
          localDb.teachers.toArray(),
          localDb.subjects.toArray(),
        ]);

        const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));
        const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

        return schedules.map((schedule) => ({
          ...schedule,
          teacherName: teacherMap.get(schedule.teacherId) || t("unknown"),
          subjectName: subjectMap.get(schedule.subjectId) || t("unknown"),
        }));
      },
    },

    centers: {
      name: t("tables.centers"),
      icon: Building2,
      color: "bg-indigo-500",
      columns: [
        { key: "id", header: t("columns.id"), sortable: true },
        {
          key: "name",
          header: t("columns.name"),
          sortable: true,
          filterable: true,
        },
        { key: "address", header: t("columns.address") },
        { key: "phone", header: t("columns.phone") },
        {
          key: "classrooms",
          header: t("columns.classrooms"),
          render: (value: string[]) => value?.join(", ") || "-",
        },
        {
          key: "workingDays",
          header: t("columns.workingDays"),
          render: (value: string[]) => value?.join(", ") || "-",
        },
        { key: "paymentStartDay", header: t("columns.paymentStartDay") },
        { key: "paymentEndDay", header: t("columns.paymentEndDay") },
        { key: "academicYear", header: t("columns.academicYear") },
        { key: "staffEntryDate", header: t("columns.staffEntryDate") },
        { key: "studentEntryDate", header: t("columns.studentEntryDate") },
        { key: "schoolEndDateBac", header: t("columns.schoolEndDateBac") },
        { key: "schoolEndDateOther", header: t("columns.schoolEndDateOther") },
        { key: "homeTitle", header: t("columns.homeTitle") },
        { key: "homeSubtitle", header: t("columns.homeSubtitle") },
        { key: "homeBadge", header: t("columns.homeBadge") },
        { key: "homeDescription", header: t("columns.homeDescription") },
        { key: "homeCtaText", header: t("columns.homeCtaText") },
        { key: "homePhone", header: t("columns.homePhone") },
        { key: "homeAddress", header: t("columns.homeAddress") },
        {
          key: "publicRegistrationEnabled",
          header: t("columns.publicRegistrationEnabled"),
          render: (value: boolean) => (value ? t("yes") : t("no")),
        },
        {
          key: "managers",
          header: t("columns.managers"),
          render: (value: string[]) => value?.join(", ") || "-",
        },
        { key: "adminId", header: t("columns.adminId") },
        {
          key: "status",
          header: t("columns.status"),
          render: (value: string) => (
            <Badge
              variant={
                value === "1"
                  ? "default"
                  : value === "w"
                    ? "secondary"
                    : "destructive"
              }
            >
              {value === "1"
                ? t("status.synced")
                : value === "w"
                  ? t("status.pending")
                  : t("status.deleted")}
            </Badge>
          ),
        },
        {
          key: "createdAt",
          header: t("columns.created"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        {
          key: "updatedAt",
          header: t("columns.updatedAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
      ] as ColumnDef<Center>[],
      fetchData: () => localDb.centers.toArray(),
    },

    pushSubscriptions: {
      name: t("tables.pushSubscriptions"),
      icon: Database,
      color: "bg-slate-500",
      columns: [
        { key: "id", header: t("columns.id"), sortable: true },
        { key: "endpoint", header: t("columns.endpoint"), sortable: true },
        {
          key: "keys",
          header: t("columns.keys"),
          render: (value: any) => (value ? JSON.stringify(value) : "-"),
        },
        { key: "userId", header: t("columns.userId") },
        { key: "role", header: t("columns.role") },
        {
          key: "status",
          header: t("columns.status"),
          render: (value: string) => (
            <Badge
              variant={
                value === "1"
                  ? "default"
                  : value === "w"
                    ? "secondary"
                    : "destructive"
              }
            >
              {value === "1"
                ? t("status.synced")
                : value === "w"
                  ? t("status.pending")
                  : t("status.deleted")}
            </Badge>
          ),
        },
        {
          key: "createdAt",
          header: t("columns.created"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
        {
          key: "updatedAt",
          header: t("columns.updatedAt"),
          sortable: true,
          render: (v: number) => formatDate(v),
        },
      ] as ColumnDef<PushSubscription>[],
      fetchData: () => localDb.pushSubscriptions.toArray(),
    },
  };

  const [selectedTable, setSelectedTable] = useState<
    keyof typeof TABLE_CONFIGS | null
  >(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load counts for all tables
  useEffect(() => {
    const loadCounts = async () => {
      const counts: Record<string, number> = {};
      for (const [key, config] of Object.entries(TABLE_CONFIGS)) {
        const data = await config.fetchData();
        counts[key] = data.length;
      }
      setTableCounts(counts);
    };
    loadCounts();
  }, []);

  // Load data when table is selected
  useEffect(() => {
    if (!selectedTable) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const config = TABLE_CONFIGS[selectedTable];
        const data = await config.fetchData();
        setTableData(data);
      } catch (error) {
        console.error("Failed to load table data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedTable]);

  const handleExportAll = async () => {
    setIsLoading(true);
    try {
      const allData: Record<string, any[]> = {};

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `database_export_${timestamp}.json`;

      for (const [key, config] of Object.entries(TABLE_CONFIGS)) {
        allData[key] = await config.fetchData();
      }

      const jsonString = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir={direction}>
      <div className="flex flex-col md:flex-row items-center justify-between">
        <PageHeader title={t("title")} subtitle={t("description")} />
        <Button
          onClick={handleExportAll}
          disabled={isLoading}
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isLoading ? t("exportButton.loading") : t("exportButton.default")}
        </Button>
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(TABLE_CONFIGS)
          .filter(([key]) => !HIDDEN_TABLES.has(key))
          .map(([key, config]) => {
            const Icon = config.icon;
            const count = tableCounts[key] || 0;

            return (
              <Card
                key={key}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() =>
                  setSelectedTable(key as keyof typeof TABLE_CONFIGS)
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-lg ${config.color} bg-opacity-10`}
                    >
                      <Icon
                        className={`h-5 w-5 ${config.color.replace("bg-", "text-")}`}
                      />
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg text-center">
                    {config.name}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 text-center">
                    {count} {count === 1 ? t("record") : t("records")}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Modal with table data */}
      {selectedTable && (
        <GenericDataTableModal
          open={!!selectedTable}
          onOpenChange={(open) => !open && setSelectedTable(null)}
          modalTitle={TABLE_CONFIGS[selectedTable].name}
          modalDescription={t("modalDescription", {
            table: TABLE_CONFIGS[selectedTable].name.toLowerCase(),
          })}
          data={tableData}
          columns={TABLE_CONFIGS[selectedTable].columns as any}
          searchPlaceholder={t("searchPlaceholder", {
            table: TABLE_CONFIGS[selectedTable].name.toLowerCase(),
          })}
          emptyMessage={t("emptyMessage", {
            table: TABLE_CONFIGS[selectedTable].name.toLowerCase(),
          })}
          pageSize={15}
          dir={direction}
          translations={{
            previous: t("pagination.previous"),
            next: t("pagination.next"),
            pageOf: t("pagination.pageOf"),
            result: t("pagination.result"),
            results: t("pagination.results"),
            yes: t("yes"),
            no: t("no"),
            actions: t("pagination.actions"),
            noData: t("pagination.noData"),
          }}
        />
      )}
    </div>
  );
}
