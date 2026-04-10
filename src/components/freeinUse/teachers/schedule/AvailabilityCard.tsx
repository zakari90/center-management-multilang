import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { TeacherWithSchedule } from "./types";

export function AvailabilityCard({
  teacher,
}: {
  teacher: TeacherWithSchedule;
}) {
  const t = useTranslations("TeacherScheduleView");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          {t("availableHours")}
        </CardTitle>
        <CardDescription>{t("availableHoursDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {teacher.weeklySchedule.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {teacher.weeklySchedule.map((slot, idx) => (
              <div
                key={idx}
                className="p-3 bg-primary/10 border border-primary/20 rounded-lg"
              >
                <div className="font-semibold text-sm text-primary">
                  {slot.day}
                </div>
                <div className="text-sm text-primary/80 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {slot.startTime} - {slot.endTime}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("noAvailability")}</p>
            <p className="text-xs mt-1">{t("noAvailabilityDescription")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
