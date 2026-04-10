import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/freelib/utils"; // Assuming this exists as per original file
import { AlertCircle, Mail, Phone, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { ExportButton } from "./ExportButtons";
import { TeacherWithSchedule } from "./types";

export function TeacherInfoCard({ teacher }: { teacher: TeacherWithSchedule }) {
  const t = useTranslations("TeacherScheduleView");

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {teacher.name}
            </CardTitle>
            <CardDescription className="mt-2 space-y-1">
              {teacher.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>{teacher.email}</span>
                </div>
              )}
              {teacher.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{teacher.phone}</span>
                </div>
              )}
            </CardDescription>
          </div>
          <ExportButton teacher={teacher} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {teacher.availableHours.toFixed(1)}
              {t("hours")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("available")}
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {teacher.totalHours.toFixed(1)}
              {t("hours")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("scheduled")}
            </div>
          </div>
          <div
            className={cn(
              "text-center p-4 rounded-lg",
              teacher.utilizationRate >= 80
                ? "bg-red-50"
                : teacher.utilizationRate >= 60
                  ? "bg-yellow-50"
                  : "bg-green-50",
            )}
          >
            <div
              className={cn(
                "text-2xl font-bold",
                teacher.utilizationRate >= 80
                  ? "text-red-600"
                  : teacher.utilizationRate >= 60
                    ? "text-yellow-600"
                    : "text-green-600",
              )}
            >
              {teacher.utilizationRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              {t("utilization")}
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {teacher.schedules.length}
            </div>
            <div className="text-xs text-muted-foreground">{t("classes")}</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {teacher.subjectsCount}
            </div>
            <div className="text-xs text-muted-foreground">{t("subjects")}</div>
          </div>
        </div>

        {teacher.conflicts.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">
                {teacher.conflicts.length} {t("conflictsAlert")}
              </div>
              <ul className="space-y-2 text-sm">
                {teacher.conflicts.map((conflict) => {
                  const availability = teacher.weeklySchedule.find(
                    (slot) => slot.day === conflict.day,
                  );
                  return (
                    <li key={conflict.id} className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <div>
                        <div>
                          <span className="font-medium">{conflict.day}</span>{" "}
                          {conflict.startTime}-{conflict.endTime}
                          {" - "}
                          {conflict.subject.name} ({conflict.subject.grade})
                          {" - "}
                          {t("room")}: {conflict.roomId}
                        </div>
                        {availability ? (
                          <span className="text-xs block text-muted-foreground mt-0.5">
                            ✓ {t("available")}: {availability.startTime}-
                            {availability.endTime}
                          </span>
                        ) : (
                          <span className="text-xs block text-muted-foreground mt-0.5">
                            ✗ {t("notAvailableOn")} {conflict.day}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
