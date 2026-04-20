// app/manager/layout.tsx
import ManagerLayoutClient from "@/components/manager-layout-client";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function ManagerLayout({
  children,
}: DashboardLayoutProps) {
  return <ManagerLayoutClient>{children}</ManagerLayoutClient>;
}
