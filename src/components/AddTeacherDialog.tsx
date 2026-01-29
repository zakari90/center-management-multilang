/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/authContext";
import {
  subjectActions,
  teacherActions,
  teacherSubjectActions,
  userActions,
} from "@/lib/dexie/dexieActions";
import ServerActionTeachers from "@/lib/dexie/teacherServerAction";
import { generateObjectId } from "@/lib/utils/generateObjectId";
import { isOnline } from "@/lib/utils/network";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useRef, useState } from "react";

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

interface TeacherSubject {
  subjectId: string;
  percentage?: number;
  hourlyRate?: number;
  compensationType: "percentage" | "hourly";
}

interface AddTeacherDialogProps {
  onTeacherAdded?: () => void;
  adminMode?: boolean;
}

// ==================== SUB-COMPONENTS ====================

// Step Indicator for mobile
const StepIndicator = ({
  currentStep,
  totalSteps,
  stepLabels,
  adminMode,
}: {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  adminMode?: boolean;
}) => {
  const icons = adminMode
    ? [Users, User, BookOpen, Calendar, CheckCircle]
    : [User, BookOpen, Calendar, CheckCircle];

  return (
    <div className="flex items-center justify-center gap-2 py-3 md:hidden">
      {Array.from({ length: totalSteps }, (_, i) => {
        const Icon = icons[i] || CheckCircle;
        const isActive = i + 1 === currentStep;
        const isCompleted = i + 1 < currentStep;

        return (
          <div key={i} className="flex items-center">
            <div
              className={`
              flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all
              ${
                isActive
                  ? "bg-primary text-primary-foreground scale-110"
                  : isCompleted
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }
            `}
            >
              <Icon className="h-4 w-4" />
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 ${isCompleted ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Subject Compensation Card (simplified for dialog)
const SubjectCompensationCard = ({
  teacherSubject,
  index,
  subjects,
  assignedSubjects,
  onUpdate,
  onRemove,
}: {
  teacherSubject: TeacherSubject;
  index: number;
  subjects: Subject[];
  assignedSubjects: TeacherSubject[];
  onUpdate: (index: number, field: keyof TeacherSubject, value: any) => void;
  onRemove: (index: number) => void;
}) => {
  const t = useTranslations("CreateTeacherForm");

  const availableSubjects = subjects.filter(
    (s) =>
      !assignedSubjects.some((ts, i) => i !== index && ts.subjectId === s.id),
  );

  return (
    <Card className="bg-muted/50 overflow-hidden">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <Select
              value={teacherSubject.subjectId}
              onValueChange={(value) => onUpdate(index, "subjectId", value)}
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder={t("subject")} />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={5}
                className="max-w-[85vw]"
              >
                {availableSubjects.map((subject) => (
                  <SelectItem
                    key={subject.id}
                    value={subject.id}
                    className="text-sm"
                  >
                    <span className="truncate inline-block max-w-[calc(100vw-80px)]">
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
            className="h-9 w-9 text-destructive hover:text-destructive flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              className="h-9 text-sm w-[24px]"
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
export default function AddTeacherDialog({
  onTeacherAdded,
  adminMode = false,
}: AddTeacherDialogProps) {
  const t = useTranslations("CreateTeacherForm");
  const tTable = useTranslations("TeachersTable");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = adminMode ? 5 : 4;

  const DAYS = [
    t("monday"),
    t("tuesday"),
    t("wednesday"),
    t("thursday"),
    t("friday"),
    t("saturday"),
    t("sunday"),
  ];

  const stepLabels = adminMode
    ? [
        t("selectManagertitle") || "Select Manager",
        t("basicInfo"),
        t("subjectsCompensation"),
        t("weeklySchedule"),
        t("summary") || "Summary",
      ]
    : [
        t("basicInfo"),
        t("subjectsCompensation"),
        t("weeklySchedule"),
        t("summary") || "Summary",
      ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(
    DAYS.map((day) => ({
      day,
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: false,
    })),
  );

  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({ name: "", email: "", phone: "", address: "" });
      setWeeklySchedule(
        DAYS.map((day) => ({
          day,
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: false,
        })),
      );
      setTeacherSubjects([]);
      setError("");
      setCurrentStep(1);
      setSelectedManagerId("");
    }
  }, [open]);

  useEffect(() => {
    if (open && user) {
      if (adminMode) fetchManagers();
    }
  }, [open, user, adminMode]);

  const fetchManagers = async () => {
    try {
      const allUsers = await userActions.getAll();
      const activeManagers = allUsers.filter(
        (u) => u.status !== "0" && u.role === "MANAGER",
      );
      setManagers(activeManagers.map((m) => ({ id: m.id, name: m.name })));
    } catch (err) {
      console.error("Failed to fetch managers:", err);
    }
  };

  useEffect(() => {
    if (open) {
      const fetchSubjects = async () => {
        try {
          const allSubjects = await subjectActions.getAll();
          const activeSubjects = allSubjects
            .filter((s) => s.status !== "0")
            .map((s) => ({
              id: s.id,
              name: s.name,
              grade: s.grade,
              price: s.price,
            }));
          setSubjects(activeSubjects);
        } catch (err) {
          console.error("Failed to fetch subjects:", err);
        } finally {
          setLoadingSubjects(false);
        }
      };
      fetchSubjects();
    }
  }, [open]);

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
    field: keyof TeacherSubject,
    value: any,
  ) => {
    setTeacherSubjects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateCurrentStep = () => {
    // Step 1 validation for admin mode: require manager selection
    if (adminMode && currentStep === 1 && !selectedManagerId) {
      setError(t("errorsselectManager") || "Please select a manager");
      return false;
    }

    // Calculate the "real" step to determine which validation to apply
    const realStep = adminMode ? currentStep - 1 : currentStep;

    // Step 1 (basic info) validation: require name
    if (realStep === 1 && !formData.name.trim()) {
      setError(t("nameRequired") || "Name is required");
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;

    // Clear any existing errors
    setError("");

    // Move to next step if not at the final step
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      console.log(
        `[AddTeacherDialog] Moving from step ${currentStep} to step ${newStep} (totalSteps: ${totalSteps})`,
      );
      setCurrentStep(newStep);
    }
  };

  const prevStep = () => {
    setError("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isSubmittingRef = useRef(false);

  const saveTeacher = async () => {
    // Prevent double submission
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;

    setIsLoading(true);
    setError("");

    if (!user) {
      setError("Unauthorized: Please log in again");
      setIsLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    try {
      const validSubjects = teacherSubjects.filter((ts) => ts.subjectId);

      for (const ts of validSubjects) {
        if (
          ts.compensationType === "percentage" &&
          (!ts.percentage || ts.percentage <= 0 || ts.percentage > 100)
        ) {
          throw new Error("Percentage must be between 1 and 100");
        }
        if (
          ts.compensationType === "hourly" &&
          (!ts.hourlyRate || ts.hourlyRate <= 0)
        ) {
          throw new Error("Hourly rate must be greater than 0");
        }
      }

      // Check if email already exists in local DB
      if (formData.email) {
        const existingTeacher = await teacherActions.getLocalByEmail?.(
          formData.email,
        );
        if (existingTeacher) {
          setError("Email already in use");
          setIsLoading(false);
          isSubmittingRef.current = false;
          return;
        }
      }

      // Prepare weekly schedule
      const activeSchedule = weeklySchedule
        .filter((day) => day.isAvailable)
        .map(({ day, startTime, endTime }) =>
          JSON.stringify({ day, startTime, endTime }),
        );

      // Create teacher in local DB
      const now = Date.now();
      const teacherId = generateObjectId();
      const newTeacher = {
        id: teacherId,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        weeklySchedule: activeSchedule.length > 0 ? activeSchedule : undefined,
        managerId: adminMode ? selectedManagerId : user.id,
        status: "w" as const,
        createdAt: now,
        updatedAt: now,
      };

      await teacherActions.putLocal(newTeacher);

      // Create teacher-subject associations in local DB
      if (validSubjects.length > 0) {
        const teacherSubjectEntities = validSubjects.map((ts) => ({
          id: generateObjectId(),
          teacherId: teacherId,
          subjectId: ts.subjectId,
          percentage:
            ts.compensationType === "percentage" ? ts.percentage : undefined,
          hourlyRate:
            ts.compensationType === "hourly" ? ts.hourlyRate : undefined,
          assignedAt: now,
          status: "w" as const,
          createdAt: now,
          updatedAt: now,
        }));

        await teacherSubjectActions.bulkPutLocal(teacherSubjectEntities);
      }

      // Immediate sync to server if online
      if (isOnline()) {
        try {
          const result = await ServerActionTeachers.SaveToServer(
            newTeacher as any,
          );
          if (result) {
            await teacherActions.markSynced(teacherId);
            const teacherSubjectsToMark = await teacherSubjectActions.getAll();
            const idsToMark = teacherSubjectsToMark
              .filter((ts) => ts.teacherId === teacherId)
              .map((ts) => ts.id);
            if (idsToMark.length > 0) {
              await teacherSubjectActions.bulkMarkSynced(idsToMark);
            }
          }
        } catch (syncError) {
          console.error(
            "Teacher immediate sync failed, will retry later:",
            syncError,
          );
        }
      }

      // Close dialog and notify parent
      setOpen(false);
      onTeacherAdded?.();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(t("genericError"));
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mobile/Stepper behavior: If not on final step, act as "Next"
    if (currentStep < totalSteps) {
      nextStep();
      return;
    }

    await saveTeacher();
  };

  const handleDesktopSubmit = async () => {
    // Validate everything
    if (adminMode && !selectedManagerId) {
      setError(t("errorsselectManager") || "Please select a manager");
      return;
    }
    if (!formData.name.trim()) {
      setError(t("nameRequired") || "Name is required");
      return;
    }

    await saveTeacher();
  };

  // Step 0: Manager Selection (Admin only)
  const renderStep0 = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {t("selectManagertitle") || "Select Manager"}
      </h3>
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {managers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No managers available.
          </p>
        ) : (
          managers.map((manager) => (
            <Button
              key={manager.id}
              type="button"
              variant={selectedManagerId === manager.id ? "default" : "outline"}
              className="w-full justify-start text-left h-auto py-2"
              onClick={() => setSelectedManagerId(manager.id)}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{manager.name}</span>
              </div>
            </Button>
          ))
        )}
      </div>
    </div>
  );

  // Step 4: Summary/Review
  const renderSummary = () => {
    const selectedManager = managers.find((m) => m.id === selectedManagerId);
    const activeDays = weeklySchedule.filter((s) => s.isAvailable);

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
          {t("summary") || "Summary"}
        </h3>

        <div className="grid gap-4">
          {/* Manager Info (Admin Mode) */}
          {adminMode && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("selectManagertitle") || "Manager"}
              </p>
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-dashed">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {selectedManager?.name || "---"}
                </span>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("basicInfo")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/30 p-3 rounded-md border">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase">
                  {t("name")}
                </p>
                <p className="text-sm font-medium">{formData.name}</p>
              </div>
              {formData.email && (
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {t("email")}
                  </p>
                  <p className="text-sm font-medium">{formData.email}</p>
                </div>
              )}
              {formData.phone && (
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {t("phone")}
                  </p>
                  <p className="text-sm font-medium">{formData.phone}</p>
                </div>
              )}
              {formData.address && (
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {t("address")}
                  </p>
                  <p className="text-sm font-medium">{formData.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("subjectsCompensation")}
            </p>
            <div className="bg-muted/30 p-2 rounded-md border space-y-2">
              {teacherSubjects.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-2 text-center">
                  {t("noSubjectsAssigned")}
                </p>
              ) : (
                teacherSubjects.map((ts, idx) => {
                  const subject = subjects.find((s) => s.id === ts.subjectId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {subject?.name || "Unknown"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {subject?.grade}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-primary">
                          {ts.compensationType === "percentage"
                            ? `${ts.percentage}%`
                            : `MAD ${ts.hourlyRate}`}
                        </span>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {ts.compensationType === "percentage"
                            ? t("percentage")
                            : t("hourlyRate")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("weeklySchedule")}
            </p>
            <div className="bg-muted/30 p-2 rounded-md border">
              {activeDays.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-2 text-center">
                  {t("noAvailability")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {activeDays.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center px-3 py-1 bg-background rounded border shadow-sm"
                    >
                      <span className="text-[10px] font-bold text-primary uppercase">
                        {s.day.substring(0, 3)}
                      </span>
                      <span className="text-xs font-medium">
                        {s.startTime}-{s.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Step 1: Basic Information
  const renderStep1 = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {t("basicInfo")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm sr-only md:not-sr-only">
            {t("name")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t("name") + " *"}
            className="h-10 md:h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm sr-only md:not-sr-only">
            {t("email")}
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t("email")}
            className="h-10 md:h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm sr-only md:not-sr-only">
            {t("phone")}
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder={t("phone")}
            className="h-10 md:h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-sm sr-only md:not-sr-only">
            {t("address")}
          </Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder={t("address")}
            className="h-10 md:h-9"
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Subjects & Compensation
  const renderStep2 = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
          {t("subjectsCompensation")}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSubject}
          disabled={loadingSubjects || subjects.length === 0}
          className="md:ml-auto"
        >
          {/* <Plus className="h-3 w-3 mr-1" /> */}
          {t("addSubject")}
        </Button>
      </div>

      {loadingSubjects ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
          {t("noSubjects")}
        </p>
      ) : teacherSubjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
          {t("noSubjectsAssigned")}
        </p>
      ) : (
        <div className="space-y-2 max-h-[250px] md:max-h-[200px] overflow-y-auto">
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
  );

  // Step 3: Weekly Schedule
  const renderStep3 = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {t("weeklySchedule")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {weeklySchedule.map((schedule, index) => (
          <div
            key={schedule.day}
            className={`flex items-center gap-2 p-2.5 md:p-2 rounded-md border ${
              schedule.isAvailable
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/50"
            }`}
          >
            <Checkbox
              id={`day-${schedule.day}`}
              checked={schedule.isAvailable}
              onCheckedChange={(checked) =>
                handleScheduleChange(index, "isAvailable", checked as boolean)
              }
            />
            <Label
              htmlFor={`day-${schedule.day}`}
              className="text-xs cursor-pointer truncate"
            >
              {schedule.day}
            </Label>
          </div>
        ))}
      </div>

      {/* Time inputs for selected days */}
      {weeklySchedule.some((s) => s.isAvailable) && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="bulk-start-time"
              className="text-xs text-muted-foreground sr-only md:not-sr-only"
            >
              {t("from")}
            </Label>
            <Input
              id="bulk-start-time"
              type="time"
              value={
                weeklySchedule.find((s) => s.isAvailable)?.startTime || "09:00"
              }
              onChange={(e) => {
                weeklySchedule.forEach((s, i) => {
                  if (s.isAvailable) {
                    handleScheduleChange(i, "startTime", e.target.value);
                  }
                });
              }}
              className="h-10 md:h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="bulk-end-time"
              className="text-xs text-muted-foreground sr-only md:not-sr-only"
            >
              {t("to")}
            </Label>
            <Input
              id="bulk-end-time"
              type="time"
              value={
                weeklySchedule.find((s) => s.isAvailable)?.endTime || "17:00"
              }
              onChange={(e) => {
                weeklySchedule.forEach((s, i) => {
                  if (s.isAvailable) {
                    handleScheduleChange(i, "endTime", e.target.value);
                  }
                });
              }}
              className="h-10 md:h-9"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          {/* <Plus className="h-4 w-4 mr-2" /> */}
          {tTable("addTeacher")}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[700px] max-h-[96vh] flex flex-col overflow-hidden p-0">
        <div className="p-4 sm:p-6 pb-2 sm:pb-3 border-b shrink-0">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription className="hidden md:block">
              {t("subtitle") || tTable("subtitle")}
            </DialogDescription>
          </DialogHeader>

          {/* Mobile Step Indicator */}
          <div className="mt-2">
            <StepIndicator
              currentStep={currentStep}
              totalSteps={totalSteps}
              stepLabels={stepLabels}
              adminMode={adminMode}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 sm:pt-3">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form
            id="add-teacher-form"
            onSubmit={handleSubmit}
            className="space-y-4 pb-4"
          >
            <div className="space-y-4">
              {/* Step rendering logic */}
              {adminMode ? (
                <>
                  <div className={currentStep !== 1 ? "hidden" : "block"}>
                    {renderStep0()}
                  </div>
                  <div className={currentStep !== 2 ? "hidden" : "block"}>
                    {renderStep1()}
                  </div>
                  <div className={currentStep !== 3 ? "hidden" : "block"}>
                    {renderStep2()}
                  </div>
                  <div className={currentStep !== 4 ? "hidden" : "block"}>
                    {renderStep3()}
                  </div>
                  <div className={currentStep !== 5 ? "hidden" : "block"}>
                    {renderSummary()}
                  </div>
                </>
              ) : (
                <>
                  <div className={currentStep !== 1 ? "hidden" : "block"}>
                    {renderStep1()}
                  </div>
                  <div className={currentStep !== 2 ? "hidden" : "block"}>
                    {renderStep2()}
                  </div>
                  <div className={currentStep !== 3 ? "hidden" : "block"}>
                    {renderStep3()}
                  </div>
                  <div className={currentStep !== 4 ? "hidden" : "block"}>
                    {renderSummary()}
                  </div>
                </>
              )}
            </div>
          </form>
        </div>

        <div className="p-4 sm:p-6 pt-2 sm:pt-3 border-t shrink-0 bg-muted/5">
          {/* Mobile Navigation Buttons */}
          <div className="flex justify-between gap-3 md:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => setOpen(false) : prevStep}
              disabled={isLoading}
              className="flex-1"
            >
              {currentStep === 1 ? (
                t("cancel")
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("previous") || "Previous"}
                </>
              )}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={
                  isLoading ||
                  (adminMode && currentStep === 1 && !selectedManagerId)
                }
                className="flex-1"
              >
                {t("next") || "Next"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                form="add-teacher-form"
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("creating")}
                  </>
                ) : (
                  t("createTeacher")
                )}
              </Button>
            )}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => setOpen(false) : prevStep}
              disabled={isLoading}
            >
              {currentStep === 1 ? (
                t("cancel")
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("previous") || "Previous"}
                </>
              )}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={
                  isLoading ||
                  (adminMode && currentStep === 1 && !selectedManagerId)
                }
              >
                {t("next") || "Next"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleDesktopSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("creating")}
                  </>
                ) : (
                  t("createTeacher")
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
