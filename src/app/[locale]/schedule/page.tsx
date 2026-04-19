"use client";

import { PublicHeader } from "@/components/PublicHeader";
import { centerActions } from "@/freelib/dexie/freedexieaction";
import { useEffect, useState, Suspense } from "react";
import FreeTimeTableManagement from "./attendance/components/FreeTimeTableManagement";
import { AttendanceModule } from "./attendance/components/AttendanceModule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/context/authContext";

function SchedulePageContent() {
  const [institution, setInstitution] = useState("");
  const { user, isAuthenticated } = useAuth();
  const canEdit = isAuthenticated && (user?.role === "MANAGER" || user?.role === "ADMIN");

  useEffect(() => {
    centerActions.getAll().then((centers) => {
      if (centers.length > 0) setInstitution(centers[0].name);
    });
  }, []);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <PublicHeader institution={institution} />
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="schedule">
            {tTimetable("title") || "Schedule"}
          </TabsTrigger>
          <TabsTrigger value="attendance">
            {tAttendance("title") || "Attendance"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          <FreeTimeTableManagement
            refreshKey={refreshKey}
            onScheduleChangeAction={handleScheduleChange}
            readOnly={!canEdit}
          />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceModule />
        </TabsContent>
      </Tabs>
    </div>
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
