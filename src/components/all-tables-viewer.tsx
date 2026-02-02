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
} from "@/lib/dexie/dbSchema";
import { useTranslations } from "next-intl";
import PageHeader from "./page-header";

export function AllTablesViewer() {
  const t = useTranslations("AllTablesViewer");

  // Table configurations for all entities
  const TABLE_CONFIGS = {
    users: {
      name: t("tables.users"),
      icon: Users,
      color: "bg-blue-500",
      columns: [
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
        { key: "createdAt", header: t("columns.created"), sortable: true },
      ] as ColumnDef<User>[],
      fetchData: () => localDb.users.toArray(),
    },

    teachers: {
      name: t("tables.teachers"),
      icon: GraduationCap,
      color: "bg-green-500",
      columns: [
        {
          key: "name",
          header: t("columns.name"),
          sortable: true,
          filterable: true,
        },
        { key: "email", header: t("columns.email"), sortable: true },
        { key: "phone", header: t("columns.phone") },
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
        { key: "createdAt", header: t("columns.created"), sortable: true },
      ] as ColumnDef<Teacher>[],
      fetchData: () => localDb.teachers.toArray(),
    },

    students: {
      name: t("tables.students"),
      icon: Users,
      color: "bg-purple-500",
      columns: [
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
      ] as ColumnDef<Student>[],
      fetchData: () => localDb.students.toArray(),
    },

    subjects: {
      name: t("tables.subjects"),
      icon: BookOpen,
      color: "bg-orange-500",
      columns: [
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
        { key: "duration", header: t("columns.duration") },
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
      ] as ColumnDef<Subject>[],
      fetchData: () => localDb.subjects.toArray(),
    },

    receipts: {
      name: t("tables.receipts"),
      icon: Receipt,
      color: "bg-red-500",
      columns: [
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
        { key: "date", header: t("columns.date"), sortable: true },
      ] as ColumnDef<ReceiptType>[],
      fetchData: () => localDb.receipts.toArray(),
    },

    schedules: {
      name: t("tables.schedules"),
      icon: Calendar,
      color: "bg-cyan-500",
      columns: [
        { key: "day", header: t("columns.day"), sortable: true },
        { key: "startTime", header: t("columns.startTime"), sortable: true },
        { key: "endTime", header: t("columns.endTime") },
        { key: "roomId", header: t("columns.room") },
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
      ] as ColumnDef<Schedule>[],
      fetchData: () => localDb.schedules.toArray(),
    },

    centers: {
      name: t("tables.centers"),
      icon: Building2,
      color: "bg-indigo-500",
      columns: [
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
          render: (value: string[]) => value?.length || 0,
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
      ] as ColumnDef<Center>[],
      fetchData: () => localDb.centers.toArray(),
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
    <div className="space-y-6">
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
        {Object.entries(TABLE_CONFIGS).map(([key, config]) => {
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
                <CardTitle className="text-lg">{config.name}</CardTitle>
                <CardDescription className="text-sm mt-1">
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
        />
      )}
    </div>
  );
}
