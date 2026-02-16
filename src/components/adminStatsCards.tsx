// components/admin/admin-stats-cards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import axios from 'axios' // ✅ Commented out - using local DB instead
import { TrendingUp, UserCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  userActions,
  studentActions,
  teacherActions,
  receiptActions,
} from "@/lib/dexie/dexieActions";
import { Role } from "@/lib/dexie/dbSchema";

interface AdminStats {
  totalCenters: number;
  totalManagers: number;
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
}

export default function AdminStatsCards() {
  const t = useTranslations("adminStats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // ✅ Fetch from local DB
      const [allUsers, allStudents, allTeachers, allReceipts] =
        await Promise.all([
          userActions.getAll(),
          studentActions.getAll(),
          teacherActions.getAll(),
          receiptActions.getAll(),
        ]);

      // ✅ Filter active entities (exclude deleted)
      const activeUsers = allUsers.filter((u) => u.status !== "0");
      const activeStudents = allStudents.filter((s) => s.status !== "0");
      const activeTeachers = allTeachers.filter((t) => t.status !== "0");
      const activeReceipts = allReceipts.filter((r) => r.status !== "0");

      // ✅ Calculate stats
      const totalManagers = activeUsers.filter(
        (u) => u.role === Role.MANAGER,
      ).length;
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

      setStats({
        totalCenters: 0, // Centers are managed separately
        totalManagers,
        totalStudents,
        totalTeachers,
        totalRevenue,
        monthlyRevenue,
        revenueGrowth,
      });

      // ✅ Commented out API call
      // const { data } = await axios.get('/api/admin/dashboard/stats')
      // setStats(data)
    } catch (err) {
      console.error("Failed to fetch stats from local DB:", err);
      setError("Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-linear-to-br from-blue-500/10 to-transparent">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
          <Users className="h-12 w-12 text-blue-500" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-blue-700/80">
            {t("totalManagers")}
          </CardTitle>
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold tracking-tight text-blue-950">
            {stats.totalManagers}
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-linear-to-br from-purple-500/10 to-transparent">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
          <UserCheck className="h-12 w-12 text-purple-500" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-purple-700/80">
            {t("totalStudents")}
          </CardTitle>
          <div className="p-2 rounded-lg bg-purple-500/10">
            <UserCheck className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold tracking-tight text-purple-950">
            {stats.totalStudents}
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-linear-to-br from-green-500/10 to-transparent">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
          <Users className="h-12 w-12 text-green-500" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-green-700/80">
            {t("totalTeachers")}
          </CardTitle>
          <div className="p-2 rounded-lg bg-green-500/10">
            <Users className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold tracking-tight text-green-950">
            {stats.totalTeachers}
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-linear-to-br from-orange-500 to-orange-600 text-white shadow-orange-200">
        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform">
          <TrendingUp className="h-12 w-12 text-white" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-orange-50/90">
            {t("totalRevenue")}
          </CardTitle>
          <div className="p-2 rounded-lg bg-white/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold tracking-tight">
            MAD{" "}
            {stats.totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-orange-100/80 mt-1 flex items-center gap-1">
            <span className="flex items-center gap-0.5 font-bold bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
              +{stats.revenueGrowth.toFixed(1)}%
            </span>
            {t("thisMonth")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
