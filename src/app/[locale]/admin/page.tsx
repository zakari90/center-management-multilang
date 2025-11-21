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
import { SyncHandler } from "@/components/syncHandler";
// import { AutoSyncProvider } from "@/components/AutoSyncProvider";
import { FirstLoginImport } from "@/components/FirstLoginImport";
import { LocalDBDebugger } from "@/components/LocalDBDebugger";
import { useTranslations } from "next-intl";

export default function AdminDashboard() {
  const t = useTranslations('Dashboard')
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <>
      {/* <AutoSyncProvider /> */}
      <div className="container mx-auto p-3 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

      {/* First Login Import Prompt */}
      <FirstLoginImport />

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
      <SyncHandler />
      
      {/* Local DB Debugger (for mobile debugging) */}
      {isDevelopment && <LocalDBDebugger />}
      
      <DeleteAllDataButton/>
      </div>
    </>
  )
}