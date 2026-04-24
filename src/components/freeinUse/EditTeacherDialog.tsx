/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  teacherActions,
  teacherSubjectActions,
  subjectActions,
} from "@/freelib/dexie/freedexieaction";
import { generateObjectId } from "@/freelib/utils/generateObjectId";
import { useAuth } from "@/freelib/context/freeauthContext";
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

// ==================== CONSTANTS ====================


// ==================== INTERFACES ====================


interface Subject {
  id: string;
  name: string;
  grade: string;
  price: number;
}

interface TeacherSubjectForm {
  subjectId: string;
  percentage: number;
}

interface EditTeacherDialogProps {
  teacherId: string;
  onTeacherUpdated?: () => void;
  trigger?: React.ReactNode;
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

  const selectedSubject = subjects.find(
    (s) => s.id === teacherSubject.subjectId,
  );

  const calculateEstimatedEarnings = () => {
    if (!selectedSubject) return "MAD 0.00";

    if (teacherSubject.percentage) {
      const earnings =
        (selectedSubject.price * teacherSubject.percentage) / 100;
      return `MAD ${earnings.toFixed(2)}`;
    }

    return "MAD 0.00";
  };

  return (
    <Card className="bg-muted/50 overflow-hidden mb-2">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            <Label
              htmlFor={`subject-${index}`}
              className="text-[10px] uppercase text-muted-foreground"
            >
              {t("subject")}
            </Label>
            <Select
              value={teacherSubject.subjectId}
              onValueChange={(value) => onUpdate(index, "subjectId", value)}
            >
              <SelectTrigger
                id={`subject-${index}`}
                className="w-full h-9 text-sm"
              >
                <SelectValue placeholder={t("selectSubject")} />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5}>
                {availableSubjects.map((subject) => (
                  <SelectItem
                    key={subject.id}
                    value={subject.id}
                    className="text-sm"
                  >
                    <span className="truncate max-w-[250px] inline-block">
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
            className="h-8 w-8 mt-6 text-destructive hover:text-destructive shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">
              {t("percentage")}
            </Label>
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
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">
              {t("estEarnings")}
            </Label>
            <div className="h-9 flex items-center justify-center bg-background rounded-md border px-2">
              <p className="text-xs font-bold text-primary truncate">
                {calculateEstimatedEarnings()}
              </p>
            </div>
          </div>
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
}: EditTeacherDialogProps) {
  const t = useTranslations("EditTeacherPage");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });



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
          const teacherData = allTeachers.find((t) => t.id === teacherId);
          if (!teacherData) {
            throw new Error(t("teacherNotFound"));
          }

          // Get teacher subjects
          const teacherSubjectsData = allTeacherSubjects
            .filter((ts) => ts.teacherId === teacherId)
            .map((ts) => {
              const subject = allSubjects.find((s) => s.id === ts.subjectId);
              if (!subject) return null;
              return {
                subjectId: ts.subjectId,
                percentage: ts.percentage || 0,
              };
            })
            .filter((ts) => ts !== null) as TeacherSubjectForm[];

          // Get all subjects for dropdown
          const activeSubjects = allSubjects.map((s) => ({
            id: s.id,
            name: s.name,
            grade: s.grade,
            price: s.price,
          }));



          // Set state
          setSubjects(activeSubjects);
          setFormData({
            name: teacherData.name,
            email: teacherData.email || "",
            phone: teacherData.phone || "",
            address: teacherData.address || "",
          });
          setTeacherSubjects(teacherSubjectsData);
        } catch (err) {
          console.error("Failed to fetch teacher:", err);
          setError(err instanceof Error ? err.message : t("errorFetchData"));
        } finally {
          setIsFetching(false);
        }
      };
      fetchData();
    }
  }, [open, teacherId, user, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };



  const addSubject = () => {
    setTeacherSubjects((prev) => [
      ...prev,
      {
        subjectId: "",
        percentage: 0,
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
        if (!ts.percentage || ts.percentage <= 0 || ts.percentage > 100) {
          throw new Error(t("errorPercentage"));
        }
      }

      // Check for email uniqueness if changed
      if (formData.email) {
        const existingWithEmail = await teacherActions.getLocalByEmail?.(
          formData.email,
        );
        if (existingWithEmail && existingWithEmail.id !== teacherId) {
          throw new Error(t("emailAlreadyInUse") || "Email already in use");
        }
      }

      // Get existing teacher
      const existingTeacher = await teacherActions.getLocal(teacherId);
      if (!existingTeacher) {
        throw new Error(t("teacherNotFound"));
      }

      // Update teacher in local DB
      const now = Date.now();
      const updatedTeacher = {
        ...existingTeacher,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        updatedAt: now,
      };

      await teacherActions.putLocal(updatedTeacher);

      // Update teacher subjects
      const existingTeacherSubjects = await teacherSubjectActions.getAll();
      const currentTeacherSubjects = existingTeacherSubjects.filter(
        (ts) => ts.teacherId === teacherId,
      );

      // Remove subjects no longer in list
      const subjectsToRemove = currentTeacherSubjects.filter(
        (cts) => !validSubjects.some((vs) => vs.subjectId === cts.subjectId),
      );
      for (const ts of subjectsToRemove) {
        await teacherSubjectActions.deleteLocal(ts.id);
      }

      // Update or add subjects
      for (const vs of validSubjects) {
        const existing = currentTeacherSubjects.find(
          (cts) => cts.subjectId === vs.subjectId,
        );

        if (existing) {
          await teacherSubjectActions.putLocal({
            ...existing,
            percentage: vs.percentage,
            updatedAt: now,
          });
        } else {
          const teacherSubjectId = generateObjectId();
          await teacherSubjectActions.putLocal({
            id: teacherSubjectId,
            teacherId: teacherId,
            subjectId: vs.subjectId,
            percentage: vs.percentage,
            assignedAt: now,
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
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[96vh] flex flex-col overflow-hidden p-0">
        <div className="p-4 sm:p-6 pb-2 sm:pb-3 border-b shrink-0">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("subtitle")}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 sm:pt-3">
          {isFetching ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <form
              id="edit-teacher-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
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
                  <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
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

              </div>
            </form>
          )}
        </div>
        <div className="p-4 sm:p-6 pt-2 sm:pt-3 border-t shrink-0 bg-muted/5">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button
              form="edit-teacher-form"
              type="submit"
              disabled={isLoading || isFetching}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("saveChanges")}...
                </>
              ) : (
                t("saveChanges")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
