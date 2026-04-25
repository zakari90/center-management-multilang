// components/admin/admin-stats-cards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  studentActions,
  teacherActions,
  userActions,
} from "@/freelib/dexie/freedexieaction";
import { useLiveQuery } from "dexie-react-hooks";
import { UserCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function AdminStatsCards() {
  const t = useTranslations("adminStats");
  const queryData = useLiveQuery(async () => {
    try {
      // ✅ Fetch from local DB
      const [allUsers, allStudents, allTeachers] = await Promise.all([
        userActions.getAll(),
        studentActions.getAll(),
        teacherActions.getAll(),
      ]);

      const [activeUsers, activeStudents, activeTeachers] = [
        allUsers,
        allStudents,
        allTeachers,
      ];

      // ✅ Calculate stats
      const totalAdmins = activeUsers.length;
      const totalStudents = activeStudents.length;
      const totalTeachers = activeTeachers.length;

      return {
        totalCenters: 0, // Centers are managed separately
        totalAdmins,
        totalStudents,
        totalTeachers,
      };
    } catch (err) {
      console.error("Failed to fetch stats from local DB:", err);
      return null;
    }
  }, []);

  const stats = queryData || null;
  const isLoading = queryData === undefined;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (queryData === null) {
      setError("Failed to load statistics");
    }
  }, [queryData]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600 bg-red-50 rounded-md">{error}</div>;
  }

  if (!stats) return null;

  const statsData = [
    {
      title: t("totalAdmins"),
      icon: Users,
      value: stats.totalAdmins,
      subtitle: "",
      colorClass: "text-blue-600",
    },
    {
      title: t("totalStudents"),
      icon: UserCheck,
      value: stats.totalStudents,
      subtitle: "",
      colorClass: "text-purple-600",
    },
    {
      title: t("totalTeachers"),
      icon: Users,
      value: stats.totalTeachers,
      subtitle: "",
      colorClass: "text-green-600",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="w-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden relative group border-none shadow-md"
          >
            <div
              className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity ${stat.colorClass.replace("text-", "bg-")}`}
            />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div
                className={`p-2 rounded-full ${stat.colorClass.replace("text-", "bg-").replace("600", "100")} dark:${stat.colorClass.replace("text-", "bg-").replace("600", "900")}/30`}
              >
                <Icon className={`h-4 w-4 ${stat.colorClass}`} />
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-4 z-10 relative">
              <div className="text-2xl font-bold tracking-tight">
                {stat.value}
              </div>
              {stat.subtitle && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {stat.subtitle}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
