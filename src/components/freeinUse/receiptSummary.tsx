"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/freecomponents/ui/card";
import { Skeleton } from "@/freecomponents/ui/skeleton";
import { useAuth } from "@/freelib/context/authContext";
import { ReceiptType } from "@/freelib/dexie/dbSchema";
import { receiptActions } from "@/freelib/dexie/freedexieaction";
import { useLiveQuery } from "dexie-react-hooks";
import { Banknote, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

interface ReceiptStats {
  totalReceipts: number;
  totalRevenue: number;
  studentPayments: number;
  teacherPayments: number;
  thisMonthRevenue: number;
  netProfit: number;
}

export default function ReceiptsSummary() {
  const t = useTranslations("AdminReceiptsSummary");
  const { user } = useAuth();

  const stats = useLiveQuery(async () => {
    try {
      if (!user) return null;

      const receipts = await receiptActions.getAll();
      const activeReceipts = receipts; // In local-only mode, we use direct local data

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const computedStats = activeReceipts.reduce(
        (acc, receipt) => {
          acc.totalReceipts++;

          // Calculate true revenue and expenses
          if (receipt.type === ReceiptType.STUDENT_PAYMENT) {
            acc.studentPayments += receipt.amount;
            if (new Date(receipt.date) >= firstDayOfMonth) {
              acc.thisMonthRevenue += receipt.amount;
            }
          } else if (receipt.type === ReceiptType.TEACHER_PAYMENT) {
            acc.teacherPayments += receipt.amount;
          }

          return acc;
        },
        {
          totalReceipts: 0,
          totalRevenue: 0,
          studentPayments: 0,
          teacherPayments: 0,
          thisMonthRevenue: 0,
          netProfit: 0,
        },
      );

      // Derived stats
      computedStats.totalRevenue = computedStats.studentPayments; // Redefine total revenue as total income
      computedStats.netProfit =
        computedStats.studentPayments - computedStats.teacherPayments;

      return computedStats;
    } catch (err) {
      console.error(t("errorFetchStats"), err);
      return null;
    }
  }, [user]);

  const isLoading = stats === undefined;

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="shadow-md border-none overflow-hidden bg-linear-to-br from-white to-gray-50/50 dark:from-gray-950 dark:to-gray-900/50">
      <CardHeader className="pb-2 border-b bg-muted/20">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary" />
          {t("financialOverview")}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t("income")}
            value={stats.studentPayments}
            icon={TrendingUp}
            colorClass="text-emerald-600"
            bgClass="bg-emerald-100"
            trend="up"
          />
          <StatCard
            label={t("expenses")}
            value={stats.teacherPayments}
            icon={TrendingDown}
            colorClass="text-rose-600"
            bgClass="bg-rose-100"
            trend="down"
          />
          <StatCard
            label="Net Profit"
            value={stats.netProfit}
            icon={Wallet}
            colorClass="text-blue-600"
            bgClass="bg-blue-100"
          />
          <StatCard
            label={t("thisMonth")}
            value={stats.thisMonthRevenue}
            icon={"MAD"}
            colorClass="text-violet-600"
            bgClass="bg-violet-100"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  trend,
}: {
  label: string;
  value: number;
  icon: any;
  colorClass: string;
  bgClass: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="relative group overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div
          className={`p-2 rounded-full ${bgClass} ${bgClass.replace("bg-", "bg-opacity-20 ")}`}
        >
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className={`text-2xl font-bold ${colorClass}`}>
          MAD{" "}
          {value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
      {/* Decorative subtle background icon */}
      <Icon
        className={`absolute -right-4 -bottom-4 h-24 w-24 opacity-[0.03] ${colorClass} rotate-12 transition-transform group-hover:scale-110`}
      />
    </div>
  );
}
