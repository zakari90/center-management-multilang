// app/admin/layout.tsx
import AdminLayoutClient from "@/components/admin-layout-client";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: DashboardLayoutProps) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
