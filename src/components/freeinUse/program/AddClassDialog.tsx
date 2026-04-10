"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, X, Clock } from "lucide-react";
import { Teacher, Subject, ScheduleSlot } from "./ProgramView";
import { scheduleActions } from "@/freelib/dexie/freedexieaction";
import { generateObjectId } from "@/freelib/utils/generateObjectId";

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: { day: string; startTime: string; endTime: string } | null;
  teachers: Teacher[];
  subjects: Subject[];
  rooms: string[];
  existingSchedules: ScheduleSlot[];
  onSuccess: () => void;
  userId: string;
}

export function AddClassDialog({
  open,
  onOpenChange,
  initialData,
  teachers,
  subjects,
  rooms,
  existingSchedules,
  onSuccess,
  userId,
}: AddClassDialogProps) {
  const t = useTranslations("Program");

  const [formData, setFormData] = useState({
    teacherId: "",
    subjectId: "",
    roomId: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictingIds, setConflictingIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setFormData({ teacherId: "", subjectId: "", roomId: "" });
      setError(null);
      setConflictingIds([]);
    }
  }, [open]);

  const handleSubmit = async (forceOverwrite = false) => {
    if (!initialData) return;

    if (!formData.teacherId || !formData.subjectId || !formData.roomId) {
      setError(
        t("validationErrors.allFieldsRequired") ||
          "Please select all required information.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Check Conflicts (Optimized check)
      const baseConflict = existingSchedules.filter(
        (s) =>
          s.day === initialData.day &&
          s.startTime < initialData.endTime &&
          s.endTime > initialData.startTime,
      );

      const teacher = teachers.find((t) => t.id === formData.teacherId);

      let teacherConflict = baseConflict.find(
        (s) => s.teacherId === formData.teacherId,
      );

      // If teacher explicitly allows conflicts, ignore the teacher constraint
      if ((teacher as any)?.overrideConflicts) {
        teacherConflict = undefined;
      }

      const roomConflict = baseConflict.find(
        (s) => s.roomId === formData.roomId,
      );

      if ((teacherConflict || roomConflict) && !forceOverwrite) {
        const foundConflicts = [teacherConflict, roomConflict].filter(
          Boolean,
        ) as ScheduleSlot[];
        setConflictingIds(foundConflicts.map((c) => c.id));

        let msg = teacherConflict
          ? t("conflicts.teacherBusy") ||
            "This teacher is already assigned to a class in another room."
          : t("conflicts.roomOccupied") ||
            "This room is already occupied during this time.";

        setError(msg);
        setIsSubmitting(false);
        return;
      }

      // 2. Perform Overwrite if requested
      if (forceOverwrite && conflictingIds.length > 0) {
        for (const id of conflictingIds) {
          await scheduleActions.deleteLocal(id);
        }
      }

      // 3. Create the Record
      const now = Date.now();
      const newId = generateObjectId();

      const newRecord = {
        id: newId,
        day: initialData.day,
        startTime: initialData.startTime,
        endTime: initialData.endTime,
        teacherId: formData.teacherId,
        subjectId: formData.subjectId,
        roomId: formData.roomId,
        adminId: userId,
        createdAt: now,
        updatedAt: now,
      };

      await scheduleActions.putLocal(newRecord);
      // Server sync removed in local-only mode

      onSuccess();
    } catch (err) {
      console.error("Critical error saving schedule:", err);
      setError(
        t("errors.saveFailed") ||
          "System failed to save the class. Please refresh and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <div className="bg-primary/5 px-6 py-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary tracking-tight">
              {t("addClass") || "Plan a Session"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/80 font-medium">
              {initialData && (
                <span className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {initialData.day}, {initialData.startTime} —{" "}
                  {initialData.endTime}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <Alert
              variant="destructive"
              className="bg-destructive/5 border-destructive/20 py-4 animate-in fade-in slide-in-from-top-4 duration-300"
            >
              <AlertCircle className="h-5 w-5" />
              <div className="ml-2 flex flex-col gap-3">
                <AlertTitle className="font-bold flex justify-between items-center">
                  {t("conflictWarning") || "Scheduling Warning"}
                  <button
                    onClick={() => setError(null)}
                    className="hover:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </AlertTitle>
                <AlertDescription className="text-sm leading-relaxed">
                  {error}
                </AlertDescription>
                {conflictingIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-1 font-bold shadow-sm"
                    onClick={() => handleSubmit(true)}
                  >
                    {t("buttons.replaceExisting") || "Overwrite & Save Anyway"}
                  </Button>
                )}
              </div>
            </Alert>
          )}

          <div className="grid gap-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="teacher"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                {t("labels.teacher") || "Lead Teacher"}
              </Label>
              <Select
                value={formData.teacherId}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, teacherId: val }))
                }
              >
                <SelectTrigger
                  id="teacher"
                  className="h-12 rounded-xl bg-muted/30 border-transparent focus:ring-primary/20 transition-all"
                >
                  <SelectValue
                    placeholder={
                      t("placeholders.selectTeacher") || "Choose an instructor"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="rounded-xl p-1">
                  {teachers.map((t) => (
                    <SelectItem
                      key={t.id}
                      value={t.id}
                      className="rounded-lg py-2.5"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-medium">{t.name}</span>
                        {t.availableHours !== undefined && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {t.availableHours}h
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="subject"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                {t("labels.subject") || "Assigned Subject"}
              </Label>
              <Select
                value={formData.subjectId}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, subjectId: val }))
                }
              >
                <SelectTrigger
                  id="subject"
                  className="h-12 rounded-xl bg-muted/30 border-transparent focus:ring-primary/20 transition-all"
                >
                  <SelectValue
                    placeholder={
                      t("placeholders.selectSubject") || "Choose a course"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="rounded-xl p-1">
                  {subjects.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      className="rounded-lg py-3"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-[10px] opacity-70">
                          {s.grade}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label
                htmlFor="room"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                {t("labels.room") || "Facility / Room"}
              </Label>
              <Select
                value={formData.roomId}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, roomId: val }))
                }
              >
                <SelectTrigger
                  id="room"
                  className="h-12 rounded-xl bg-muted/30 border-transparent focus:ring-primary/20 transition-all"
                >
                  <SelectValue
                    placeholder={
                      t("placeholders.selectRoom") || "Assign a location"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="rounded-xl p-1">
                  {rooms.map((r) => (
                    <SelectItem key={r} value={r} className="rounded-lg py-3">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-muted/30 px-6 py-5 gap-3 sm:gap-0 mt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="hover:bg-background rounded-xl font-semibold"
          >
            {t("buttons.cancel") || "Dismiss"}
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              t("buttons.confirm") || "Plan Session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
