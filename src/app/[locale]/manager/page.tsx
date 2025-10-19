import EnrollmentChart from "@/components/enrollement-chart";
import QuickActions from "@/components/quickActions";
import ReceiptsSummary from "@/components/receiptSummary";
import ManagerRevenueChart from "@/components/revenue-chart";
import ManagerStatsCards from "@/components/stateCards";
import TopSubjects from "@/components/top-subjects";
import { useTranslations } from "next-intl";


function Page() {
//how to auto refrech
  const t = useTranslations('Dashboard')

return (
  <div className="max-w-3xl mx-auto p-6">
     <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
<ReceiptsSummary/>

      <ManagerStatsCards />

      <div className="grid gap-4 grid-cols-4">
        <QuickActions />

        <ManagerRevenueChart />
      </div>

      <div className="grid gap-4 grid-cols-4">
        <EnrollmentChart />
        <TopSubjects />
      </div>

      {/* <div className="grid gap-4 grid-cols-4">
        <RecentActivities />
      </div> */}
    </div>

    </div>
  );
}

export default Page;
