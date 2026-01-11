// app/admin/layout.tsx
import AdminLayoutClient from "@/components/admin-layout-client";
import { ReactNode } from "react";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params;
  const headersList = await headers();
  
  console.log('[AdminLayout] Server render', {
    timestamp: new Date().toISOString(),
    locale,
    userAgent: headersList.get('user-agent')?.slice(0, 50),
    cacheControl: headersList.get('cache-control'),
  });
  
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
