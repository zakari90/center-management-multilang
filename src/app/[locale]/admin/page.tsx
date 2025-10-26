import AdminQuickActions from "@/components/adminQuickActions";
import AdminRevenueChart from "@/components/adminrevenue-chart";
import AdminStatsCards from "@/components/adminStatsCards";
import CentersOverview from "@/components/centersOverview";
import EnrollmentChart from "@/components/enrollement-chart";
import ManagersList from "@/components/managersList";
import SystemActivityLog from "@/components/systemActivitylog";
import TopSubjects from "@/components/top-subjects";
import { useTranslations } from "next-intl";

export default function AdminDashboard() {
  const t = useTranslations('Dashboard')

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats Overview */}
      <AdminStatsCards />
        <AdminQuickActions />

        <AdminRevenueChart/>

        <CentersOverview />
        <div className="grid gap-6 md:grid-cols-2">

        <EnrollmentChart />
        <TopSubjects />
</div>
<div className="grid gap-6 md:grid-cols-2">
        <ManagersList />
        <SystemActivityLog />
        </div>

    </div>
  )
}