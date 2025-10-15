// app/admin/layout.tsx
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
    url: "/admin",
    icon: "/dashboard.svg",
  },
  {
    title: "Center",
    url: "/admin/center",
    icon: "/school.svg",
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: "/manager.svg",
  },
  {
    title: "Receipts",
    url: "/admin/receipts",
    icon: "/receipt.svg",
  },
    {
    title: "Schedule",
    url: "/admin/schedule",
    icon: "/calendar.svg",
  },

];

export default async function AdminLayout({ children }: DashboardLayoutProps) {
  const session = await getSession();

  // Server-side protection
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/manager"); // Redirect to their correct dashboard
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