/* eslint-disable @typescript-eslint/no-explicit-any */
// app/manager/layout.tsx
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

export default async function ManagerLayout({ children, params }: DashboardLayoutProps) {
  const session: any = await getSession();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ManagerLayout" });
  const isArabic = locale === "ar";

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "MANAGER") {
    redirect("/admin");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: "/school.svg",
  };

  const navItems = [
    {
      title: t("dashboard"),
      url: "/manager",
      icon: "/dashboard.svg",
    },
    {
      title: t("teachers"),
      url: "/manager/teachers",
      icon: "/teacher.svg",
    },
    {
      title: t("students"),
      url: "/manager/students",
      icon: "/students.svg",
    },
    {
      title: t("receipts"),
      url: "/manager/receipts",
      icon: "/receipt.svg",
    },
  ];

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar side={isArabic ? "right" : "left"} variant="inset" items={navItems} user={user} />
      <SidebarInset>
        <SiteHeader />
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
