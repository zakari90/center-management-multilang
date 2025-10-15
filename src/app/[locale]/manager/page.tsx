import EnrollmentChart from "@/components/enrollement-chart";
import QuickActions from "@/components/quickActions";
import ReceiptsSummary from "@/components/receiptSummary";
import RecentActivities from "@/components/recent-activities";
import RevenueChart from "@/components/revenue-chart";
import StatsCards from "@/components/stateCards";
import TopSubjects from "@/components/top-subjects";


function Page() {
//how to auto refrech

return (
  <div className="max-w-3xl mx-auto p-6">
     <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here is what is happening today.</p>
      </div>
<ReceiptsSummary/>

      <StatsCards />

      <div className="grid gap-4 grid-cols-4">
        <QuickActions />

        <RevenueChart />
        {/* <SimpleRevenueChart/> */}
      </div>

      <div className="grid gap-4 grid-cols-4">
        <EnrollmentChart />
        <TopSubjects />
      </div>

      <div className="grid gap-4 grid-cols-4">
        <RecentActivities />
      </div>
    </div>

    </div>
  );
}

export default Page;
