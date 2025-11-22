"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/authContext";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AdminLayout");
  const isArabic = locale === "ar";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only check authentication after component has mounted and auth is loaded
    if (!mounted || isLoading) return;

    // Redirect if not authenticated
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    // Redirect if not an admin
    if (user.role !== "ADMIN") {
      router.push(`/${locale}/manager`);
      return;
    }
  }, [user, isLoading, mounted, router, locale]);

  // Show loading state while checking authentication
  if (!mounted || isLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
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
        user={userData}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

