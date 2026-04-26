"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import axios from 'axios' // ✅ Commented out - using localDB instead
import { GraduationCap, Receipt, TrendingUp, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/context/authContext";
import {
  studentActions,
  teacherActions,
  subjectActions,
  receiptActions,
  studentSubjectActions,
} from "@/lib/dexie/dexieActions";
import { ReceiptType } from "@/lib/dexie/dbSchema";

interface DashboardStats {
  totalStudents: number;
  activeEnrollments: number;
  totalTeachers: number;
  totalSubjects: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  totalRevenue: number;
  totalReceipts: number;
}

export default function ManagerStatsCards() {
  const t = useTranslations("ManagerStatsCards");
  const { user } = useAuth();

  const stats = useLiveQuery(async () => {
    try {
      if (!user) return null;

      // ✅ Fetch from localDB instead of API
      const [students, teachers, subjects, receipts, studentSubjects] =
        await Promise.all([
          studentActions.getAll(),
          teacherActions.getAll(),
          subjectActions.getAll(),
          receiptActions.getAll(),
          studentSubjectActions.getAll(),
        ]);

      // Filter by status (exclude deleted items)
      const allActiveStudents = students.filter((s) => s.status !== "0");
      const allActiveTeachers = teachers.filter((t) => t.status !== "0");
      const activeSubjects = subjects.filter((s) => s.status !== "0");

      // Revenue is filtered by manager
      const managerReceipts = receipts.filter(
        (r) => r.managerId === user.id && r.status !== "0",
      );

      // Enrollments for all active students
      const activeEnrollments = studentSubjects.filter(
        (ss) =>
          ss.status !== "0" &&
          allActiveStudents.some((s) => s.id === ss.studentId),
      );

      // Calculate date ranges
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Filter receipts by date
      const thisMonthReceipts = managerReceipts.filter((r) => {
        const receiptDate = new Date(r.date);
        return (
          receiptDate >= firstDayOfMonth &&
          r.type === ReceiptType.STUDENT_PAYMENT
        );
      });
      const lastMonthReceipts = managerReceipts.filter((r) => {
        const receiptDate = new Date(r.date);
        return (
          receiptDate >= firstDayOfLastMonth &&
          receiptDate <= lastDayOfLastMonth &&
          r.type === ReceiptType.STUDENT_PAYMENT
        );
      });

      // Calculate revenue
      const monthlyIncome = thisMonthReceipts.reduce(
        (sum, r) => sum + r.amount,
        0,
      );

      const thisMonthExpenseReceipts = managerReceipts.filter((r) => {
        const receiptDate = new Date(r.date);
        return (
          receiptDate >= firstDayOfMonth &&
          r.type === ReceiptType.TEACHER_PAYMENT
        );
      });
      const monthlyExpense = thisMonthExpenseReceipts.reduce(
        (sum, r) => sum + r.amount,
        0,
      );
      const monthlyRevenue = monthlyIncome - monthlyExpense;

      const lastMonthIncome = lastMonthReceipts.reduce(
        (sum, r) => sum + r.amount,
        0,
      );
      const lastMonthExpenseReceipts = managerReceipts.filter((r) => {
        const receiptDate = new Date(r.date);
        return (
          receiptDate >= firstDayOfLastMonth &&
          receiptDate <= lastDayOfLastMonth &&
          r.type === ReceiptType.TEACHER_PAYMENT
        );
      });
      const lastMonthExpense = lastMonthExpenseReceipts.reduce(
        (sum, r) => sum + r.amount,
        0,
      );
      const lastMonthRevenue = lastMonthIncome - lastMonthExpense;

      const revenueGrowth =
        lastMonthRevenue !== 0
          ? ((monthlyRevenue - lastMonthRevenue) / Math.abs(lastMonthRevenue)) *
            100
          : 0;

      const totalIncome = managerReceipts
        .filter((r) => r.type === ReceiptType.STUDENT_PAYMENT)
        .reduce((sum, r) => sum + r.amount, 0);
      const totalExpense = managerReceipts
        .filter((r) => r.type === ReceiptType.TEACHER_PAYMENT)
        .reduce((sum, r) => sum + r.amount, 0);
      const totalRevenueTotal = totalIncome - totalExpense;

      return {
        totalStudents: allActiveStudents.length,
        totalTeachers: allActiveTeachers.length,
        totalSubjects: activeSubjects.length,
        totalRevenue: totalRevenueTotal,
        monthlyRevenue,
        totalReceipts: managerReceipts.length,
        activeEnrollments: activeEnrollments.length,
        revenueGrowth,
      };
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      return null;
    }
  }, [user]);

  const isLoading = stats === undefined;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

  if (!stats) return null;

  const statsData = [
    {
      title: t("studentstitle"),
      icon: Users,
      value: stats.totalStudents,
      subtitle: t("studentsactive", { count: stats.activeEnrollments }),
      colorClass: "text-blue-600",
    },
    {
      title: t("teacherstitle"),
      icon: GraduationCap,
      value: stats.totalTeachers,
      subtitle: t("teacherssubtitle", { count: stats.totalSubjects }),
      colorClass: "text-purple-600",
    },
    {
      title: t("monthlyRevenuetitle"),
      icon: TrendingUp,
      value: `MAD ${stats.monthlyRevenue.toFixed(2)}`,
      subtitle: (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-green-600" />
          <span>
            {t("monthlyRevenuegrowth", {
              percent: stats.revenueGrowth.toFixed(1),
            })}
          </span>
        </div>
      ),
      colorClass: "text-green-600",
      isRevenue: true,
    },
    {
      title: t("totalRevenuetitle"),
      icon: Receipt,
      value: `MAD ${stats.totalRevenue.toFixed(2)}`,
      subtitle: t("totalRevenuesubtitle", { count: stats.totalReceipts }),
      colorClass: "text-orange-600",
      isRevenue: true,
    },
  ];

  if (stats === null && !isLoading) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        Failed to load statistics
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                {/* @ts-ignore */}
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
