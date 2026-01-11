// app/[locale]/admin/page.tsx
import AdminDashboardClient from "@/components/admin-dashboard-client";

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  console.log('[AdminPage] Server render', { timestamp: new Date().toISOString() });
  return <AdminDashboardClient />;
}