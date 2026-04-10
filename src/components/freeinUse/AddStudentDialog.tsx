/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAuth } from "@/freelib/context/authContext";
import {
  studentActions,
  studentSubjectActions,
  subjectActions,
  teacherActions,
  teacherSubjectActions,
} from "@/freelib/dexie/freedexieaction";
import { generateObjectId } from "@/freelib/utils/generateObjectId";
import { BookOpen, CheckCircle, Loader2, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";

// ==================== INTERFACES ====================
interface Teacher {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface TeacherSubject {
  id: string;
  teacherId: string;
  percentage: number | null;
  hourlyRate: number | null;
  teacher: Teacher;
}

interface Subject {
  id: string;
  name: string;
  grade: string;
  price: number;
  duration: number | null;
  teacherSubjects: TeacherSubject[];
}

interface EnrolledSubject {
  subjectId: string;
  teacherId: string;
  subjectName: string;
  teacherName: string;
  grade: string;
  price: number;
}

interface AddStudentDialogProps {
  onStudentAdded?: () => void;
  trigger?: React.ReactNode;
}

// ==================== SUB-COMPONENTS ====================

// Step Indicator for mobile
const StepIndicator = ({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) => {
  const icons = [User, BookOpen, CheckCircle];

  return (
    <div className="flex items-center justify-center gap-2 py-3 md:hidden">
      {Array.from({ length: totalSteps }, (_, i) => {
        const Icon = icons[i];
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

// ==================== MAIN COMPONENT ====================
export default function AddStudentDialog({
  onStudentAdded,
  trigger,
}: AddStudentDialogProps) {
  const t = useTranslations("CreateStudentForm");
  const tTable = useTranslations("StudentsTable");
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    grade: "",
  });

  // Enrollment flow state
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>(
    [],
  );

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        grade: "",
      });
      setSelectedGrade("");
      setSelectedSubject(null);
      setSelectedTeacher("");
      setEnrolledSubjects([]);
      setError("");
      setCurrentStep(1);
    }
  }, [open]);

  // Fetch subjects when dialog opens
  useEffect(() => {
    if (open) {
      const fetchSubjects = async () => {
        try {
          const [allSubjects, allTeacherSubjects, allTeachers] =
            await Promise.all([
              subjectActions.getAll(),
              teacherSubjectActions.getAll(),
              teacherActions.getAll(),
            ]);

          const activeSubjects = allSubjects;
          const activeTeacherSubjects = allTeacherSubjects;
          const activeTeachers = allTeachers;

          const subjectsWithTeachers: Subject[] = activeSubjects.map(
            (subject) => {
              const teacherSubjectsForSubject = activeTeacherSubjects
                .filter((ts) => ts.subjectId === subject.id)
                .map((ts) => {
                  const teacher = activeTeachers.find(
                    (t) => t.id === ts.teacherId,
                  );
                  return {
                    id: ts.id,
                    teacherId: ts.teacherId,
                    percentage: ts.percentage ?? null,
                    hourlyRate: ts.hourlyRate ?? null,
                    teacher: teacher
                      ? {
                          id: teacher.id,
                          name: teacher.name,
                          email: teacher.email ?? null,
                          phone: teacher.phone ?? null,
                        }
                      : null,
                  };
                })
                .filter((ts) => ts.teacher !== null) as TeacherSubject[];

              return {
                id: subject.id,
                name: subject.name,
                grade: subject.grade,
                price: subject.price,
                duration: subject.duration ?? null,
                teacherSubjects: teacherSubjectsForSubject,
              };
            },
          );

          setSubjects(subjectsWithTeachers);
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

  const availableGrades = [...new Set(subjects.map((s) => s.grade))].sort();
  const subjectsForGrade = selectedGrade
    ? subjects.filter((s) => s.grade === selectedGrade)
    : [];
  const teachersForSubject =
    selectedSubject?.teacherSubjects?.filter((ts) => ts.teacher) || [];

  const handleAddEnrollment = () => {
    if (!selectedSubject || !selectedTeacher) {
      setError(t("errorsselectSubjectTeacher"));
      return;
    }

    const alreadyEnrolled = enrolledSubjects.some(
      (es) =>
        es.subjectId === selectedSubject.id && es.teacherId === selectedTeacher,
    );
    if (alreadyEnrolled) {
      setError(t("errorsalreadyEnrolled"));
      return;
    }

    const teacher = teachersForSubject.find(
      (ts) => ts.teacherId === selectedTeacher,
    )?.teacher;
    if (!teacher) return;

    setEnrolledSubjects((prev) => [
      ...prev,
      {
        subjectId: selectedSubject.id,
        teacherId: selectedTeacher,
        subjectName: selectedSubject.name,
        teacherName: teacher.name,
        grade: selectedSubject.grade,
        price: selectedSubject.price,
      },
    ]);

    setSelectedGrade("");
    setSelectedSubject(null);
    setSelectedTeacher("");
    setError("");
  };

  const handleRemoveEnrollment = (subjectId: string, teacherId: string) => {
    setEnrolledSubjects((prev) =>
      prev.filter(
        (es) => !(es.subjectId === subjectId && es.teacherId === teacherId),
      ),
    );
  };

  const nextStep = () => {
    const realStep = currentStep;
    if (realStep === 1 && !formData.name.trim()) {
      setError(t("errorsrequiredName") || "Name is required");
      return;
    }
    if (realStep === 2 && enrolledSubjects.length === 0) {
      setError(t("errorsnoSubjects") || "Please add at least one subject");
      return;
    }
    setError("");
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setError("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Unified behavior: If not on final step, act as "Next"
    if (currentStep < totalSteps) {
      nextStep();
      return;
    }

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
      if (!formData.name) {
        throw new Error(t("errorsrequiredName"));
      }
      if (enrolledSubjects.length === 0) {
        throw new Error(t("errorsnoSubjects"));
      }

      // Check if email already exists
      if (formData.email) {
        const existingStudent = await studentActions.getLocalByEmail?.(
          formData.email,
        );
        if (existingStudent) {
          setError("Email already in use");
          setIsLoading(false);
          isSubmittingRef.current = false;
          return;
        }
      }

      // Create student in local DB
      const now = Date.now();
      const studentId = generateObjectId();
      const newStudent = {
        id: studentId,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        parentName: formData.parentName || undefined,
        parentPhone: formData.parentPhone || undefined,
        parentEmail: formData.parentEmail || undefined,
        grade: formData.grade || enrolledSubjects[0]?.grade || undefined,

        createdAt: now,
        updatedAt: now,
      };

      await studentActions.putLocal(newStudent);

      // Create student-subject-teacher associations
      const studentSubjectEntities = enrolledSubjects.map((es) => ({
        id: generateObjectId(),
        studentId: studentId,
        subjectId: es.subjectId,
        teacherId: es.teacherId,

        enrolledAt: now,
        createdAt: now,
        updatedAt: now,
      }));

      await studentSubjectActions.bulkPutLocal(studentSubjectEntities);

      // Server sync removed in local-only mode

      // Close dialog and notify parent
      setOpen(false);
      onStudentAdded?.();
      router.refresh();
    } catch (err: any) {
      setError(err.message || t("errorsgeneric"));
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const totalPrice = enrolledSubjects.reduce(
    (total, es) => total + es.price,
    0,
  );

  // Step 1: Student Info
  const renderStep1 = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {t("studentInfotitle")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm sr-only md:not-sr-only">
            {t("studentInfofullName")}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t("studentInfofullNamePlaceholder") + " *"}
            className="h-10 md:h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm sr-only md:not-sr-only">
            {t("studentInfophone")}
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder={t("studentInfophonePlaceholder")}
            className="h-10 md:h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="parentName"
            className="text-sm sr-only md:not-sr-only"
          >
            {t("parentInfoname")}
          </Label>
          <Input
            id="parentName"
            name="parentName"
            value={formData.parentName}
            onChange={handleInputChange}
            placeholder={t("parentInfonamePlaceholder")}
            className="h-10 md:h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="parentPhone"
            className="text-sm sr-only md:not-sr-only"
          >
            {t("parentInfophone")}
          </Label>
          <Input
            id="parentPhone"
            name="parentPhone"
            value={formData.parentPhone}
            onChange={handleInputChange}
            placeholder={t("parentInfophonePlaceholder")}
            className="h-10 md:h-9"
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Enrollment Flow
  const renderStep2 = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {t("enrollmenttitle")}
      </h3>

      {loadingSubjects ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
          {t("enrollmentnoSubjects")}
        </p>
      ) : (
        <div className="space-y-3">
          {/* Select Grade */}
          <div>
            <span className="text-xs font-medium mb-2 block">
              {t("enrollmentstep1title")}
            </span>
            <div className="flex flex-wrap gap-2">
              {availableGrades.map((grade) => (
                <Badge
                  key={grade}
                  onClick={() => {
                    setSelectedGrade(grade);
                    setSelectedSubject(null);
                    setSelectedTeacher("");
                  }}
                  variant={selectedGrade === grade ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {grade}
                </Badge>
              ))}
            </div>
          </div>

          {/* Select Subject */}
          {selectedGrade && (
            <div>
              <span className="text-xs font-medium mb-2 block">
                {t("enrollmentstep2title")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                {subjectsForGrade.map((subject) => (
                  <Button
                    key={subject.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(subject);
                      setSelectedTeacher("");
                    }}
                    disabled={subject.teacherSubjects.length === 0}
                    variant={
                      selectedSubject?.id === subject.id ? "default" : "outline"
                    }
                    className="h-auto py-2 px-3 justify-start text-left text-xs"
                    size="sm"
                  >
                    <div className="w-full min-w-0">
                      <div className="font-medium truncate">{subject.name}</div>
                      <div className="text-xs opacity-70">
                        MAD {subject.price}
                      </div>
                      {subject.teacherSubjects.length === 0 && (
                        <div className="text-xs text-destructive mt-1">
                          {t("enrollmentnoTeachersAssigned")}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Select Teacher */}
          {selectedSubject && (
            <div>
              <span className="text-xs font-medium mb-2 block">
                {t("enrollmentstep3title", { subject: selectedSubject.name })}
              </span>
              <div className="space-y-2 max-h-[100px] overflow-y-auto">
                {teachersForSubject.map((ts) => (
                  <Button
                    key={ts.id}
                    type="button"
                    onClick={() => setSelectedTeacher(ts.teacherId)}
                    variant={
                      selectedTeacher === ts.teacherId ? "default" : "outline"
                    }
                    className="w-full h-auto py-2 justify-start text-left text-xs"
                    size="sm"
                  >
                    {ts.teacher.name}
                  </Button>
                ))}
              </div>

              {selectedTeacher && (
                <Button
                  type="button"
                  onClick={handleAddEnrollment}
                  className="mt-2 w-full"
                  size="sm"
                >
                  {/* <Plus className="h-3 w-3 mr-1" /> */}
                  {t("enrollmentaddButton")}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Show enrolled subjects in step 2 for mobile */}
      {enrolledSubjects.length > 0 && (
        <div className="space-y-2 pt-3 border-t md:hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {enrolledSubjects.length} {t("enrolledSubjectstitle")}
            </span>
            <span className="text-sm font-bold text-primary">
              MAD {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Step 3: Summary
  const renderStep3 = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {t("enrolledSubjectstitle")}
      </h3>

      {enrolledSubjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
          {t("errorsnoSubjects")}
        </p>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {enrolledSubjects.length} subject(s)
            </span>
            <span className="text-lg font-bold text-primary">
              MAD {totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="space-y-2 max-h-[200px] md:max-h-[100px] overflow-y-auto">
            {enrolledSubjects.map((es, index) => (
              <Card key={index} className="bg-muted/50">
                <CardContent className="py-2 px-3 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium">
                      {es.subjectName}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({es.teacherName})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">MAD {es.price}</span>
                    <Button
                      type="button"
                      onClick={() =>
                        handleRemoveEnrollment(es.subjectId, es.teacherId)
                      }
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button>
            {/* <Plus className="h-4 w-4 mr-2" /> */}
            {tTable("addStudent")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[700px] max-h-[96vh] flex flex-col overflow-hidden p-1">
        <div className="p-4 sm:p-6 pb-2 sm:pb-3 border-b shrink-0">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription className="hidden md:block">
              {tTable("subtitle")}
            </DialogDescription>
          </DialogHeader>

          {/* Mobile Step Indicator */}
          <div className="mt-2">
            <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 sm:pt-3">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form
            id="add-student-form"
            onSubmit={handleSubmit}
            className="space-y-4 pb-4"
          >
            <div className="space-y-4">
              <div className={currentStep !== 1 ? "hidden" : "block"}>
                {renderStep1()}
              </div>
              <div className={currentStep !== 2 ? "hidden" : "block"}>
                {renderStep2()}
              </div>
              <div className={currentStep === totalSteps ? "block" : "hidden"}>
                {renderStep3()}
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 sm:p-6 pt-2 sm:pt-3 border-t shrink-0 bg-muted/5">
          {/* Mobile Navigation Buttons */}
          <div className="flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => setOpen(false) : prevStep}
              disabled={isLoading}
              className="flex-1"
            >
              {currentStep === 1 ? t("actionscancel") : <>{t("previous")}</>}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isLoading}
                className="flex-1"
              >
                {t("next")}
              </Button>
            ) : (
              <Button
                form="add-student-form"
                type="submit"
                disabled={isLoading || enrolledSubjects.length === 0}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("actionscreating")}
                  </>
                ) : (
                  t("actionssubmit")
                )}
              </Button>
            )}
          </div>

          {/* Desktop Action Buttons */}
          {/* <div className="hidden md:flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {t("actionscancel")}
            </Button>
            <Button
              form="add-student-form"
              type="submit"
              disabled={isLoading || enrolledSubjects.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("actionscreating")}
                </>
              ) : (
                t("actionssubmit")
              )}
            </Button>
          </div> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
