/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import EnrollmentChart from "@/components/enrollement-chart";
import QuickActions from "@/components/quickActions";
import ReceiptsSummary from "@/components/receiptSummary";
import ManagerRevenueChart from "@/components/managerrevenue-chart";
import ManagerStatsCards from "@/components/managerStateCards";
import TopSubjects from "@/components/top-subjects";
import { SyncHandler } from "@/components/syncHandler";
import { AutoSyncProvider } from "@/components/AutoSyncProvider";
import { FirstLoginImport } from "@/components/FirstLoginImport";
import { LocalDBDebugger } from "@/components/LocalDBDebugger";
import { useTranslations } from "next-intl";
import { importAllFromServer } from "@/lib/dexie/serverActions";
import { useState } from "react";


function Page() {
  const t = useTranslations('Dashboard')
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [data, setData] = useState<any>(null);
  async function dataTest() {
    const stats = await importAllFromServer();
    setData(stats);
  }

return (
   <>
   <div className="container mx-auto p-3 sm:p-6 space-y-6 bg-amber-300">

   <button onClick={dataTest}>Data Test</button>
   </div>

   {data}
      <AutoSyncProvider />
      <div className="container mx-auto p-3 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

      {/* First Login Import Prompt */}
      <FirstLoginImport />

      <ManagerStatsCards />
      <ReceiptsSummary/>
      <QuickActions />
      <ManagerRevenueChart />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <EnrollmentChart />
        <TopSubjects />
      </div>

      {/* Data Synchronization */}
      <SyncHandler />

      {/* Local DB Debugger (for mobile debugging) */}
      {isDevelopment && <LocalDBDebugger />}

      {/* <div className="grid gap-4 grid-cols-4">
        <RecentActivities />
      </div> */}
      </div>
    </>
  );
}

export default Page;
