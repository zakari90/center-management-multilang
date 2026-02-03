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
import { useTranslations } from "next-intl";
import { AutoSyncProvider } from "./AutoSyncProvider";
import PageHeader from "./page-header";

export default function AdminDashboardClient() {
  const t = useTranslations("Dashboard");

  return (
    <>
      <AutoSyncProvider />

      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* First Login Import Prompt */}
      {/* <FirstLoginImport /> */}

      {/* Stats Overview */}
      <AdminStatsCards />
      <AdminQuickActions />
      <AdminRevenueChart />
      <CentersOverview />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <EnrollmentChart />
        <TopSubjects />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ManagersList />
        <SystemActivityLog />
      </div>

      {/* Data Synchronization */}
      {/* <SyncHandler /> */}

      <DeleteAllDataButton />
    </>
  );
}
