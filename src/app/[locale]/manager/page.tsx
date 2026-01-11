// app/[locale]/manager/page.tsx
import ManagerDashboardClient from "@/components/manager-dashboard-client";

export const dynamic = 'force-dynamic';

export default function ManagerPage() {
  console.log('[ManagerPage] Server render', { timestamp: new Date().toISOString() });
  return <ManagerDashboardClient />;
}
