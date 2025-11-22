// app/admin/layout.tsx
import AdminLayoutClient from "@/components/admin-layout-client";
import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children }: DashboardLayoutProps) {
  // Use client-side authentication instead of server-side
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
