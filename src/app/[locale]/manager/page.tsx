import EnrollmentChart from "@/components/enrollement-chart";
import QuickActions from "@/components/quickActions";
import ReceiptsSummary from "@/components/receiptSummary";
import ManagerRevenueChart from "@/components/managerrevenue-chart";
import ManagerStatsCards from "@/components/managerStateCards";
import TopSubjects from "@/components/top-subjects";
import { SyncHandler } from "@/components/syncHandler";
import { useTranslations } from "next-intl";


function Page() {
  const t = useTranslations('Dashboard')

return (
   <div className="container mx-auto p-3 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

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

      {/* <div className="grid gap-4 grid-cols-4">
        <RecentActivities />
      </div> */}
    </div>
  );
}

export default Page;
