// app/[locale]/admin/page.tsx
import AdminDashboardClient from "@/components/admin-dashboard-client";
import OfflineNotificationBanner from "@/components/offline-notification-banner";
import DeleteRequestsPanel from "@/components/admin/DeleteRequestsPanel";
import NotificationPreferences from "@/components/admin/NotificationPreferences";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div>
      <OfflineNotificationBanner />
      <DeleteRequestsPanel />
      <AdminDashboardClient />
      <NotificationPreferences />
    </div>
  );
}
