import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  MapPin,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { TeacherWithSchedule, Schedule } from "./types";
import { isWithinAvailability } from "./utils";
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

export function ListScheduleView({
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

  return (
    <div className="space-y-4">
      {DAYS_ARRAY.map((day) => {
        const daySchedules = (schedulesByDay[day] || []).sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        );

        if (daySchedules.length === 0) return null;

        const dayAvailability = teacher.weeklySchedule.find(
          (s) => s.day === day,
        );

        return (
          <Card key={day}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {day}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {dayAvailability && (
                    <Badge variant="outline" className="text-xs">
                      {t("available")}: {dayAvailability.startTime}-
                      {dayAvailability.endTime}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {daySchedules.length}{" "}
                    {daySchedules.length === 1
                      ? t("class")
                      : t("classesPlural")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                        "flex items-center justify-between p-4 border rounded-lg transition-colors",
                        withinAvailability
                          ? "hover:bg-secondary/10 border-secondary/20"
                          : "hover:bg-destructive/10 border-destructive/20 bg-destructive/10",
                      )}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-1">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {schedule.subject.name}
                          </span>
                          <Badge variant="outline">
                            {schedule.subject.grade}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 min-w-[120px]">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {schedule.roomId}
                          </span>
                        </div>
                      </div>

                      <div>
                        {withinAvailability ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {teacher.schedules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("noClassesScheduled")}
            </h3>
            <p className="text-muted-foreground">{t("noClassesDescription")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
