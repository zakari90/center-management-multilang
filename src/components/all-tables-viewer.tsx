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

// Table configurations for all entities
const TABLE_CONFIGS = {
  users: {
    name: "Users",
    icon: Users,
    color: "bg-blue-500",
    columns: [
      { key: "name", header: "Name", sortable: true, filterable: true },
      { key: "email", header: "Email", sortable: true, filterable: true },
      {
        key: "role",
        header: "Role",
        sortable: true,
        render: (value: string) => (
          <Badge variant={value === "ADMIN" ? "default" : "secondary"}>
            {value}
          </Badge>
        ),
      },
      {
        key: "status",
        header: "Status",
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
            {value === "1" ? "Synced" : value === "w" ? "Pending" : "Deleted"}
          </Badge>
        ),
      },
      { key: "createdAt", header: "Created", sortable: true },
    ] as ColumnDef<User>[],
    fetchData: () => localDb.users.toArray(),
  },

  teachers: {
    name: "Teachers",
    icon: GraduationCap,
    color: "bg-green-500",
    columns: [
      { key: "name", header: "Name", sortable: true, filterable: true },
      { key: "email", header: "Email", sortable: true },
      { key: "phone", header: "Phone" },
      {
        key: "status",
        header: "Status",
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
            {value === "1" ? "Synced" : value === "w" ? "Pending" : "Deleted"}
          </Badge>
        ),
      },
      { key: "createdAt", header: "Created", sortable: true },
    ] as ColumnDef<Teacher>[],
    fetchData: () => localDb.teachers.toArray(),
  },

  students: {
    name: "Students",
    icon: Users,
    color: "bg-purple-500",
    columns: [
      { key: "name", header: "Name", sortable: true, filterable: true },
      { key: "email", header: "Email", sortable: true },
      { key: "phone", header: "Phone" },
      { key: "grade", header: "Grade", sortable: true },
      { key: "parentName", header: "Parent", sortable: true },
      {
        key: "status",
        header: "Status",
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
            {value === "1" ? "Synced" : value === "w" ? "Pending" : "Deleted"}
          </Badge>
        ),
      },
    ] as ColumnDef<Student>[],
    fetchData: () => localDb.students.toArray(),
  },

  subjects: {
    name: "Subjects",
    icon: BookOpen,
    color: "bg-orange-500",
    columns: [
      { key: "name", header: "Subject", sortable: true, filterable: true },
      { key: "grade", header: "Grade", sortable: true },
      {
        key: "price",
        header: "Price",
        render: (value: number) => `${value.toFixed(2)} MAD`,
      },
      { key: "duration", header: "Duration (min)" },
      {
        key: "status",
        header: "Status",
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
            {value === "1" ? "Synced" : value === "w" ? "Pending" : "Deleted"}
          </Badge>
        ),
      },
    ] as ColumnDef<Subject>[],
    fetchData: () => localDb.subjects.toArray(),
  },

  receipts: {
    name: "Receipts",
    icon: Receipt,
    color: "bg-red-500",
    columns: [
      {
        key: "receiptNumber",
        header: "Receipt #",
        sortable: true,
        filterable: true,
      },
      {
        key: "amount",
        header: "Amount",
        sortable: true,
        render: (value: number) => `${value.toFixed(2)} MAD`,
      },
      {
        key: "type",
        header: "Type",
        render: (value: string) => (
          <Badge
            variant={value === "STUDENT_PAYMENT" ? "default" : "secondary"}
          >
            {value === "STUDENT_PAYMENT" ? "Student" : "Teacher"}
          </Badge>
        ),
      },
      { key: "paymentMethod", header: "Method" },
      { key: "date", header: "Date", sortable: true },
    ] as ColumnDef<ReceiptType>[],
    fetchData: () => localDb.receipts.toArray(),
  },

  schedules: {
    name: "Schedules",
    icon: Calendar,
    color: "bg-cyan-500",
    columns: [
      { key: "day", header: "Day", sortable: true },
      { key: "startTime", header: "Start", sortable: true },
      { key: "endTime", header: "End" },
      { key: "roomId", header: "Room" },
      {
        key: "status",
        header: "Status",
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
            {value === "1" ? "Synced" : value === "w" ? "Pending" : "Deleted"}
          </Badge>
        ),
      },
    ] as ColumnDef<Schedule>[],
    fetchData: () => localDb.schedules.toArray(),
  },

  centers: {
    name: "Centers",
    icon: Building2,
    color: "bg-indigo-500",
    columns: [
      { key: "name", header: "Name", sortable: true, filterable: true },
      { key: "address", header: "Address" },
      { key: "phone", header: "Phone" },
      {
        key: "classrooms",
        header: "Classrooms",
        render: (value: string[]) => value?.length || 0,
      },
      {
        key: "status",
        header: "Status",
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
            {value === "1" ? "Synced" : value === "w" ? "Pending" : "Deleted"}
          </Badge>
        ),
      },
    ] as ColumnDef<Center>[],
    fetchData: () => localDb.centers.toArray(),
  },
};

export function AllTablesViewer() {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          All Database Tables
        </h2>
        <p className="text-muted-foreground mt-1">
          View and manage all data in your local database
        </p>
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
                  {count} {count === 1 ? "record" : "records"}
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
          modalDescription={`View and manage all ${TABLE_CONFIGS[selectedTable].name.toLowerCase()} in your database`}
          data={tableData}
          columns={TABLE_CONFIGS[selectedTable].columns as any}
          searchPlaceholder={`Search ${TABLE_CONFIGS[selectedTable].name.toLowerCase()}...`}
          emptyMessage={`No ${TABLE_CONFIGS[selectedTable].name.toLowerCase()} found`}
          pageSize={15}
        />
      )}
    </div>
  );
}
