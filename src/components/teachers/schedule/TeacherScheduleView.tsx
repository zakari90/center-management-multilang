"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { useTeacherSchedule } from "./useTeacherSchedule";
import { TeacherInfoCard } from "./TeacherInfoCard";
import { AvailabilityCard } from "./AvailabilityCard";
import { GridScheduleView } from "./ScheduleGrid";
import { ListScheduleView } from "./ScheduleList";
import { TimelineScheduleView } from "./ScheduleTimeline";

export default function TeacherScheduleView1({
  centerId,
}: {
  centerId?: string;
}) {
  const t = useTranslations("TeacherScheduleView");
  const { teachers, isLoading, error } = useTeacherSchedule(centerId);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "timeline">(
    "grid",
  );

  // Set initial selected teacher once loaded
  if (!selectedTeacherId && teachers.length > 0) {
    setSelectedTeacherId(teachers[0].id);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={viewMode}
            onValueChange={(value: "grid" | "list" | "timeline") =>
              setViewMode(value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">{t("gridView")}</SelectItem>
              <SelectItem value="list">{t("listView")}</SelectItem>
              <SelectItem value="timeline">{t("timeline")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {teachers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("noTeachersFound")}
            </h3>
            <p className="text-muted-foreground">
              {t("noTeachersDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          value={selectedTeacherId || teachers[0]?.id}
          onValueChange={setSelectedTeacherId}
        >
          <div className="border rounded-lg p-2 bg-muted/30 overflow-x-auto">
            <TabsList className="w-full justify-start flex-nowrap h-auto gap-2">
              {teachers.map((teacher) => (
                <TabsTrigger
                  key={teacher.id}
                  value={teacher.id}
                  className="flex flex-col items-start px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{teacher.name}</span>
                    {teacher.conflicts.length > 0 && (
                      <Badge
                        variant="destructive"
                        className="h-5 px-1.5 text-xs"
                      >
                        {teacher.conflicts.length}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs opacity-80">
                    {teacher.totalHours.toFixed(1)}
                    {t("hours")}/{teacher.availableHours.toFixed(1)}
                    {t("hours")} • {teacher.utilizationRate}%
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {teachers.map((teacher) => (
            <TabsContent
              key={teacher.id}
              value={teacher.id}
              className="space-y-4 mt-4"
            >
              <TeacherInfoCard teacher={teacher} />
              <AvailabilityCard teacher={teacher} />

              {viewMode === "grid" && <GridScheduleView teacher={teacher} />}
              {viewMode === "list" && <ListScheduleView teacher={teacher} />}
              {viewMode === "timeline" && (
                <TimelineScheduleView teacher={teacher} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
