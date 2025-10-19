/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/layout.tsx
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/authentication";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: DashboardLayoutProps) {
  const session: any = await getSession();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminLayout" });
  const isArabic = locale === "ar";

  const navItems = [
    {
      title: t("dashboard"),
      url: "/admin",
      icon: "/dashboard.svg",
    },
    {
      title: t("center"),
      url: "/admin/center",
      icon: "/school.svg",
    },
    {
      title: t("users"),
      url: "/admin/users",
      icon: "/manager.svg",
    },
    {
      title: t("receipts"),
      url: "/admin/receipts",
      icon: "/receipt.svg",
    },
    {
      title: t("schedule"),
      url: "/admin/schedule",
      icon: "/calendar.svg",
    },
  ];

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
      <AppSidebar
        side={isArabic ? "right" : "left"}
        variant="inset"
        items={navItems}
        user={user}
      />
      <SidebarInset>
        <SiteHeader />
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
