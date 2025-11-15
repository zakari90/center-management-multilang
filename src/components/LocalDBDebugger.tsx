/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { localDb } from "@/lib/dexie/dbSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/authContext";

/**
 * Debug component to view local DB contents on mobile
 * Shows counts and allows viewing data for each table
 */
export function LocalDBDebugger() {
  const t = useTranslations("LocalDBDebugger");
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCounts();
  }, [user]);

  const loadCounts = async () => {
    try {
      const [users, centers, teachers, students, subjects, teacherSubjects, studentSubjects, receipts, schedules] =
        await Promise.all([
          localDb.users.count(),
          localDb.centers.count(),
          localDb.teachers.count(),
          localDb.students.count(),
          localDb.subjects.count(),
          localDb.teacherSubjects.count(),
          localDb.studentSubjects.count(),
          localDb.receipts.count(),
          localDb.schedules.count(),
        ]);

      setCounts({
        users,
        centers,
        teachers,
        students,
        subjects,
        teacherSubjects,
        studentSubjects,
        receipts,
        schedules,
      });
    } catch (error) {
      console.error("Error loading counts:", error);
    }
  };

  const loadTableData = async (tableName: string) => {
    if (tableData[tableName]) {
      // Already loaded, just toggle
      setExpandedTable(expandedTable === tableName ? null : tableName);
      return;
    }

    setIsLoading(true);
    try {
      let data: any[] = [];
      
      switch (tableName) {
        case "users":
          data = await localDb.users.toArray();
          break;
        case "centers":
          data = await localDb.centers.toArray();
          break;
        case "teachers":
          data = await localDb.teachers.toArray();
          break;
        case "students":
          data = await localDb.students.toArray();
          break;
        case "subjects":
          data = await localDb.subjects.toArray();
          break;
        case "teacherSubjects":
          data = await localDb.teacherSubjects.toArray();
          break;
        case "studentSubjects":
          data = await localDb.studentSubjects.toArray();
          break;
        case "receipts":
          data = await localDb.receipts.toArray();
          break;
        case "schedules":
          data = await localDb.schedules.toArray();
          break;
      }

      // Filter by managerId if manager
      if (user?.role === "MANAGER" && user.id) {
        const managerFiltered = data.filter((item: any) => {
          if (tableName === "centers") {
            return item.managers?.includes(user.id);
          }
          return item.managerId === user.id;
        });
        setTableData({ ...tableData, [tableName]: managerFiltered });
      } else {
        setTableData({ ...tableData, [tableName]: data });
      }

      setExpandedTable(tableName);
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalItems = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle className="text-lg">{t("title")}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadCounts}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{t("totalItems")}: {totalItems}</Badge>
          {user && (
            <Badge variant="outline">
              {user.role === "ADMIN" ? t("adminView") : t("managerView")}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {Object.entries(counts).map(([tableName, count]) => (
            <div key={tableName} className="border rounded-lg">
              <button
                onClick={() => loadTableData(tableName)}
                className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                disabled={isLoading}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">{tableName}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
                {expandedTable === tableName ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {expandedTable === tableName && tableData[tableName] && (
                <div className="border-t p-3 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {tableData[tableName].length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("noData")}</p>
                    ) : (
                      tableData[tableName].slice(0, 10).map((item: any, index: number) => (
                        <div
                          key={item.id || index}
                          className="p-2 bg-muted/50 rounded text-xs font-mono overflow-x-auto"
                        >
                          <div className="font-semibold mb-1">{item.name || item.id || `Item ${index + 1}`}</div>
                          <div className="text-muted-foreground">
                            Status: <Badge variant="outline" className="text-xs">{item.status}</Badge>
                          </div>
                          {item.email && (
                            <div className="text-muted-foreground text-xs mt-1">Email: {item.email}</div>
                          )}
                          {item.managerId && (
                            <div className="text-muted-foreground text-xs mt-1">Manager: {item.managerId.slice(0, 8)}...</div>
                          )}
                        </div>
                      ))
                    )}
                    {tableData[tableName].length > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        {t("showingFirst", { count: 10, total: tableData[tableName].length })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>{t("helpText1")}</p>
          <p>{t("helpText2")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

