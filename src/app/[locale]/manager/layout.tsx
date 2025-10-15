// app/manager/layout.tsx
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/authentication";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    title: "Dashboard",
    url: "/manager",
    icon: "/dashboard.svg",
  },
  {
    title: "Teachers",
    url: "/manager/teachers",
    icon: "/teacher.svg",
  },
  {
    title: "Students",
    url: "/manager/students",
    icon: "/students.svg",
  },
  {
    title: "Receipts",
    url: "/manager/receipts",
    icon: "/receipt.svg",
  },
];

export default async function ManagerLayout({ children }: DashboardLayoutProps) {
  const session = await getSession();

  // Server-side protection
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "MANAGER") {
    redirect("/admin"); // Redirect to their correct dashboard
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: "/school.svg",
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" items={navItems} user={user} />
      <SidebarInset>
        <SiteHeader />
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}