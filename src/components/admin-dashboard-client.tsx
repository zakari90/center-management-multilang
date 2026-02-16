"use client";

import AdminQuickActions from "@/components/adminQuickActions";
import AdminRevenueChart from "@/components/adminrevenue-chart";
import AdminStatsCards from "@/components/adminStatsCards";
import CentersOverview from "@/components/centersOverview";
import EnrollmentChart from "@/components/enrollement-chart";
import ManagersList from "@/components/managersList";
import { DeleteAllDataButton } from "@/components/masterDelete";
import SystemActivityLog from "@/components/systemActivitylog";
import TopSubjects from "@/components/top-subjects";
// import { AutoSyncProvider } from "@/components/AutoSyncProvider";
// import { FirstLoginImport } from "@/components/FirstLoginImport";
import { useFormatter, useTranslations } from "next-intl";
import { AutoSyncProvider } from "./AutoSyncProvider";
import PageHeader from "./page-header";

export default function AdminDashboardClient() {
  const t = useTranslations("Dashboard");
  const format = useFormatter();
  const dateTime = new Date();
  return (
    <>
      <AutoSyncProvider />

      <div className="container mx-auto p-4 sm:p-8 space-y-12 animate-in fade-in duration-700">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />

        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
            {t("stats_overview") || "Statistics Overview"}
          </h2>
          <AdminStatsCards />
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
            {t("quick_actions") || "Quick Actions"}
          </h2>
          <AdminQuickActions />
        </section>

        <div className="grid gap-10 grid-cols-1 xl:grid-cols-3">
          <section className="xl:col-span-2 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
              {t("revenue_analytics") || "Revenue Analytics"}
            </h2>
            <AdminRevenueChart />
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
              {t("top_performing") || "Top Performing"}
            </h2>
            <TopSubjects />
          </section>
        </div>

        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
            {t("centers_status") || "Centers Status"}
          </h2>
          <CentersOverview />
        </section>

        <div className="grid gap-10 grid-cols-1 lg:grid-cols-2">
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
              {t("enrollment_trends") || "Enrollment Trends"}
            </h2>
            <EnrollmentChart />
          </section>
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
              {t("recent_activity") || "Recent Activity"}
            </h2>
            <SystemActivityLog />
          </section>
        </div>

        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
            {t("management") || "Management"}
          </h2>
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <ManagersList />
          </div>
        </section>

        <div className="pt-8 border-t border-border/50">
          <DeleteAllDataButton />
        </div>
      </div>
    </>
  );
}
