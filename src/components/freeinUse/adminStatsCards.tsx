// components/admin/admin-stats-cards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, UserCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import {
  userActions,
  studentActions,
  teacherActions,
  receiptActions,
} from "@/freelib/dexie/freedexieaction";
import { Role } from "@/freelib/dexie/dbSchema";

export default function AdminStatsCards() {
  const t = useTranslations("adminStats");
  const queryData = useLiveQuery(async () => {
    try {
      // ✅ Fetch from local DB
      const [allUsers, allStudents, allTeachers, allReceipts] =
        await Promise.all([
          userActions.getAll(),
          studentActions.getAll(),
          teacherActions.getAll(),
          receiptActions.getAll(),
        ]);

      const [activeUsers, activeStudents, activeTeachers, activeReceipts] = [
        allUsers,
        allStudents,
        allTeachers,
        allReceipts,
      ];

      // ✅ Calculate stats
      const totalAdmins = activeUsers.length;
      const totalStudents = activeStudents.length;
      const totalTeachers = activeTeachers.length;

      // ✅ Calculate revenue
      const totalRevenue = activeReceipts.reduce((sum, r) => sum + r.amount, 0);

      // ✅ Calculate monthly revenue (current month)
      const now = new Date();
      const currentMonthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).getTime();
      const monthlyReceipts = activeReceipts.filter(
        (r) => r.date >= currentMonthStart,
      );
      const monthlyRevenue = monthlyReceipts.reduce(
        (sum, r) => sum + r.amount,
        0,
      );

      // ✅ Calculate revenue growth (compare with previous month)
      const previousMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      ).getTime();
      const previousMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
      ).getTime();
      const previousMonthReceipts = activeReceipts.filter(
        (r) => r.date >= previousMonthStart && r.date <= previousMonthEnd,
      );
      const previousMonthRevenue = previousMonthReceipts.reduce(
        (sum, r) => sum + r.amount,
        0,
      );
      const revenueGrowth =
        previousMonthRevenue > 0
          ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
            100
          : 0;

      return {
        totalCenters: 0, // Centers are managed separately
        totalAdmins,
        totalStudents,
        totalTeachers,
        totalRevenue,
        monthlyRevenue,
        revenueGrowth,
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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
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
    {
      title: t("totalRevenue"),
      icon: TrendingUp,
      value: `MAD ${stats.totalRevenue.toFixed(2)}`,
      subtitle: (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-green-600" />
          <span>
            +{stats.revenueGrowth.toFixed(1)}% {t("thisMonth")}
          </span>
        </div>
      ),
      colorClass: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
