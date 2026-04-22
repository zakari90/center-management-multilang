"use client";

import { useState, Suspense } from "react";
import FreeTimeTableManagement from "./attendance/components/FreeTimeTableManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AttendanceModule } from "./attendance/components/AttendanceModule";
import { CacheStatusIndicator } from "@/components/cache-status-indicator";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useCacheStatusStore } from "@/stores/useCacheStatusStore";
import { useLocale } from "next-intl";
import { useEffect, useCallback } from "react";
import { useAuth } from "@/context/authContext";
import { useTheme } from "next-themes";
import {
  syncAllEntitiesForRole,
  importAllFromServerForRole,
} from "@/lib/dexie/serverActions";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sun, Moon } from "lucide-react";
import PublicFooter from "@/components/PublicFooter";
import { CacheStatusDot } from "@/components/cache-status-indicator";
import { WelcomeDialog } from "./attendance/components/WelcomeDialog";
import { timeTableActions, attendanceActions, getScheduleDb } from "@/freelib/dexie/scheduleDb";
import { centerActions } from "@/freelib/dexie/freedexieaction";

function SchedulePageContent() {
  const locale = useLocale();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check for first visit (empty state)
    Promise.all([
      centerActions.getAll(),
      timeTableActions.getAll(),
      attendanceActions.getAllSessions(),
    ]).then(([centers, schedules, sessions]) => {
      if (centers.length === 0 && schedules.length === 0 && sessions.length === 0) {
        setShowWelcome(true);
      }
    });
  }, []);

  useEffect(() => {
    useCacheStatusStore.getState().checkAllPages(locale);
  }, [locale]);

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

  const tAttendance = useTranslations("AttendanceRegister");
  const tTimetable = useTranslations("TimetableManagement");
  const tManager = useTranslations("ManagerLayout");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const base = `/${locale}`;

  const currentTab = searchParams.get("tab") || "schedule";
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScheduleChange = () => {
    setRefreshKey((prev: number) => prev + 1);
  };

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="schedule" className="gap-2 cursor-pointer">
              {tTimetable("title") || "Schedule Management"}
              <CacheStatusDot href={`${base}/schedule`} />
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2 cursor-pointer">
              {tAttendance("title") || "Attendance Register"}
              <CacheStatusDot href={`${base}/schedule/attendance`} />
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSync}
                disabled={isSyncing}
                title={isSyncing ? tManager("syncing") : tManager("syncData")}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                />
              </Button>
            )}
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
            <CacheStatusIndicator />
            <LanguageSwitcher />
          </div>
        </div>

        <TabsContent value="schedule" className="mt-0">
          <FreeTimeTableManagement
            refreshKey={refreshKey}
            onScheduleChangeAction={handleScheduleChange}
          />
        </TabsContent>

        <TabsContent value="attendance" className="mt-0">
          <AttendanceModule />
        </TabsContent>
      </Tabs>

      <WelcomeDialog
        open={showWelcome}
        isRtl={locale === "ar"}
        t={tAttendance}
        onConfirm={() => {
          getScheduleDb().open();
          setShowWelcome(false);
        }}
      />

      <PublicFooter />
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <SchedulePageContent />
    </Suspense>
  );
}
