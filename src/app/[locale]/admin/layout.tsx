"use client"

// app/admin/layout.tsx
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/authContext";
import { useRouter, useParams } from "next/navigation";
import { ReactNode, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("AdminLayout");
  const isArabic = locale === "ar";

  const navItems = useMemo(() => [
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
  ], [t]);

  // Client-side protection
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "ADMIN") {
        router.push("/manager"); // Redirect to their correct dashboard
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render if user is not authenticated or not admin (redirect will happen)
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  const sidebarUser = {
    name: user.name,
    email: user.email,
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
        user={sidebarUser}
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
