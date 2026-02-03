"use client";

import { useState } from "react";

import TeacherScheduleView from "@/components/inUse/teacherWithSchedule";
import TimetableManagement from "@/components/inUse/TimeTableManagement";

export default function SchedulePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScheduleChange = () => {
    setRefreshKey((prev: number) => prev + 1);
  };

  console.log("[AdminSchedulePage] Client render", {
    timestamp: new Date().toISOString(),
  });
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* <PendingSchedulesDialog /> */}
      <TeacherScheduleView refreshKey={refreshKey} />
      <TimetableManagement
        refreshKey={refreshKey}
        onScheduleChangeAction={handleScheduleChange}
      />
    </div>
  );
}
