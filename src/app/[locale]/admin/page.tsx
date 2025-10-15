import AdminQuickActions from "@/components/adminQuickActions";
import AdminRevenueChart from "@/components/adminrevenue-chart";
import AdminStatsCards from "@/components/adminStatsCards";
import CentersOverview from "@/components/centersOverview";
import ManagersList from "@/components/managersList";
import SystemActivityLog from "@/components/systemActivitylog";

export default function AdminDashboard() {
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System-wide overview and management</p>
      </div>

      {/* Stats Overview */}
      <AdminStatsCards />

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-4">
        <AdminQuickActions />
      </div>

      {/* Revenue Chart */}
      <div className="grid gap-4 grid-cols-4">
        <AdminRevenueChart/>
      </div>

      {/* Centers Overview */}
      <div className="grid gap-4 grid-cols-4">
        <CentersOverview />
      </div>

      {/* Managers & Activity */}
      <div className="grid gap-4 grid-cols-4">
        <ManagersList />
        {/* <TopCenters /> */}
      </div>

      {/* System Activity */}
      <div className="grid gap-4 grid-cols-4">
        <SystemActivityLog />
      </div>
    </div>
  )
}