// app/[locale]/admin/page.tsx
import AdminDashboardClient from "@/components/admin-dashboard-client";
import OfflineNotificationBanner from "@/components/offline-notification-banner";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  console.log("[AdminPage] Server render", {
    timestamp: new Date().toISOString(),
  });
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <OfflineNotificationBanner />
      <AdminDashboardClient />
    </div>
  );
}
