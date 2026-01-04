"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/authContext";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { CalendarDays, FileText, Home, Users } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ManagerLayoutClientProps {
  children: React.ReactNode;
}

export default function ManagerLayoutClient({ children }: ManagerLayoutClientProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ManagerLayout");
  const isArabic = locale === "ar";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only check authentication after component has mounted and auth is loaded
    if (!mounted || isLoading) return;

    console.log('[ManagerLayoutClient] auth resolved', { user, isLoading, locale });

    // Redirect if not authenticated
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    // Redirect if not a manager
    if (user.role !== "MANAGER") {
      router.push(`/${locale}/admin`);
      return;
    }
  }, [user, isLoading, mounted, router, locale]);

  // Show loading state only while mounting / checking authentication
  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth resolved: if not authorized, let the redirect effect handle navigation
  if (!user || user.role !== "MANAGER") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  const userData = {
    name: user.name,
    email: user.email,
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
    {
      title: t("schedule"),
      url: "/manager/schedule",
      icon: "/calendar.svg",
    }
  ];

  return (
    <div className="app-shell">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar side={isArabic ? "right" : "left"} variant="inset" items={navItems} user={userData} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="app-content flex-1 overflow-auto">{children}</main>
        </SidebarInset>

        <MobileBottomNav
          ariaLabel={t("dashboard")}
          items={[
            { label: t("dashboard"), href: "/manager", icon: <Home className="size-5" /> },
            { label: t("teachers"), href: "/manager/teachers", icon: <Users className="size-5" /> },
            { label: t("students"), href: "/manager/students", icon: <Users className="size-5" /> },
            { label: t("receipts"), href: "/manager/receipts", icon: <FileText className="size-5" /> },
            { label: t("schedule"), href: "/manager/schedule", icon: <CalendarDays className="size-5" /> },
          ]}
          menu={<SidebarTrigger className="h-12 w-12" />}
        />
      </SidebarProvider>
    </div>
  );
}

