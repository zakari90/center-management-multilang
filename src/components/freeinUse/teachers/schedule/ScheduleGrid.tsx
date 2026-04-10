import { Badge } from "@/freecomponents/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/freecomponents/ui/card";
import { cn } from "@/freelib/utils";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Schedule, TeacherWithSchedule, WeeklyScheduleSlot } from "./types";
import { isWithinAvailability } from "./utils";
// To avoid circular dependency if I exported DAYS from ExportButtons, I should probably put DAYS in utils or duplicate.
// Let's duplicate for now or better, create constants.ts. But I'll stick to duplicating or using 'Monday'...'Sunday' to be fast and safe.
const DAYS_ARRAY = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function GridScheduleView({
  teacher,
}: {
  teacher: TeacherWithSchedule;
}) {
  const t = useTranslations("TeacherScheduleView");

  const schedulesByDay = teacher.schedules.reduce(
    (acc, schedule) => {
      if (!acc[schedule.day]) acc[schedule.day] = [];
      acc[schedule.day].push(schedule);
      return acc;
    },
    {} as Record<string, Schedule[]>,
  );

  const availabilityByDay = teacher.weeklySchedule.reduce(
    (acc, slot) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day].push(slot);
      return acc;
    },
    {} as Record<string, WeeklyScheduleSlot[]>,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {DAYS_ARRAY.map((day) => {
        const daySchedules = (schedulesByDay[day] || []).sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        );
        const dayAvailability = availabilityByDay[day] || [];

        const hasContent =
          daySchedules.length > 0 || dayAvailability.length > 0;

        if (!hasContent) return null;

        return (
          <Card key={day}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {day}
                </div>
                {daySchedules.length > 0 && (
                  <Badge variant="secondary">{daySchedules.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {daySchedules.length > 0 ? (
                <div className="space-y-2">
                  {daySchedules.map((schedule) => {
                    const withinAvailability = isWithinAvailability(
                      schedule,
                      teacher.weeklySchedule,
                    );

                    return (
                      <div
                        key={schedule.id}
                        className={cn(
                          "p-3 rounded-md border space-y-2 transition-colors",
                          withinAvailability
                            ? "bg-green-50 border-green-200 hover:bg-green-100"
                            : "bg-red-50 border-red-200 hover:bg-red-100",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="h-3 w-3" />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                          {withinAvailability ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-3 w-3" />
                          <span className="font-medium">
                            {schedule.subject.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {schedule.subject.grade}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{schedule.roomId}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : dayAvailability.length > 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  {t("availableButNoClasses")}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
