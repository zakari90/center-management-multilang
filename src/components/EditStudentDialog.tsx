"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Loader2, X, User, BookOpen, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  studentActions,
  studentSubjectActions,
  subjectActions,
  teacherSubjectActions,
  teacherActions,
  centerActions,
  userActions,
} from "@/lib/dexie/dexieActions";
import { useAuth } from "@/context/authContext";
import { StudentFormSchema } from "@/lib/validations/schemas";
import { z } from "zod";

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
interface EditStudentDialogProps {
  studentId: string;
  trigger?: React.ReactNode;
  onStudentUpdated?: () => void;
  adminMode?: boolean;
}

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
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all ${isActive ? "bg-primary text-primary-foreground scale-110" : isCompleted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
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

export default function EditStudentDialog({
  studentId,
  trigger,
  onStudentUpdated,
  adminMode = false,
}: EditStudentDialogProps) {
  const t = useTranslations("editStudent");
  const { user, isLoading: authLoading } = useAuth();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    grade: "",
  });

  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>(
    [],
  );

  const fetchData = useCallback(async () => {
    if (!open) return;
    setIsFetching(true);
    setError("");
    try {
      if (!user && !authLoading) {
        setError(t("unauthorized") || "Unauthorized");
        setIsFetching(false);
        return;
      }
      if (!user?.id) {
        setError(t("unauthorized") || "Unauthorized");
        setIsFetching(false);
        return;
      }

      const [
        allStudents,
        allStudentSubjects,
        allSubjects,
        allTeacherSubjects,
        allTeachers,
        allCenters,
      ] = await Promise.all([
        studentActions.getAll(),
        studentSubjectActions.getAll(),
        subjectActions.getAll(),
        teacherSubjectActions.getAll(),
        teacherActions.getAll(),
        centerActions.getAll(),
      ]);

      const studentData = allStudents.find(
        (s) => s.id === studentId && s.status !== "0",
      );
      if (!studentData)
        throw new Error(t("studentInfo") || "Student not found");

      const studentSubjectsData = allStudentSubjects
        .filter((ss) => ss.studentId === studentId && ss.status !== "0")
        .map((ss) => {
          const subject = allSubjects.find(
            (s) => s.id === ss.subjectId && s.status !== "0",
          );
          const teacher = allTeachers.find(
            (t) => t.id === ss.teacherId && t.status !== "0",
          );
          if (!subject || !teacher) return null;
          return {
            subjectId: subject.id,
            teacherId: teacher.id,
            subjectName: subject.name,
            teacherName: teacher.name,
            grade: subject.grade,
            price: subject.price,
          };
        })
        .filter((ss) => ss !== null) as EnrolledSubject[];

      if (adminMode) {
        const allUsers = await userActions.getAll();
        const activeManagers = allUsers.filter(
          (u) =>
            u.status !== "0" && (u.role === "MANAGER" || u.role === "ADMIN"),
        );
        setManagers(activeManagers.map((m) => ({ id: m.id, name: m.name })));
      }

      let filteredSubjects: typeof allSubjects = [];
      if (adminMode) {
        filteredSubjects = allSubjects.filter((s) => s.status !== "0");
      } else {
        const managerCenters = allCenters.filter(
          (c) => (c.managers || []).includes(user.id) && c.status !== "0",
        );
        const managerCenterIds = managerCenters.map((c) => c.id);
        filteredSubjects = allSubjects.filter(
          (s) => managerCenterIds.includes(s.centerId) && s.status !== "0",
        );
      }

      const subjectsWithTeachers: Subject[] = filteredSubjects.map(
        (subject) => {
          const teacherSubjectsForSubject = allTeacherSubjects
            .filter((ts) => ts.subjectId === subject.id && ts.status !== "0")
            .map((ts) => {
              const teacher = allTeachers.find(
                (t) => t.id === ts.teacherId && t.status !== "0",
              );
              return teacher
                ? {
                    id: ts.id,
                    teacherId: ts.teacherId,
                    percentage: ts.percentage ?? null,
                    hourlyRate: ts.hourlyRate ?? null,
                    teacher: {
                      id: teacher.id,
                      name: teacher.name,
                      email: teacher.email ?? null,
                      phone: teacher.phone ?? null,
                    },
                  }
                : null;
            })
            .filter((ts) => ts !== null) as TeacherSubject[];
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
      setFormData({
        name: studentData.name,
        email: studentData.email || "",
        phone: studentData.phone || "",
        parentName: studentData.parentName || "",
        parentPhone: studentData.parentPhone || "",
        parentEmail: studentData.parentEmail || "",
        grade: studentData.grade || "",
      });
      if (studentData.managerId) setSelectedManagerId(studentData.managerId);
      setEnrolledSubjects(studentSubjectsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : t("somethingWentWrong"));
    } finally {
      setIsFetching(false);
    }
  }, [studentId, open, user, authLoading, t, adminMode]);

  useEffect(() => {
    if (open && !authLoading) fetchData();
    else if (!open) setCurrentStep(1);
  }, [open, authLoading, fetchData]);

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
      setError(t("fetchSubjects") || "Please select a subject and teacher");
      return;
    }
    const alreadyEnrolled = enrolledSubjects.some(
      (es) =>
        es.subjectId === selectedSubject.id && es.teacherId === selectedTeacher,
    );
    if (alreadyEnrolled) {
      setError(t("alreadyEnrolled") || "Already enrolled");
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
    if (currentStep === 1 && !formData.name.trim()) {
      setError(t("fullName") + " is required");
      return;
    }
    if (currentStep === 2 && enrolledSubjects.length === 0) {
      setError(t("atLeastOneSubject") || "Please add at least one subject");
      return;
    }
    setError("");
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError("");
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < totalSteps) {
      nextStep();
      return;
    }
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setError("");

    try {
      if (!user || !user.id) throw new Error(t("unauthorized"));
      const validatedData = StudentFormSchema.parse(formData);
      if (enrolledSubjects.length === 0)
        throw new Error(t("atLeastOneSubject"));
      const existingStudent = await studentActions.getLocal(studentId);
      if (!existingStudent) throw new Error(t("studentInfo"));

      const now = Date.now();
      const updatedStudent = {
        ...existingStudent,
        name: validatedData.name,
        email: validatedData.email || undefined,
        phone: validatedData.phone || undefined,
        parentName: validatedData.parentName || undefined,
        parentPhone: validatedData.parentPhone || undefined,
        parentEmail: validatedData.parentEmail || undefined,
        grade: validatedData.grade || enrolledSubjects[0]?.grade || undefined,
        managerId: adminMode
          ? selectedManagerId || existingStudent.managerId
          : existingStudent.managerId,
        status: "w" as const,
        updatedAt: now,
      };

      await studentActions.putLocal(updatedStudent);

      const existingEnrollments = await studentSubjectActions.getAll();
      const currentEnrollments = existingEnrollments.filter(
        (ss) => ss.studentId === studentId && ss.status !== "0",
      );

      const enrollmentsToRemove = currentEnrollments.filter(
        (ce) =>
          !enrolledSubjects.some(
            (es) =>
              es.subjectId === ce.subjectId && es.teacherId === ce.teacherId,
          ),
      );
      for (const enrollment of enrollmentsToRemove)
        await studentSubjectActions.markForDelete(enrollment.id);

      const enrollmentsToAdd = enrolledSubjects.filter(
        (es) =>
          !currentEnrollments.some(
            (ce) =>
              ce.subjectId === es.subjectId && ce.teacherId === es.teacherId,
          ),
      );
      for (const enrollment of enrollmentsToAdd) {
        const { generateObjectId } =
          await import("@/lib/utils/generateObjectId");
        await studentSubjectActions.putLocal({
          id: generateObjectId(),
          enrolledAt: now,
          studentId: studentId,
          subjectId: enrollment.subjectId,
          teacherId: enrollment.teacherId,
          managerId: updatedStudent.managerId,
          status: "w" as const,
          createdAt: now,
          updatedAt: now,
        });
      }
      setOpen(false);
      onStudentUpdated?.();
    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError)
        setError(err.issues.map((i) => i.message).join(", "));
      else
        setError(err instanceof Error ? err.message : t("somethingWentWrong"));
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const totalPrice = enrolledSubjects.reduce(
    (total, es) => total + es.price,
    0,
  );

  const renderStep1 = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {t("studentInfo") || "Student Information"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm sr-only md:not-sr-only">
            {t("fullName")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t("fullName") + " *"}
            className="h-10 md:h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="grade" className="text-sm sr-only md:not-sr-only">
            {t("grade")}
          </Label>
          <Select
            value={formData.grade}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, grade: value }))
            }
          >
            <SelectTrigger className="h-10 md:h-9">
              <SelectValue placeholder={t("grade") || "Select Grade"} />
            </SelectTrigger>
            <SelectContent>
              {availableGrades.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
              {!availableGrades.includes(formData.grade) && formData.grade && (
                <SelectItem value={formData.grade}>{formData.grade}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        {adminMode && (
          <div className="space-y-1.5">
            <Label
              htmlFor="managerId"
              className="text-sm sr-only md:not-sr-only"
            >
              Manager
            </Label>
            <Select
              value={selectedManagerId}
              onValueChange={setSelectedManagerId}
            >
              <SelectTrigger className="h-10 md:h-9">
                <SelectValue placeholder="Select Manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
          <Label htmlFor="email" className="text-sm sr-only md:not-sr-only">
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t("email")}
            className="h-10 md:h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="parentName"
            className="text-sm sr-only md:not-sr-only"
          >
            {t("parentName")}
          </Label>
          <Input
            id="parentName"
            name="parentName"
            value={formData.parentName}
            onChange={handleInputChange}
            placeholder={t("parentName")}
            className="h-10 md:h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="parentPhone"
            className="text-sm sr-only md:not-sr-only"
          >
            {t("parentPhone")}
          </Label>
          <Input
            id="parentPhone"
            name="parentPhone"
            value={formData.parentPhone}
            onChange={handleInputChange}
            placeholder={t("parentPhone")}
            className="h-10 md:h-9"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {t("addNewSubject") || "Add New Subject"}
      </h3>
      {subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
          {t("noSubjectsAvailable") || "No subjects available"}
        </p>
      ) : (
        <div className="space-y-3">
          <div>
            <span className="text-xs font-medium mb-2 block">
              {t("step1SelectGrade") || "Select Grade"}
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
          {selectedGrade && (
            <div>
              <span className="text-xs font-medium mb-2 block">
                {t("step2SelectSubject") || "Select Subject"}
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
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
          {selectedSubject && (
            <div>
              <span className="text-xs font-medium mb-2 block">
                {t("step3SelectTeacher") || "Select Teacher"}{" "}
                {selectedSubject.name}
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
                  {t("addEnrollment") || "Add Enrollment"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {enrolledSubjects.length > 0 && (
        <div className="space-y-2 pt-3 border-t md:hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {enrolledSubjects.length}{" "}
              {t("currentEnrollments") || "Current Enrollments"}
            </span>
            <span className="text-sm font-bold text-primary">
              MAD {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {t("currentEnrollments") || "Current Enrollments"}
      </h3>
      {enrolledSubjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
          {t("atLeastOneSubject") || "Please add at least one subject"}
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
              <Card
                key={`${es.subjectId}-${es.teacherId}-${index}`}
                className="bg-muted/50"
              >
                <CardContent className="py-2 px-3 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium">
                      {es.subjectName}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({es.teacherName} • {es.grade})
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
        {trigger || (
          <Button variant="ghost" size="sm" title={t("title")}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[700px] max-h-[96vh] flex flex-col overflow-hidden p-1">
        <div className="p-4 sm:p-6 pb-2 sm:pb-3 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {formData.name && (
                <>
                  <Avatar>
                    <AvatarFallback className="bg-green-100 text-green-600">
                      {formData.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {t("title")}: {formData.name}
                  </span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="hidden md:block">
              {t("title")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 sm:pt-3">
          {isFetching ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form
                id="edit-student-form"
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
                  <div
                    className={currentStep === totalSteps ? "block" : "hidden"}
                  >
                    {renderStep3()}
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
        <div className="p-4 sm:p-6 pt-2 sm:pt-3 border-t shrink-0 bg-muted/5">
          <div className="flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => setOpen(false) : prevStep}
              disabled={isLoading || isFetching}
              className="flex-1"
            >
              {currentStep === 1 ? t("cancel") || "Cancel" : "Previous"}
            </Button>
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isLoading || isFetching}
                className="flex-1"
              >
                Next
              </Button>
            ) : (
              <Button
                form="edit-student-form"
                type="submit"
                disabled={
                  isLoading || isFetching || enrolledSubjects.length === 0
                }
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("saving") || "Saving..."}
                  </>
                ) : (
                  t("saveChanges") || "Save Changes"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
