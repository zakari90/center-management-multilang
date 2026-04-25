/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalizedConstants } from "@/components/freeinUse/useLocalizedConstants";
import { centerActions } from "@/freelib/dexie/freedexieaction";
import { timeTableActions } from "@/freelib/dexie/scheduleDb";
import { generateObjectId } from "@/freelib/utils/generateObjectId";
import { useLiveQuery } from "dexie-react-hooks";
import ExcelJS from "exceljs";
import { Clock, FileSpreadsheet, Loader2, MapPin, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { cn } from "@/freelib/utils";

interface ScheduleSlot {
  id?: string;
  day: string;
  startTime: string;
  endTime: string;
  name: string;
  roomId: string;
}

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
];

// parseWeeklySchedule removed as teacher logic was deleted

const normalizeDayKey = (day: string): string => {
  if (!day) return "";
  const d = day.toLowerCase().trim();
  // English
  if (d === "monday" || d === "mon") return "monday";
  if (d === "tuesday" || d === "tue") return "tuesday";
  if (d === "wednesday" || d === "wed") return "wednesday";
  if (d === "thursday" || d === "thu") return "thursday";
  if (d === "friday" || d === "fri") return "friday";
  if (d === "saturday" || d === "sat") return "saturday";
  if (d === "sunday" || d === "sun") return "sunday";

  // French
  if (d === "lundi") return "monday";
  if (d === "mardi") return "tuesday";
  if (d === "mercredi") return "wednesday";
  if (d === "jeudi") return "thursday";
  if (d === "vendredi") return "friday";
  if (d === "samedi") return "saturday";
  if (d === "dimanche") return "sunday";

  // Arabic (with and without hamza)
  if (d === "الاثنين" || d === "الإثنين") return "monday";
  if (d === "الثلاثاء") return "tuesday";
  if (d === "الأربعاء" || d === "الاربعاء") return "wednesday";
  if (d === "الخميس") return "thursday";
  if (d === "الجمعة") return "friday";
  if (d === "السبت") return "saturday";
  if (d === "الأحد" || d === "الاحد") return "sunday";

  return d; // Return as is if already a key or unknown
};

// Removed isTeacherAvailable as per request to delete teacher logic

