"use client";

import { useState } from "react";

import TeacherScheduleView from "@/components/inUse/teacherWithSchedule";
import TimetableManagement from "@/components/inUse/TimeTableManagement";
// import { PendingSchedulesDialog } from "@/components/schedule/PendingSchedulesDialog"; // Manager doesn't need to approve/manage pending schedules

export default function SchedulePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScheduleChange = () => {
    setRefreshKey((prev: number) => prev + 1);
  };

  console.log("[ManagerSchedulePage] Client render", {
    timestamp: new Date().toISOString(),
  });
  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* PendingSchedulesDialog removed for manager read-only view */}
      {/* <PendingSchedulesDialog /> */}
      <TeacherScheduleView refreshKey={refreshKey} />
      <TimetableManagement
        refreshKey={refreshKey}
        onScheduleChangeAction={handleScheduleChange}
        readOnly={true} // Enable read-only mode
      />
    </div>
  );
}
