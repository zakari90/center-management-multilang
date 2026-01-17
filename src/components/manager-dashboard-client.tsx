/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// import { AutoSyncProvider } from "@/components/AutoSyncProvider";
import EnrollmentChart from "@/components/enrollement-chart";
import ManagerRevenueChart from "@/components/managerrevenue-chart";
import ManagerStatsCards from "@/components/managerStateCards";
import PageHeader from "@/components/page-header";
import QuickActions from "@/components/quickActions copy";
import ReceiptsSummary from "@/components/receiptSummary";
import TopSubjects from "@/components/top-subjects";
import { useTranslations } from "next-intl";


export default function ManagerDashboardClient() {
  const t = useTranslations('Dashboard')

return (
   <>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* First Login Import Prompt */}
      {/* <FirstLoginImport /> */}
      <ReceiptsSummary/>

      <ManagerStatsCards />
      <QuickActions />
      <ManagerRevenueChart />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <EnrollmentChart />
        <TopSubjects />
      </div>

      {/* Data Synchronization */}
      {/* <SyncHandler /> */}

      {/* <div className="grid gap-4 grid-cols-4">
        <RecentActivities />
      </div> */}
      </div>

    </>
  );
}