export default function FreeTimetableManagement({
  centerId,
  refreshKey,
  onScheduleChangeAction,
  readOnly = false,
}: {
  centerId?: string;
  refreshKey?: number;
  onScheduleChangeAction?: () => void;
  readOnly?: boolean;
}) {
  // Translate using the 'TimetableManagement' namespace
  const t = useTranslations("TimetableManagement");
  const { daysOfWeek } = useLocalizedConstants();
  // Allow editing for guests locally, or restrict to admin if desired.
  // For now, let's allow everyone to edit since it's local-only data.
  const effectiveReadOnly = readOnly;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const [newEntry, setNewEntry] = useState({
    name: "",
    roomId: "",
  });

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedScheduleDetails, setSelectedScheduleDetails] =
    useState<ScheduleSlot | null>(null);

  const isSubmittingRef = useRef(false);

  const queryData = useLiveQuery(async () => {
    try {
      // Allow guests to see the schedule even if not logged in

      // ✅ Fetch from local DB
      const [allSchedules, allCenters] = await Promise.all([
        timeTableActions.getAll(),
        centerActions.getAll(),
      ]);

      // 2. Filter schedules (simplified for local mode)
      const filteredSchedules = allSchedules;

      // ✅ Transform schedules to match ScheduleSlot interface
      const scheduleSlots: ScheduleSlot[] = filteredSchedules.map((s: any) => ({
        id: s.id,
        day: normalizeDayKey(s.day),
        startTime: s.startTime,
        endTime: s.endTime,
        name: s.name || s.title || "N/A",
        roomId: s.roomId,
      }));

      return {
        schedule: scheduleSlots,
      };
    } catch (err) {
      console.error("Failed to fetch timetable data:", err);
      return null;
    }
  }, [centerId, refreshKey]);

  const schedule = queryData?.schedule || [];
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSlotClick = (dayKey: string, startTime: string) => {
    if (readOnly) return;
    const endTimeIndex = TIME_SLOTS.indexOf(startTime) + 1;
    const endTime = TIME_SLOTS[endTimeIndex] || "18:00";

    setSelectedSlot({ day: dayKey, startTime, endTime });

    setNewEntry({
      name: "",
      roomId: "",
    });

    setError("");
    setIsDialogOpen(true);
  };

  const [conflictingScheduleIds, setConflictingScheduleIds] = useState<
    string[]
  >([]);

  const handleAddSchedule = async (force = false) => {
    if (isSubmittingRef.current) return;

    if (!selectedSlot || !newEntry.roomId) {
      setError(t("errorFillAllFields"));
      return;
    }

    // Allow guests to add to their local schedule

    isSubmittingRef.current = true;
    setIsSaving(true);
    try {
      // ✅ Check for conflicts in local DB
      const allSchedules = await timeTableActions.getAll();
      const activeSchedules = allSchedules;

      // Check for any conflict in the same slot (same day, same time)
      const slotConflict = activeSchedules.find(
        (s: any) =>
          normalizeDayKey(s.day) === normalizeDayKey(selectedSlot.day) &&
          s.startTime === selectedSlot.startTime &&
          (centerId ? s.centerId === centerId : true),
      );

      if (slotConflict && !force) {
        setConflictingScheduleIds([slotConflict.id!].filter(Boolean));
        setError(t("roomConflict") + " " + t("overwritePrompt")); // Keep roomConflict translation key or use a new one
        setIsSaving(false);
        return;
      }

      // ✅ If force is true, delete conflicting schedules first
      if (force && conflictingScheduleIds.length > 0) {
        for (const id of conflictingScheduleIds) {
          await timeTableActions.delete(id);
        }
        setConflictingScheduleIds([]);
      }

      // ✅ Create schedule in local DB
      const now = Date.now();
      const scheduleId = generateObjectId();
      const newSchedule = {
        id: scheduleId,
        day: normalizeDayKey(selectedSlot.day),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        name: newEntry.name,
        roomId: newEntry.roomId,
        centerId: centerId || undefined,
        createdAt: now,
        updatedAt: now,
      };

      await timeTableActions.save(newSchedule);

      setIsDialogOpen(false);
      setNewEntry({ name: "", roomId: "" });
      setError("");
      setConflictingScheduleIds([]); // Clear conflicts
      onScheduleChangeAction?.();
    } catch (err) {
      setError(t("errorAddSchedule"));
    } finally {
      setIsSaving(false);
      isSubmittingRef.current = false;
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await timeTableActions.delete(scheduleId);
      onScheduleChangeAction?.();
    } catch (err) {
      setError(t("errorDeleteSchedule"));
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Timetable");

      // Set columns
      const headerRow = ["Time", ...daysOfWeek.map((day: any) => day.label)];
      worksheet.addRow(headerRow);

      // Apply styling to header
      const firstRow = worksheet.getRow(1);
      firstRow.font = { bold: true };
      firstRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
      firstRow.alignment = { horizontal: "center", vertical: "middle" };

      // Add data rows
      TIME_SLOTS.slice(0, -1).forEach((time, index) => {
        const timeLabel = `${time} - ${TIME_SLOTS[index + 1]}`;
        const rowData = [timeLabel];

        daysOfWeek.forEach((day: any) => {
          const slots = getSlotsByDayAndTime(day.key, time);
          if (slots.length > 0) {
            const cellText = slots
              .map((slot: any) => {
                return `${slot.name || "N/A"} (${slot.roomId})`;
              })
              .join("\n");
            rowData.push(cellText);
          } else {
            rowData.push("");
          }
        });

        const addedRow = worksheet.addRow(rowData);
        addedRow.alignment = { wrapText: true, vertical: "top" };
      });

      // Simple column widths
      worksheet.columns.forEach((col, idx) => {
        col.width = idx === 0 ? 15 : 25;
      });

      // Add borders
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Timetable_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export Excel file");
    }
  };

  const handleViewDetails = (slot: ScheduleSlot) => {
    setSelectedScheduleDetails(slot);
    setIsDetailsDialogOpen(true);
  };

  const filteredSchedule = schedule;

  const getSlotsByDayAndTime = (dayKey: string, time: string) => {
    return filteredSchedule.filter(
      (s: any) =>
        normalizeDayKey(s.day) === normalizeDayKey(dayKey) &&
        s.startTime === time,
    );
  };

  // Show loading while data is fetching
  if (queryData === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          variant="outline"
          size="default"
          onClick={handleExportExcel}
          className="flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {t("exportExcel")}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {conflictingScheduleIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="ml-4 bg-red-700 hover:bg-red-800"
                onClick={() => handleAddSchedule(true)} // Force overwrite
              >
                {t("overwrite") || "Overwrite"}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Timetable Grid */}
      <Card className="border-none bg-black/20 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader>
          <CardTitle>{t("weeklySchedule")}</CardTitle>
          <CardDescription>
            {effectiveReadOnly
              ? t("weeklyScheduleReadOnly") || "Weekly Schedule (Read Only)"
              : t("weeklyScheduleDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="w-full overflow-x-auto">
            {/* Inner wrapper — wide enough to always show all 7 day columns */}
            <div style={{ minWidth: `${7 * 140 + 110}px` }}>

              {/* ── Header Row ── */}
              <div
                className="grid gap-1.5 mb-1.5"
                style={{ gridTemplateColumns: `110px repeat(${daysOfWeek.length}, 1fr)` }}
              >
                {/* Time header */}
                <div className="font-bold text-xs uppercase tracking-wider text-indigo-400 p-3 border border-indigo-500/20 rounded-xl bg-black/60">
                  {t("time")}
                </div>
                {/* Day headers */}
                {daysOfWeek.map((day: any) => (
                  <div
                    key={day.key}
                    className="font-bold text-xs uppercase tracking-wider text-center p-3 bg-indigo-500/10 text-indigo-300 rounded-xl border border-indigo-500/20"
                  >
                    {day.label}
                  </div>
                ))}
              </div>

              {/* ── Time Slot Rows ── */}
              <div className="flex flex-col gap-1.5">
                {TIME_SLOTS.slice(0, -1).map((time, timeIndex) => (
                  <div
                    key={time}
                    className="grid gap-1.5"
                    style={{ gridTemplateColumns: `110px repeat(${daysOfWeek.length}, 1fr)` }}
                  >
                    {/* Time label */}
                    <div className="flex items-center justify-center text-[11px] font-semibold text-indigo-200 p-2 border border-white/5 rounded-xl bg-black/40 shadow-sm shrink-0">
                      <Clock className="h-3 w-3 mr-1 text-indigo-400 shrink-0" />
                      <span className="whitespace-nowrap">{time}–{TIME_SLOTS[timeIndex + 1]}</span>
                    </div>

                    {/* Day cells */}
                    {daysOfWeek.map((day: any) => {
                      const slots = getSlotsByDayAndTime(day.key, time);
                      const hasSlot = slots.length > 0;

                      return (
                        <div
                          key={`${day.key}-${time}`}
                          onClick={() =>
                            !effectiveReadOnly && handleSlotClick(day.key, time)
                          }
                          className={cn(
                            "min-h-[80px] p-1.5 rounded-xl transition-all flex flex-col relative group/cell border",
                            hasSlot
                              ? "bg-indigo-500/5 border-indigo-500/20"
                              : "bg-white/[0.03] border-dashed border-white/10",
                            !effectiveReadOnly && !hasSlot &&
                              "cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5",
                            !effectiveReadOnly && hasSlot && "cursor-pointer",
                          )}
                        >
                          {/* Hover add icon (empty cell) */}
                          {!hasSlot && !effectiveReadOnly && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity z-10">
                              <div className="bg-indigo-500/10 p-1.5 rounded-full">
                                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                              </div>
                            </div>
                          )}

                          {/* Slot card */}
                          {hasSlot && slots[0] && (
                            <div
                              key={slots[0].id || 0}
                              className="flex-1 p-2 rounded-lg text-xs space-y-1 cursor-pointer hover:bg-indigo-500/20 transition-all"
                              style={{
                                borderLeft: "3px solid #6366f1",
                                background: "rgba(99,102,241,0.08)",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(slots[0]);
                              }}
                            >
                              <span className="font-semibold block truncate text-indigo-200">
                                {slots[0].name}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <MapPin className="h-3 w-3 opacity-70 shrink-0" />
                                <span className="truncate">{slots[0].roomId}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addClassSchedule")}</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  {daysOfWeek.find((d: any) => d.key === selectedSlot.day)
                    ?.label || selectedSlot.day}
                  , {selectedSlot.startTime} - {selectedSlot.endTime}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                {conflictingScheduleIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-4 bg-red-700 hover:bg-red-800"
                    onClick={() => handleAddSchedule(true)} // Force overwrite
                  >
                    {t("overwrite") || "Overwrite"}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("registerName") || "Register Name"}</Label>
              <Input
                value={newEntry.name}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={
                  t("registerNamePlaceholder") || "Enter Register Name"
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t("room")} {t("required")}
              </Label>
              <Input
                value={newEntry.roomId}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, roomId: e.target.value }))
                }
                placeholder={t("roomPlaceholder") || "Enter Room"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => handleAddSchedule(false)}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("addToSchedule")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("scheduleDetails") || "Schedule Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedScheduleDetails && (
                <>
                  {daysOfWeek.find(
                    (d: any) =>
                      d.key === normalizeDayKey(selectedScheduleDetails.day),
                  )?.label || selectedScheduleDetails.day}
                  , {selectedScheduleDetails.startTime} -{" "}
                  {selectedScheduleDetails.endTime}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedScheduleDetails && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  {t("registerName") || "Register Name"}
                </Label>
                <div className="p-3 bg-muted rounded-md capitalize">
                  <span>{selectedScheduleDetails.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t("room")}</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedScheduleDetails.roomId}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t("time")}</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedScheduleDetails.startTime} -{" "}
                    {selectedScheduleDetails.endTime}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  {t("day") || "Day"}
                </Label>
                <div className="p-3 bg-muted rounded-md">
                  <span>
                    {daysOfWeek.find(
                      (d: any) =>
                        d.key === normalizeDayKey(selectedScheduleDetails.day),
                    )?.label || selectedScheduleDetails.day}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center w-full sm:justify-between">
            {!effectiveReadOnly && selectedScheduleDetails?.id && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedScheduleDetails.id) {
                    handleDeleteSchedule(selectedScheduleDetails.id);
                    setIsDetailsDialogOpen(false);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("delete") || "Delete"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              {t("close") || "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
