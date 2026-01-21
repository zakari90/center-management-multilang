"use client";

import TeacherScheduleView from "@/components/inUse/teacherWithSchedule";
import TimetableManagement from "@/components/inUse/TimeTableManagement";
import { PendingSchedulesDialog } from "@/components/schedule/PendingSchedulesDialog";

export default function SchedulePage() {
  console.log("[AdminSchedulePage] Client render", {
    timestamp: new Date().toISOString(),
  });
  return (
    <div className="container mx-auto p-4 space-y-4">
      <PendingSchedulesDialog />
      <TeacherScheduleView />
      <TimetableManagement />
    </div>
  );
}
