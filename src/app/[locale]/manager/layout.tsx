// app/manager/layout.tsx
import ManagerLayoutClient from "@/components/manager-layout-client";
import { ReactNode } from "react";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ManagerLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params;
  const headersList = await headers();
  
  console.log('[ManagerLayout] Server render', {
    timestamp: new Date().toISOString(),
    locale,
    userAgent: headersList.get('user-agent')?.slice(0, 50),
    cacheControl: headersList.get('cache-control'),
  });
  
  return <ManagerLayoutClient>{children}</ManagerLayoutClient>;
}
