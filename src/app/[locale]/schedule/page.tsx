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
import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

function SchedulePageContent() {
  const locale = useLocale();

  useEffect(() => {
    useCacheStatusStore.getState().checkAllPages(locale);
  }, [locale]);

  const tAttendance = useTranslations("AttendanceRegister");
  const tTimetable = useTranslations("TimetableManagement");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
            <TabsTrigger value="schedule">
              {tTimetable("title") || "Schedule"}
            </TabsTrigger>
            <TabsTrigger value="attendance">
              {tAttendance("title") || "Attendance"}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <CacheStatusIndicator />
            <LanguageSwitcher />
          </div>
        </div>

        <Alert className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 py-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-xs font-semibold">
              {locale === "ar" 
                ? "✅ مؤشر التخزين الذكي: بمجرد ظهور 'الفقاعة الخضراء'، يكون النظام قد تم تخزينه بالكامل وهو جاهز للاستخدام الآمن بدون إنترنت!"
                : locale === "fr"
                ? "✅ Indicateur de Cache Intelligent: Une fois que la 'Bulle Verte' apparaît, le système est entièrement mis en cache et prêt pour une utilisation hors ligne sécurisée !"
                : "✅ Smart Cache Indicator: Once the 'Green Bubble' appears, the system is fully cached and ready for safe offline use!"
              }
            </AlertDescription>
          </div>
        </Alert>

        <TabsContent value="schedule" className="mt-6">
          <FreeTimeTableManagement
            refreshKey={refreshKey}
            onScheduleChangeAction={handleScheduleChange}
          />
        </TabsContent>

        <TabsContent value="attendance" className="mt-0">
          <AttendanceModule />
        </TabsContent>
      </Tabs>
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
