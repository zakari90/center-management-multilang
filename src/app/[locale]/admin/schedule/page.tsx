"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import TeacherScheduleView from "@/components/inUse/teacherWithSchedule";
import TimetableManagement from "@/components/inUse/TimeTableManagement";
import ScheduleAssignmentView from "@/components/schedules/ScheduleAssignmentView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SchedulePage() {
  const t = useTranslations("SchedulePage");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScheduleChange = () => {
    setRefreshKey((prev: number) => prev + 1);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Tabs defaultValue="timetable" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="timetable">{t("timetable")}</TabsTrigger>
          <TabsTrigger value="teachers">{t("teachers")}</TabsTrigger>
          <TabsTrigger value="assignments">{t("assignments")}</TabsTrigger>
        </TabsList>

        <TabsContent value="timetable" className="space-y-4">
          <TimetableManagement
            refreshKey={refreshKey}
            onScheduleChangeAction={handleScheduleChange}
          />
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <TeacherScheduleView refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <ScheduleAssignmentView
            refreshKey={refreshKey}
            onScheduleChangeAction={handleScheduleChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
