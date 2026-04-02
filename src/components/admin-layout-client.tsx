"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/authContext";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import {
  CalendarDays,
  FileText,
  Home,
  LayoutGrid,
  Users,
  MoreVertical,
  LogOut,
  Globe,
  Moon,
  Sun,
  RefreshCw,
  Database,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  syncAllEntitiesForRole,
  importAllFromServerForRole,
} from "@/lib/dexie/serverActions";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { CacheStatusIndicator } from "@/components/cache-status-indicator";
import { useCacheStatusStore } from "@/stores/useCacheStatusStore";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({
  children,
}: AdminLayoutClientProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AdminLayout");
  const tNav = useTranslations("NavUser");
  const isArabic = locale === "ar";
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    useCacheStatusStore.getState().checkAllPages(locale);
  }, [locale]);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    if (user.role !== "ADMIN") {
      router.push(`/${locale}/manager`);
      return;
    }
  }, [user, isLoading, mounted, router, locale]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${locale}/login`);
  }, [logout, router, locale]);

  const handleSync = useCallback(async () => {
    if (!user?.id) return;
    setIsSyncing(true);
    try {
      const isAdmin = user.role === "ADMIN";
      await syncAllEntitiesForRole(isAdmin);
      await importAllFromServerForRole(isAdmin);
    } catch (error) {
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, user?.role]);

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mt-4 text-muted-foreground">...</p>
        </div>
      </div>
    );
  }

  const userData = {
    name: user.name,
    email: user.email,
    avatar: "/school.svg",
  };

  const base = `/${locale}`;

  const navItems = [
    {
      title: t("dashboard"),
      url: `${base}/admin`,
      icon: "/dashboard.svg",
    },
    {
      title: t("center"),
      url: `${base}/admin/center`,
      icon: "/school.svg",
    },
    {
      title: t("users"),
      url: `${base}/admin/users`,
      icon: "/manager.svg",
    },
    {
      title: t("receipts"),
      url: `${base}/admin/receipts`,
      icon: "/receipt.svg",
    },
    {
      title: t("schedule"),
      url: `${base}/admin/schedule`,
      icon: "/calendar.svg",
    },
    {
      title: t("database"),
      url: `${base}/admin/database`,
      icon: "/database.svg",
    },
  ];

  return (
    <div className="app-shell">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 56)",
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
          <header className="hidden md:flex h-14 shrink-0 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mx-1 h-4" />
            </div>
            <div className="flex items-center gap-2 px-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSync}
                disabled={isSyncing}
                title={isSyncing ? "..." : "Sync Data"}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Light Mode" : "Dark Mode"}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <LanguageSwitcher />
            </div>
          </header>
          <main className="app-content flex-1 overflow-auto">{children}</main>
        </SidebarInset>

        <MobileBottomNav
          ariaLabel={t("dashboard")}
          items={[
            {
              label: t("dashboard"),
              href: `${base}/admin`,
              icon: <Home className="size-5" />,
            },
            {
              label: t("center"),
              href: `${base}/admin/center`,
              icon: <LayoutGrid className="size-5" />,
            },
            {
              label: t("users"),
              href: `${base}/admin/users`,
              icon: <Users className="size-5" />,
            },
            {
              label: t("receipts"),
              href: `${base}/admin/receipts`,
              icon: <FileText className="size-5" />,
            },
            {
              label: t("schedule"),
              href: `${base}/admin/schedule`,
              icon: <CalendarDays className="size-5" />,
            },
            {
              label: t("database"),
              href: `${base}/admin/database`,
              icon: <Database className="size-5" />,
            },
          ]}
          menu={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12">
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isArabic ? "start" : "end"}
                className="w-48"
              >
                <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                  />
                  {isSyncing ? "..." : "Sync Data"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/ar${window.location.pathname.substring(3)}`)
                  }
                >
                  <Globe className="mr-2 h-4 w-4" />
                  العربية
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/en${window.location.pathname.substring(3)}`)
                  }
                >
                  <Globe className="mr-2 h-4 w-4" />
                  English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/fr${window.location.pathname.substring(3)}`)
                  }
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Français
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {tNav("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      </SidebarProvider>
    </div>
  );
}
