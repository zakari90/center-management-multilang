"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Trash2,
  Clock,
  User,
  BookOpen,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  scheduleActions,
  teacherActions,
  subjectActions,
} from "@/lib/dexie/dexieActions";
import { Schedule } from "@/lib/dexie/dbSchema";

interface PendingSchedule extends Schedule {
  teacherName?: string;
  subjectName?: string;
  conflictError?: string;
}

interface PendingSchedulesDialogProps {
  onRefresh?: () => void;
}

const DAYS_MAP: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export function PendingSchedulesDialog({
  onRefresh,
}: PendingSchedulesDialogProps) {
  const t = useTranslations("ScheduleConflict");
  const [open, setOpen] = useState(false);
  const [pendingSchedules, setPendingSchedules] = useState<PendingSchedule[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPendingSchedules = useCallback(async () => {
    setLoading(true);
    try {
      // Get schedules with status "w" (waiting) or "0" (pending deletion)
      const [pending, teachers, subjects] = await Promise.all([
        scheduleActions.getByStatus(["w", "0"]),
        teacherActions.getAll(),
        subjectActions.getAll(),
      ]);

      const enrichedSchedules: PendingSchedule[] = pending.map((schedule) => {
        const teacher = teachers.find((t) => t.id === schedule.teacherId);
        const subject = subjects.find((s) => s.id === schedule.subjectId);

        return {
          ...schedule,
          teacherName: teacher?.name || "Unknown Teacher",
          subjectName: subject?.name || "Unknown Subject",
          // We can add conflict error from localStorage if we store it
          conflictError: undefined,
        };
      });

      setPendingSchedules(enrichedSchedules);
    } catch (error) {
      console.error("Error fetching pending schedules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending schedules on mount to get the count
  useEffect(() => {
    fetchPendingSchedules();
  }, [fetchPendingSchedules]);

  useEffect(() => {
    if (open) {
      fetchPendingSchedules();
    }
  }, [open, fetchPendingSchedules]);

  const handleDelete = async (scheduleId: string) => {
    setDeleting(scheduleId);
    try {
      await scheduleActions.deleteLocal(scheduleId);
      await fetchPendingSchedules();
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting schedule:", error);
    } finally {
      setDeleting(null);
    }
  };

  const pendingCount = pendingSchedules.length;

  // Don't render anything if there are no pending schedules
  if (pendingCount === 0 && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={pendingCount > 0 ? "destructive" : "outline"}
          size="sm"
          className="relative"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Pending Schedules
          {pendingCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-white text-destructive"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Pending & Conflicting Schedules
          </DialogTitle>
          <DialogDescription>
            These schedules are waiting to sync or have conflicts. Review and
            resolve them to ensure proper synchronization.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading pending schedules...
          </div>
        ) : pendingSchedules.length === 0 ? (
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              No pending schedules. All schedules are synced!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {pendingSchedules.map((schedule) => (
              <Card
                key={schedule.id}
                className={
                  schedule.status === "0"
                    ? "border-red-200 bg-red-50/50"
                    : "border-yellow-200 bg-yellow-50/50"
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-foreground/70" />
                        {schedule.teacherName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5" />
                        {schedule.subjectName}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        schedule.status === "0" ? "destructive" : "secondary"
                      }
                    >
                      {schedule.status === "0"
                        ? "Pending Deletion"
                        : "Waiting to Sync"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-foreground/60" />
                      <span className="font-medium">
                        {DAYS_MAP[schedule.day] || schedule.day}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-foreground/60" />
                      <span className="font-medium">
                        {schedule.startTime} - {schedule.endTime}
                      </span>
                    </div>
                  </div>

                  {schedule.conflictError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">
                        <strong>Conflict:</strong> {schedule.conflictError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                      disabled={deleting === schedule.id}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      {deleting === schedule.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
