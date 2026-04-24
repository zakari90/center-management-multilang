"use client";

import { useState } from "react";


import TimetableManagement from "@/components/freeinUse/TimeTableManagement";

export default function SchedulePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScheduleChange = () => {
    setRefreshKey((prev: number) => prev + 1);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* <PendingSchedulesDialog /> */}

      <TimetableManagement
        refreshKey={refreshKey}
        onScheduleChangeAction={handleScheduleChange}
      />
    </div>
  );
}
