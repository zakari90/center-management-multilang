"use client";

import { useState } from "react";
import TeacherScheduleView from "@/components/inUse/teacherWithSchedule";
import TimetableManagement from "@/components/inUse/TimeTableManagement";
import ScheduleAssignmentView from "@/components/schedules/ScheduleAssignmentView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";

export default function ReadOnlySchedulePage() {
  const t = useTranslations("SchedulePage"); // Assuming these translations exist or reusing existing ones
  const [refreshKey, setRefreshKey] = useState(0);

  // While it's read-only, we might still want to refresh if data changes externally
  const handleRefresh = () => {
    setRefreshKey((prev: number) => prev + 1);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("title") || "Schedule Management"} (Read-Only)
        </h1>
        <p className="text-muted-foreground">
          View the weekly schedule and teacher assignments.
        </p>
      </div>

      <Tabs defaultValue="timetable" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="timetable">
            {t("timetable") || "Timetable"}
          </TabsTrigger>
          <TabsTrigger value="teachers">
            {t("teachers") || "Teachers"}
          </TabsTrigger>
          <TabsTrigger value="assignments">
            {t("assignments") || "Assignments"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timetable" className="space-y-4">
          <TimetableManagement refreshKey={refreshKey} readOnly={true} />
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <TeacherScheduleView refreshKey={refreshKey} readOnly={true} />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <ScheduleAssignmentView refreshKey={refreshKey} readOnly={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
