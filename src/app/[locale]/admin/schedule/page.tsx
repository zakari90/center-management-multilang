"use client";

import { useState } from "react";

import TeacherScheduleView from "@/components/inUse/teacherWithSchedule";
import TimetableManagement from "@/components/inUse/TimeTableManagement";
import { PendingSchedulesDialog } from "@/components/schedule/PendingSchedulesDialog";
import ScheduleAssignmentView from "@/components/schedules/ScheduleAssignmentView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SchedulePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScheduleChange = () => {
    setRefreshKey((prev: number) => prev + 1);
  };

  console.log("[AdminSchedulePage] Client render", {
    timestamp: new Date().toISOString(),
  });
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schedule Management</h1>
        <PendingSchedulesDialog />
      </div>

      <Tabs defaultValue="standard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="standard">Standard View</TabsTrigger>
          <TabsTrigger value="assignment">Room Assignment</TabsTrigger>
        </TabsList>
        <TabsContent value="standard" className="space-y-4 pt-4">
          <TeacherScheduleView refreshKey={refreshKey} />
          <TimetableManagement
            refreshKey={refreshKey}
            onScheduleChangeAction={handleScheduleChange}
          />
        </TabsContent>
        -------------------------------------------------
        <TabsContent value="assignment" className="space-y-4 pt-4">
          <ScheduleAssignmentView
            refreshKey={refreshKey}
            onScheduleChangeAction={handleScheduleChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
