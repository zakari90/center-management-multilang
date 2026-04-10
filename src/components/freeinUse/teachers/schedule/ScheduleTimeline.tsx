import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/freecomponents/ui/card";
import { Badge } from "@/freecomponents/ui/badge";
import { Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { TeacherWithSchedule, Schedule, WeeklyScheduleSlot } from "./types";
import { isWithinAvailability, timeToPosition } from "./utils";
import { cn } from "@/freelib/utils";

const DAYS_ARRAY = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function TimelineScheduleView({
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
    <Card>
      <CardHeader>
        <CardTitle>{t("weeklyTimeline")}</CardTitle>
        <CardDescription>{t("weeklyTimelineDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 overflow-x-auto">
        {DAYS_ARRAY.map((day) => {
          const availability = availabilityByDay[day] || [];
          const schedules = schedulesByDay[day] || [];

          const hasContent = availability.length > 0 || schedules.length > 0;
          if (!hasContent) return null;

          return (
            <div key={day} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {day}
                </div>
                {schedules.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {schedules.length}{" "}
                    {schedules.length === 1 ? t("class") : t("classesPlural")}
                  </Badge>
                )}
              </div>

              <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden border">
                {availability.map((slot, idx) => {
                  const start = timeToPosition(slot.startTime);
                  const width = timeToPosition(slot.endTime) - start;

                  return (
                    <div
                      key={`avail-${idx}`}
                      className="absolute h-full bg-green-200/50 border-l-2 border-r-2 border-green-400"
                      style={{ left: `${start}%`, width: `${width}%` }}
                      title={`${t("available")}: ${slot.startTime} - ${slot.endTime}`}
                    >
                      <div className="text-xs p-1 text-green-800 font-medium truncate">
                        {t("available")}
                      </div>
                    </div>
                  );
                })}

                {schedules.map((schedule, idx) => {
                  const start = timeToPosition(schedule.startTime);
                  const width = timeToPosition(schedule.endTime) - start;
                  const isConflict = !isWithinAvailability(
                    schedule,
                    availability,
                  );

                  const topOffset = (idx % 2) * 6 + 2;

                  return (
                    <div
                      key={schedule.id}
                      className={cn(
                        "absolute h-10 rounded border-2 shadow-sm transition-all hover:shadow-md cursor-pointer",
                        isConflict
                          ? "bg-red-500 border-red-700 hover:bg-red-600"
                          : "bg-blue-500 border-blue-700 hover:bg-blue-600",
                      )}
                      style={{
                        left: `${start}%`,
                        width: `${Math.max(width, 5)}%`,
                        top: `${topOffset}px`,
                      }}
                      title={`${schedule.subject.name} (${schedule.subject.grade})\n${schedule.startTime} - ${schedule.endTime}\n${t("room")}: ${schedule.roomId}${isConflict ? `\n⚠️ ${t("outsideAvailableHours")}` : ""}`}
                    >
                      <div className="text-xs p-1 text-white font-medium truncate flex items-center gap-1">
                        {isConflict && (
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        )}
                        <span className="truncate">
                          {schedule.subject.name}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {availability.length > 0 && (
                  <>
                    {availability[0] &&
                      timeToPosition(availability[0].startTime) > 0 && (
                        <div
                          className="absolute h-full bg-gray-300/40 pointer-events-none"
                          style={{
                            left: 0,
                            width: `${timeToPosition(availability[0].startTime)}%`,
                          }}
                        />
                      )}
                    {availability[availability.length - 1] &&
                      timeToPosition(
                        availability[availability.length - 1].endTime,
                      ) < 100 && (
                        <div
                          className="absolute h-full bg-gray-300/40 pointer-events-none"
                          style={{
                            left: `${timeToPosition(availability[availability.length - 1].endTime)}%`,
                            width: `${100 - timeToPosition(availability[availability.length - 1].endTime)}%`,
                          }}
                        />
                      )}
                  </>
                )}
              </div>

              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>06:00</span>
                <span>09:00</span>
                <span>12:00</span>
                <span>15:00</span>
                <span>18:00</span>
                <span>20:00</span>
              </div>

              {schedules.length > 0 && (
                <div className="mt-2 space-y-1">
                  {schedules
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((schedule) => {
                      const isConflict = !isWithinAvailability(
                        schedule,
                        availability,
                      );
                      return (
                        <div
                          key={schedule.id}
                          className={cn(
                            "text-xs p-2 rounded flex items-center justify-between",
                            isConflict
                              ? "bg-red-50 text-red-900"
                              : "bg-blue-50 text-blue-900",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isConflict ? (
                              <AlertCircle className="h-3 w-3 text-red-600" />
                            ) : (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            )}
                            <span className="font-medium">
                              {schedule.startTime}-{schedule.endTime}
                            </span>
                            <span>{schedule.subject.name}</span>
                            <Badge variant="outline" className="text-xs h-4">
                              {schedule.subject.grade}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground">
                            {schedule.roomId}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}

        <div className="border-t pt-4 mt-4">
          <div className="text-sm font-medium mb-2">{t("legend")}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-green-200/50 border border-green-400 rounded"></div>
              <span>{t("availableTime")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-blue-500 border-2 border-blue-700 rounded"></div>
              <span>{t("scheduledClass")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-red-500 border-2 border-red-700 rounded"></div>
              <span>{t("conflict")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-gray-300/40 rounded"></div>
              <span>{t("unavailable")}</span>
            </div>
          </div>
        </div>

        {teacher.schedules.length === 0 &&
          teacher.weeklySchedule.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">{t("noAvailabilityOrSchedules")}</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
