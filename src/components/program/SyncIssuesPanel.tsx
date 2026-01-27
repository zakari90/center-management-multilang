"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { scheduleActions } from "@/lib/dexie/dexieActions";
import ServerActionSchedules from "@/lib/dexie/scheduleServerAction";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  RefreshCw,
  Trash2,
  ArrowUpCircle,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FailedSchedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  subjectId: string;
  roomId: string;
  syncError?: string;
  status: string;
}

interface SyncIssuesPanelProps {
  onResolved?: () => void;
  teachers: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}

export function SyncIssuesPanel({
  onResolved,
  teachers,
  subjects,
}: SyncIssuesPanelProps) {
  const t = useTranslations("Program");
  const [failedSchedules, setFailedSchedules] = useState<FailedSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const fetchFailedSchedules = useCallback(async () => {
    try {
      const allSchedules = await scheduleActions.getAll();
      const failed = allSchedules.filter(
        (s) => s.syncError && s.status === "w",
      ) as unknown as FailedSchedule[];
      setFailedSchedules(failed);
    } catch (error) {
      console.error("Failed to fetch sync issues:", error);
    }
  }, []);

  useEffect(() => {
    fetchFailedSchedules();
  }, [fetchFailedSchedules]);

  const getTeacherName = (id: string) =>
    teachers.find((t) => t.id === id)?.name || "Unknown Teacher";

  const getSubjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name || "Unknown Subject";

  const handleRetryWithOverwrite = async (schedule: FailedSchedule) => {
    setActionInProgress(schedule.id);
    try {
      // Update the local record to allow overwrite
      await scheduleActions.update(schedule.id, {
        allowOverwrite: true,
        syncError: undefined,
      });

      // Try to sync again
      const result = await ServerActionSchedules.Sync();

      if (result.successCount > 0) {
        await fetchFailedSchedules();
        onResolved?.();
      }
    } catch (error) {
      console.error("Retry failed:", error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    setActionInProgress(scheduleId);
    try {
      await scheduleActions.deleteLocal(scheduleId);
      await fetchFailedSchedules();
      onResolved?.();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRetryAll = async () => {
    setIsLoading(true);
    try {
      // Update all failed schedules to allow overwrite
      for (const schedule of failedSchedules) {
        await scheduleActions.update(schedule.id, {
          allowOverwrite: true,
          syncError: undefined,
        });
      }

      const result = await ServerActionSchedules.Sync();
      await fetchFailedSchedules();

      if (result.successCount > 0) {
        onResolved?.();
      }
    } catch (error) {
      console.error("Retry all failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissAll = async () => {
    setIsLoading(true);
    try {
      for (const schedule of failedSchedules) {
        await scheduleActions.deleteLocal(schedule.id);
      }
      setFailedSchedules([]);
      onResolved?.();
    } catch (error) {
      console.error("Dismiss all failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no issues
  if (failedSchedules.length === 0) {
    return null;
  }

  const getErrorType = (error?: string) => {
    if (
      error?.includes("TEACHER_CONFLICT") ||
      error?.includes("Teacher already")
    )
      return "teacher";
    if (error?.includes("ROOM_CONFLICT") || error?.includes("Room"))
      return "room";
    return "unknown";
  };

  return (
    <Alert
      variant="destructive"
      className={cn(
        "mb-4 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 transition-all duration-300",
        isMinimized && "py-2",
      )}
    >
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <AlertTitle className="text-amber-800 dark:text-amber-200 font-semibold flex items-center gap-2">
            {t("syncIssues.title") || "Sync Issues"}
            <Badge variant="secondary" className="bg-amber-200 text-amber-800">
              {failedSchedules.length}
            </Badge>
          </AlertTitle>
          <div className="flex items-center gap-2">
            {!isMinimized && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryAll}
                  disabled={isLoading}
                  className="h-7 text-xs border-amber-300 hover:bg-amber-100"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  {t("syncIssues.retryAll") || "Retry All"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismissAll}
                  disabled={isLoading}
                  className="h-7 text-xs border-amber-300 hover:bg-amber-100 text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t("syncIssues.dismissAll") || "Dismiss All"}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-7 w-7 p-0"
            >
              {isMinimized ? "+" : "−"}
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm mt-1">
              {t("syncIssues.description") ||
                "Some schedules couldn't sync due to conflicts with existing data on the server."}
            </AlertDescription>

            <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">
              {failedSchedules.map((schedule) => {
                const errorType = getErrorType(schedule.syncError);
                const isProcessing = actionInProgress === schedule.id;

                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {schedule.day}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            errorType === "teacher" &&
                              "border-red-300 text-red-600",
                            errorType === "room" &&
                              "border-orange-300 text-orange-600",
                          )}
                        >
                          {errorType === "teacher"
                            ? t("syncIssues.teacherConflict") ||
                              "Teacher Conflict"
                            : errorType === "room"
                              ? t("syncIssues.roomConflict") || "Room Conflict"
                              : t("syncIssues.syncError") || "Sync Error"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {getTeacherName(schedule.teacherId)} •{" "}
                        {getSubjectName(schedule.subjectId)} • {schedule.roomId}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetryWithOverwrite(schedule)}
                        disabled={isProcessing || isLoading}
                        title={
                          t("syncIssues.overwriteTooltip") ||
                          "Replace existing schedule on server"
                        }
                        className="h-7 px-2 text-xs hover:bg-green-50 hover:text-green-600"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ArrowUpCircle className="h-3 w-3 mr-1" />
                        )}
                        {t("syncIssues.overwrite") || "Overwrite"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(schedule.id)}
                        disabled={isProcessing || isLoading}
                        title={
                          t("syncIssues.deleteTooltip") ||
                          "Remove this local schedule"
                        }
                        className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Alert>
  );
}
