"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ProgramView } from "@/components/program/ProgramView";
import TeacherScheduleView from "@/components/inUse/teacherWithSchedule";

export default function ProgramPage() {
  const t = useTranslations("Program");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScheduleChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("title") || "Program Management"}
          </h1>
          <p className="text-muted-foreground">
            {t("subtitle") || "Manage class schedules from scratch"}
          </p>
        </div>
      </div>
      <TeacherScheduleView refreshKey={refreshKey} />
      <ProgramView onScheduleChangeAction={handleScheduleChange} />
    </div>
  );
}
