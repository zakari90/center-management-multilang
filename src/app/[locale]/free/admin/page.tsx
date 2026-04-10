// app/[locale]/admin/page.tsx
import AdminDashboardClient from "@/components/freeinUse/admin-dashboard-client";
import OfflineNotificationBanner from "@/components/freeinUse/offline-notification-banner";
export default function AdminPage() {
  return (
    <div>
      <OfflineNotificationBanner />
      <AdminDashboardClient />
    </div>
  );
}
