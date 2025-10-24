import EnrollmentChart from "@/components/enrollement-chart";
import QuickActions from "@/components/quickActions";
import ReceiptsSummary from "@/components/receiptSummary";
import ManagerRevenueChart from "@/components/managerrevenue-chart";
import ManagerStatsCards from "@/components/managerStateCards";
import TopSubjects from "@/components/top-subjects";
import { useTranslations } from "next-intl";


function Page() {
  const t = useTranslations('Dashboard')

return (
   <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <ManagerStatsCards />

      <ReceiptsSummary/>
      <QuickActions />


        <ManagerRevenueChart />

      <div className="flex flex-col lg:flex-row gap-6">
        <EnrollmentChart />
        <TopSubjects />
      </div>

      {/* <div className="grid gap-4 grid-cols-4">
        <RecentActivities />
      </div> */}
    </div>
  );
}

export default Page;
