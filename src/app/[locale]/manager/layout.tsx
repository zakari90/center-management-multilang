// app/manager/layout.tsx
import ManagerLayoutClient from "@/components/manager-layout-client";
import { ReactNode } from "react";

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ManagerLayout({ children }: DashboardLayoutProps) {
  // Use client-side authentication instead of server-side
  return <ManagerLayoutClient>{children}</ManagerLayoutClient>;
}
