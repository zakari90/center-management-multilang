"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/authContext";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { CalendarDays, FileText, Home, LayoutGrid, Users, MoreVertical, LogOut, Globe, Moon, Sun, RefreshCw } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { syncAllEntitiesForRole, importAllFromServerForRole } from "@/lib/dexie/serverActions";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AdminLayout");
  const tNav = useTranslations("NavUser");
  const isArabic = locale === "ar";
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only check authentication after component has mounted and auth is loaded
    if (!mounted || isLoading) return;

    console.log('[AdminLayoutClient] auth resolved', { user, isLoading, locale });

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

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/login`);
  };

  const handleSync = async () => {
    if (!user?.id) return;
    setIsSyncing(true);
    try {
      const isAdmin = user.role === "ADMIN";
      await syncAllEntitiesForRole(isAdmin);
      await importAllFromServerForRole(isAdmin);
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Show loading state only while mounting / checking authentication
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

  // Auth resolved: if not authorized, let the redirect effect handle navigation
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
  ];

  // Three-dot menu for mobile
  const ThreeDotsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-12 w-12">
          <MoreVertical className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isArabic ? "start" : "end"} className="w-48">
        <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? "..." : "Sync Data"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Language Options */}
        <DropdownMenuItem onClick={() => router.push(`/ar${window.location.pathname.substring(3)}`)}>
          <Globe className="mr-2 h-4 w-4" />
          العربية
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/en${window.location.pathname.substring(3)}`)}>
          <Globe className="mr-2 h-4 w-4" />
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/fr${window.location.pathname.substring(3)}`)}>
          <Globe className="mr-2 h-4 w-4" />
          Français
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Theme Toggle */}
        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {tNav("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="app-shell max-w-[32px]">
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
          <header className="hidden md:flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="app-content flex-1 overflow-auto">{children}</main>
        </SidebarInset>

        <MobileBottomNav
          ariaLabel={t("dashboard")}
          items={[
            { label: t("dashboard"), href: `${base}/admin`, icon: <Home className="size-5" /> },
            { label: t("center"), href: `${base}/admin/center`, icon: <LayoutGrid className="size-5" /> },
            { label: t("users"), href: `${base}/admin/users`, icon: <Users className="size-5" /> },
            { label: t("receipts"), href: `${base}/admin/receipts`, icon: <FileText className="size-5" /> },
            { label: t("schedule"), href: `${base}/admin/schedule`, icon: <CalendarDays className="size-5" /> },
          ]}
          menu={<ThreeDotsMenu />}
        />
      </SidebarProvider>
    </div>
  );
}
