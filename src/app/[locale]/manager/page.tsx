// app/[locale]/manager/page.tsx
import ManagerDashboardClient from "@/components/manager-dashboard-client";
import OfflineNotificationBanner from "@/components/offline-notification-banner";

export const dynamic = 'force-dynamic';

export default function ManagerPage() {
  console.log('[ManagerPage] Server render', { timestamp: new Date().toISOString() });
  return (<div>
    <OfflineNotificationBanner/> 
  <ManagerDashboardClient />
  </div>);
}
