"use client";

import AdminQuickActions from "@/components/freeinUse/adminQuickActions";
import AdminRevenueChart from "@/components/freeinUse/adminrevenue-chart";
import AdminStatsCards from "@/components/freeinUse/adminStatsCards";
import CentersOverview from "@/components/freeinUse/centersOverview";
import EnrollmentChart from "@/components/freeinUse/enrollement-chart";
import { DeleteAllDataButton } from "@/components/freeinUse/masterDelete";
import SystemActivityLog from "@/components/freeinUse/systemActivitylog";
import TopSubjects from "@/components/freeinUse/top-subjects";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/freeinUse/page-header";

export default function AdminDashboardClient() {
  const t = useTranslations("Dashboard");

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <AdminStatsCards />

        {/* Quick Actions */}
        <AdminQuickActions />

        {/* Revenue Chart */}
        <section>
          <AdminRevenueChart />
        </section>

        {/* Centers Overview */}
        <section>
          <CentersOverview />
        </section>

        {/* Charts Section */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <EnrollmentChart />
          <TopSubjects />
        </div>

        {/* Activity */}
        <div className="grid gap-6 grid-cols-1">
          <SystemActivityLog />
        </div>

        {/* Danger Zone */}
        <DeleteAllDataButton />
      </div>
    </>
  );
}
