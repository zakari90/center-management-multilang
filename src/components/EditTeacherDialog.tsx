/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useMemo } from "react";
import {
  teacherActions,
  teacherSubjectActions,
  subjectActions,
  userActions,
} from "@/lib/dexie/dexieActions";
import { generateObjectId } from "@/lib/utils/generateObjectId";
import { useAuth } from "@/context/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, Plus, Loader2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ==================== INTERFACES ====================
interface DaySchedule {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface Subject {
  id: string;
  name: string;
  grade: string;
  price: number;
}

interface TeacherSubjectForm {
  subjectId: string;
  percentage?: number;
  hourlyRate?: number;
  compensationType: "percentage" | "hourly";
}

interface EditTeacherDialogProps {
  teacherId: string;
  onTeacherUpdated?: () => void;
  trigger?: React.ReactNode;
  adminMode?: boolean;
}

// ==================== SUB-COMPONENTS ====================
const SubjectCompensationCard = ({
  teacherSubject,
  index,
  subjects,
  assignedSubjects,
  onUpdate,
  onRemove,
}: {
  teacherSubject: TeacherSubjectForm;
  index: number;
  subjects: Subject[];
  assignedSubjects: TeacherSubjectForm[];
  onUpdate: (
    index: number,
    field: keyof TeacherSubjectForm,
    value: any,
  ) => void;
  onRemove: (index: number) => void;
}) => {
  const t = useTranslations("EditTeacherPage");

  const availableSubjects = subjects.filter(
    (s) =>
      !assignedSubjects.some((ts, i) => i !== index && ts.subjectId === s.id),
  );

  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-3 pb-3 space-y-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 space-y-2">
            <Select
              value={teacherSubject.subjectId}
              onValueChange={(value) => onUpdate(index, "subjectId", value)}
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder={t("selectSubject")} />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5}>
                {availableSubjects.map((subject) => (
                  <SelectItem
                    key={subject.id}
                    value={subject.id}
                    className="text-sm"
                  >
                    <span className="truncate max-w-[200px] sm:max-w-[300px] inline-block">
                      {subject.name} ({subject.grade}) - MAD {subject.price}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="h-9 w-9 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={teacherSubject.compensationType}
            onValueChange={(value) =>
              onUpdate(index, "compensationType", value)
            }
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={5}>
              <SelectItem value="percentage">{t("percentage")}</SelectItem>
              <SelectItem value="hourly">{t("hourlyRate")}</SelectItem>
            </SelectContent>
          </Select>

          {teacherSubject.compensationType === "percentage" ? (
            <Input
              type="number"
              min={1}
              max={100}
              step={0.1}
              value={teacherSubject.percentage || ""}
              onChange={(e) =>
                onUpdate(index, "percentage", parseFloat(e.target.value) || 0)
              }
              placeholder="50%"
              className="h-9 text-sm"
            />
          ) : (
            <Input
              type="number"
              min={0}
              step={0.01}
              value={teacherSubject.hourlyRate || ""}
              onChange={(e) =>
                onUpdate(index, "hourlyRate", parseFloat(e.target.value) || 0)
              }
              placeholder="MAD/hr"
              className="h-9 text-sm"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================
export default function EditTeacherDialog({
  teacherId,
  onTeacherUpdated,
  trigger,
  adminMode = false,
}: EditTeacherDialogProps) {
  const t = useTranslations("EditTeacherPage");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

  const DAYS = useMemo(
    () => [
      t("monday"),
      t("tuesday"),
      t("wednesday"),
      t("thursday"),
      t("friday"),
      t("saturday"),
      t("sunday"),
    ],
    [t],
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(
    DAYS.map((day) => ({
      day,
      startTime: "19:00",
      endTime: "21:00",
      isAvailable: false,
    })),
  );

  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubjectForm[]>(
    [],
  );

  // Fetch teacher data when dialog opens
  useEffect(() => {
    if (open && teacherId) {
      const fetchData = async () => {
        setIsFetching(true);
        setError("");
        try {
          if (!user?.id) {
            setError(t("unauthorized"));
            setIsFetching(false);
            return;
          }

          const [allTeachers, allTeacherSubjects, allSubjects] =
            await Promise.all([
              teacherActions.getAll(),
              teacherSubjectActions.getAll(),
              subjectActions.getAll(),
            ]);

          // Find teacher
          const teacherData = allTeachers.find(
            (t) => t.id === teacherId && t.status !== "0",
          );
          if (!teacherData) {
            throw new Error(t("teacherNotFound"));
          }

          // Get teacher subjects
          const teacherSubjectsData = allTeacherSubjects
            .filter((ts) => ts.teacherId === teacherId && ts.status !== "0")
            .map((ts) => {
              const subject = allSubjects.find(
                (s) => s.id === ts.subjectId && s.status !== "0",
              );
              if (!subject) return null;
              return {
                subjectId: ts.subjectId,
                percentage: ts.percentage || undefined,
                hourlyRate: ts.hourlyRate || undefined,
                compensationType: ts.percentage
                  ? "percentage"
                  : ("hourly" as const),
              };
            })
            .filter((ts) => ts !== null) as TeacherSubjectForm[];

          // Get all subjects for dropdown
          const activeSubjects = allSubjects
            .filter((s) => s.status !== "0")
            .map((s) => ({
              id: s.id,
              name: s.name,
              grade: s.grade,
              price: s.price,
            }));

          // Fetch managers if adminMode
          if (adminMode) {
            const allUsers = await userActions.getAll();
            const activeManagers = allUsers.filter(
              (u) => u.status !== "0" && u.role === "MANAGER",
            );
            setManagers(
              activeManagers.map((m) => ({ id: m.id, name: m.name })),
            );
          }

          // Parse weekly schedule
          let weeklyScheduleData = DAYS.map((day) => ({
            day,
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: false,
          }));

          if (teacherData.weeklySchedule) {
            try {
              const schedule =
                typeof teacherData.weeklySchedule === "string"
                  ? JSON.parse(teacherData.weeklySchedule)
                  : teacherData.weeklySchedule;

              if (Array.isArray(schedule)) {
                const scheduleMap = new Map(
                  schedule.map((s: unknown) => {
                    const parsed = typeof s === "string" ? JSON.parse(s) : s;
                    return [parsed.day, parsed];
                  }),
                );

                weeklyScheduleData = DAYS.map((day) => {
                  const existing = scheduleMap.get(day) as any;
                  return existing
                    ? {
                        day,
                        startTime: existing.startTime,
                        endTime: existing.endTime,
                        isAvailable: true,
                      }
                    : {
                        day,
                        startTime: "09:00",
                        endTime: "17:00",
                        isAvailable: false,
                      };
                });
              }
            } catch (e) {
              console.error("Error parsing weekly schedule:", e);
            }
          }

          // Set state
          setSubjects(activeSubjects);
          setFormData({
            name: teacherData.name,
            email: teacherData.email || "",
            phone: teacherData.phone || "",
            address: teacherData.address || "",
          });
          setWeeklySchedule(weeklyScheduleData);
          setTeacherSubjects(teacherSubjectsData);
          if (teacherData.managerId) {
            setSelectedManagerId(teacherData.managerId);
          }
        } catch (err) {
          console.error("Failed to fetch teacher:", err);
          setError(err instanceof Error ? err.message : t("errorFetchData"));
        } finally {
          setIsFetching(false);
        }
      };
      fetchData();
    }
  }, [open, teacherId, user, t, DAYS]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleChange = (
    index: number,
    field: keyof DaySchedule,
    value: string | boolean,
  ) => {
    setWeeklySchedule((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSubject = () => {
    setTeacherSubjects((prev) => [
      ...prev,
      {
        subjectId: "",
        compensationType: "percentage",
        percentage: 0,
        hourlyRate: 0,
      },
    ]);
  };

  const removeSubject = (index: number) => {
    setTeacherSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSubject = (
    index: number,
    field: keyof TeacherSubjectForm,
    value: any,
  ) => {
    setTeacherSubjects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!user) {
      setError(t("unauthorized"));
      setIsLoading(false);
      return;
    }

    try {
      const validSubjects = teacherSubjects.filter((ts) => ts.subjectId);

      for (const ts of validSubjects) {
        if (
          ts.compensationType === "percentage" &&
          (!ts.percentage || ts.percentage <= 0 || ts.percentage > 100)
        ) {
          throw new Error(t("errorPercentage"));
        }
        if (
          ts.compensationType === "hourly" &&
          (!ts.hourlyRate || ts.hourlyRate <= 0)
        ) {
          throw new Error(t("errorHourlyRate"));
        }
      }

      // Get existing teacher
      const existingTeacher = await teacherActions.getLocal(teacherId);
      if (!existingTeacher) {
        throw new Error(t("teacherNotFound"));
      }

      // Update teacher in local DB
      const now = Date.now();
      const activeSchedule = weeklySchedule
        .filter((day) => day.isAvailable)
        .map(({ day, startTime, endTime }) =>
          JSON.stringify({ day, startTime, endTime }),
        );

      const updatedTeacher = {
        ...existingTeacher,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        weeklySchedule: activeSchedule.length > 0 ? activeSchedule : [],
        managerId: adminMode ? selectedManagerId : existingTeacher.managerId,
        status: "w" as const,
        updatedAt: now,
      };

      await teacherActions.putLocal(updatedTeacher);

      // Update teacher subjects
      const existingTeacherSubjects = await teacherSubjectActions.getAll();
      const currentTeacherSubjects = existingTeacherSubjects.filter(
        (ts) => ts.teacherId === teacherId && ts.status !== "0",
      );

      // Remove subjects no longer in list
      const subjectsToRemove = currentTeacherSubjects.filter(
        (cts) => !validSubjects.some((vs) => vs.subjectId === cts.subjectId),
      );
      for (const ts of subjectsToRemove) {
        await teacherSubjectActions.markForDelete(ts.id);
      }

      // Update or add subjects
      for (const vs of validSubjects) {
        const existing = currentTeacherSubjects.find(
          (cts) => cts.subjectId === vs.subjectId,
        );

        if (existing) {
          await teacherSubjectActions.putLocal({
            ...existing,
            percentage:
              vs.compensationType === "percentage" ? vs.percentage : undefined,
            hourlyRate:
              vs.compensationType === "hourly" ? vs.hourlyRate : undefined,
            status: "w" as const,
            updatedAt: now,
          });
        } else {
          const teacherSubjectId = generateObjectId();
          await teacherSubjectActions.putLocal({
            id: teacherSubjectId,
            teacherId: teacherId,
            subjectId: vs.subjectId,
            percentage:
              vs.compensationType === "percentage" ? vs.percentage : undefined,
            hourlyRate:
              vs.compensationType === "hourly" ? vs.hourlyRate : undefined,
            assignedAt: now,
            status: "w" as const,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      setOpen(false);
      onTeacherUpdated?.();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(t("errorSomethingWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" title="Edit">
            <Pencil className="w-4 h-4 text-green-600" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {t("basicInformation")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-name" className="text-sm">
                      {t("fullName")}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t("namePlaceholder")}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-email" className="text-sm">
                      {t("email")}
                    </Label>
                    <Input
                      type="email"
                      id="edit-email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={t("emailPlaceholder")}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone" className="text-sm">
                      {t("phoneNumber")}
                    </Label>
                    <Input
                      id="edit-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder={t("phonePlaceholder")}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-address" className="text-sm">
                      {t("address")}
                    </Label>
                    <Input
                      id="edit-address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder={t("addressPlaceholder")}
                      className="h-9"
                    />
                  </div>
                  {adminMode && (
                    <div className="space-y-1.5 col-span-1 sm:col-span-2">
                      <Label htmlFor="edit-manager" className="text-sm">
                        Manager
                      </Label>
                      <Select
                        value={selectedManagerId}
                        onValueChange={setSelectedManagerId}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select Manager" />
                        </SelectTrigger>
                        <SelectContent sideOffset={5} position="popper">
                          {managers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Subjects & Compensation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {t("subjectsCompensation")}
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubject}
                    disabled={subjects.length === 0}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t("addSubject")}
                  </Button>
                </div>

                {subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
                    {t("noSubjectsAssigned")}
                  </p>
                ) : teacherSubjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
                    {t("noSubjectsAssigned")}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {teacherSubjects.map((ts, index) => (
                      <SubjectCompensationCard
                        key={index}
                        teacherSubject={ts}
                        index={index}
                        subjects={subjects}
                        assignedSubjects={teacherSubjects}
                        onUpdate={updateSubject}
                        onRemove={removeSubject}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Weekly Schedule */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {t("weeklySchedule")}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {weeklySchedule.map((schedule, index) => (
                    <div
                      key={schedule.day}
                      className={`flex items-center gap-2 p-2 rounded-md border ${
                        schedule.isAvailable
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        id={`edit-day-${schedule.day}`}
                        checked={schedule.isAvailable}
                        onCheckedChange={(checked) =>
                          handleScheduleChange(
                            index,
                            "isAvailable",
                            checked as boolean,
                          )
                        }
                      />
                      <Label
                        htmlFor={`edit-day-${schedule.day}`}
                        className="text-xs cursor-pointer truncate"
                      >
                        {schedule.day}
                      </Label>
                    </div>
                  ))}
                </div>

                {weeklySchedule.some((s) => s.isAvailable) && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground block mb-1">
                        {t("from")}
                      </span>
                      <Input
                        type="time"
                        value={
                          weeklySchedule.find((s) => s.isAvailable)
                            ?.startTime || "09:00"
                        }
                        onChange={(e) => {
                          weeklySchedule.forEach((s, i) => {
                            if (s.isAvailable) {
                              handleScheduleChange(
                                i,
                                "startTime",
                                e.target.value,
                              );
                            }
                          });
                        }}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground block mb-1">
                        {t("to")}
                      </span>
                      <Input
                        type="time"
                        value={
                          weeklySchedule.find((s) => s.isAvailable)?.endTime ||
                          "17:00"
                        }
                        onChange={(e) => {
                          weeklySchedule.forEach((s, i) => {
                            if (s.isAvailable) {
                              handleScheduleChange(
                                i,
                                "endTime",
                                e.target.value,
                              );
                            }
                          });
                        }}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    t("saveChanges")
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
