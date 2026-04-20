"use client";

import { useState, Suspense } from "react";
import FreeTimeTableManagement from "./attendance/components/FreeTimeTableManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AttendanceModule } from "./attendance/components/AttendanceModule";
import { CacheStatusIndicator } from "@/components/cache-status-indicator";

function SchedulePageContent() {
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
          
          <CacheStatusIndicator />
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
