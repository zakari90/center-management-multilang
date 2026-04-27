"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

  // Enrolled subjects list
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>(
    [],
  );

  const fetchData = useCallback(async () => {
    if (!open) return;

    setIsFetching(true);
    setError("");
    try {
      if (!user && !authLoading) {
        setError(t("unauthorized"));
        setIsFetching(false);
        return;
      }

      if (!user?.id) {
        setError(t("unauthorized"));
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

      if (!studentData) {
        throw new Error(t("studentInfo"));
      }

      // Get student subjects with related data
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

      // Manager selection for admin
      if (adminMode) {
        const allUsers = await userActions.getAll();
        const activeManagers = allUsers.filter(
          (u) => u.status !== "0" && (u.role === "MANAGER" || u.role === "ADMIN"),
        );
        setManagers(activeManagers.map((m) => ({ id: m.id, name: m.name })));
      }

      // Build subjects with teachers
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

      // Debug logging

      if (!adminMode) {
        const managerCenters = allCenters.filter(
          (c) => (c.managers || []).includes(user.id) && c.status !== "0",
        );
      }

      // Set form data
      setFormData({
        name: studentData.name,
        email: studentData.email || "",
        phone: studentData.phone || "",
        parentName: studentData.parentName || "",
        parentPhone: studentData.parentPhone || "",
        parentEmail: studentData.parentEmail || "",
        grade: studentData.grade || "",
      });

      if (studentData.managerId) {
        setSelectedManagerId(studentData.managerId);
      }

      // Set enrolled subjects
      setEnrolledSubjects(studentSubjectsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : t("somethingWentWrong"));
    } finally {
      setIsFetching(false);
    }
  }, [studentId, open, user, authLoading, t]);

  useEffect(() => {
    if (open && !authLoading) {
      fetchData();
    }
  }, [open, authLoading, fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Get unique grades from subjects
  const availableGrades = [...new Set(subjects.map((s) => s.grade))].sort();

  // Filter subjects by selected grade
  const subjectsForGrade = selectedGrade
    ? subjects.filter((s) => s.grade === selectedGrade)
    : [];

  // Get teachers for selected subject
  const teachersForSubject =
    selectedSubject?.teacherSubjects?.filter((ts) => ts.teacher) || [];

  const handleAddEnrollment = () => {
    if (!selectedSubject || !selectedTeacher) {
      setError(t("fetchSubjects"));
      return;
    }

    // Check if already enrolled in this subject with this teacher
    const alreadyEnrolled = enrolledSubjects.some(
      (es) =>
        es.subjectId === selectedSubject.id && es.teacherId === selectedTeacher,
    );

    if (alreadyEnrolled) {
      setError(t("alreadyEnrolled"));
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

    // Reset enrollment flow
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!user || !user.id) {
        throw new Error(t("unauthorized"));
      }

      // Validate and sanitize data
      const validatedData = StudentFormSchema.parse(formData);

      if (enrolledSubjects.length === 0) {
        throw new Error(t("atLeastOneSubject"));
      }

      // Get existing student
      const existingStudent = await studentActions.getLocal(studentId);
      if (!existingStudent) {
        throw new Error(t("studentInfo"));
      }

      // Update student in local DB
      const now = Date.now();
      const updatedStudent = {
        ...existingStudent,
        name: validatedData.name,
        email: validatedData.email || undefined,
        phone: validatedData.phone || undefined,
        parentName: validatedData.parentName || undefined,
        parentPhone: validatedData.parentPhone || undefined,
        parentEmail: validatedData.parentEmail || undefined,
        grade: validatedData.grade || undefined,
        managerId: adminMode
          ? selectedManagerId || existingStudent.managerId
          : existingStudent.managerId,
        status: "w" as const,
        updatedAt: now,
      };

      await studentActions.putLocal(updatedStudent);

      // ... existing code for enrollments ...
      const existingEnrollments = await studentSubjectActions.getAll();
      const currentEnrollments = existingEnrollments.filter(
        (ss) => ss.studentId === studentId && ss.status !== "0",
      );

      // Remove enrollments that are no longer in the list
      const enrollmentsToRemove = currentEnrollments.filter(
        (ce) =>
          !enrolledSubjects.some(
            (es) =>
              es.subjectId === ce.subjectId && es.teacherId === ce.teacherId,
          ),
      );

      for (const enrollment of enrollmentsToRemove) {
        await studentSubjectActions.markForDelete(enrollment.id);
      }

      // Add new enrollments
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
        const enrollmentId = generateObjectId();
        await studentSubjectActions.putLocal({
          id: enrollmentId,
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

      // Close dialog and refresh
      setOpen(false);
      onStudentUpdated?.();
    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        setError(err.issues.map((i) => i.message).join(", "));
      } else {
        setError(err instanceof Error ? err.message : t("somethingWentWrong"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total price
  const totalPrice = enrolledSubjects.reduce(
    (total, es) => total + es.price,
    0,
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
      <DialogContent className="w-[95vw] max-w-[700px] max-h-[96vh] overflow-hidden flex flex-col p-0">
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
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 sm:pt-3">
          {isFetching ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <form
              id="edit-student-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Student Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t("studentInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-sm">
                      {t("fullName")}
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="grade" className="text-sm">
                      {t("grade")}
                    </Label>
                    <Input
                      type="text"
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                  {adminMode && (
                    <div className="space-y-1">
                      <Label htmlFor="managerId" className="text-sm">
                        Manager
                      </Label>
                      <Select
                        value={selectedManagerId}
                        onValueChange={setSelectedManagerId}
                      >
                        <SelectTrigger className="h-9">
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
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-sm">
                      {t("email")}
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-sm">
                      {t("phone")}
                    </Label>
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Parent Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t("parentInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="parentName" className="text-sm">
                      {t("parentName")}
                    </Label>
                    <Input
                      type="text"
                      id="parentName"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="parentPhone" className="text-sm">
                      {t("parentPhone")}
                    </Label>
                    <Input
                      type="tel"
                      id="parentPhone"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="parentEmail" className="text-sm">
                      {t("parentEmail")}
                    </Label>
                    <Input
                      type="email"
                      id="parentEmail"
                      name="parentEmail"
                      value={formData.parentEmail}
                      onChange={handleInputChange}
                      className="h-9"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Current Enrollments */}
              <Card>
                <CardHeader className="pb-3 flex flex-row justify-between items-center">
                  <CardTitle className="text-base">
                    {t("currentEnrollments")}
                  </CardTitle>
                  <span className="text-sm font-semibold text-green-600">
                    MAD {totalPrice.toFixed(2)}
                  </span>
                </CardHeader>
                <CardContent className="space-y-2">
                  {enrolledSubjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("atLeastOneSubject")}
                    </p>
                  ) : (
                    enrolledSubjects.map((es, index) => (
                      <div
                        key={`${es.subjectId}-${es.teacherId}-${index}`}
                        className="border p-2 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {es.subjectName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {es.teacherName} • {es.grade}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600">
                            MAD {es.price}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveEnrollment(es.subjectId, es.teacherId)
                            }
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Add New Subject */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {t("addNewSubject")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Grade Selection */}
                  <div>
                    <span className="text-sm font-medium mb-2 block">
                      {t("step1SelectGrade")}
                    </span>
                    {availableGrades.length === 0 ? (
                      <Alert>
                        <AlertDescription>
                          {t("noSubjectsAvailable") ||
                            "No subjects available. Please add subjects to your center first."}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableGrades.map((grade) => (
                          <Button
                            key={grade}
                            type="button"
                            variant={
                              selectedGrade === grade ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => {
                              setSelectedGrade(grade);
                              setSelectedSubject(null);
                              setSelectedTeacher("");
                            }}
                          >
                            {grade}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subject Selection */}
                  {selectedGrade && (
                    <div>
                      <span className="text-sm font-medium mb-2 block">
                        {t("step2SelectSubject")}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {subjectsForGrade.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {t("noSubjectsForGrade")}
                          </p>
                        ) : (
                          subjectsForGrade.map((subject) => (
                            <Button
                              key={subject.id}
                              type="button"
                              variant={
                                selectedSubject?.id === subject.id
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedSubject(subject);
                                setSelectedTeacher("");
                              }}
                            >
                              {subject.name} (MAD {subject.price})
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Teacher Selection */}
                  {selectedSubject && (
                    <div>
                      <span className="text-sm font-medium mb-2 block">
                        {t("step3SelectTeacher")} {selectedSubject.name}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {teachersForSubject.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {t("noTeachersAvailable")}
                          </p>
                        ) : (
                          teachersForSubject.map((ts) => (
                            <Button
                              key={ts.teacherId}
                              type="button"
                              variant={
                                selectedTeacher === ts.teacherId
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setSelectedTeacher(ts.teacherId)}
                            >
                              {ts.teacher.name}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Add Button */}
                  {selectedTeacher && (
                    <Button
                      type="button"
                      onClick={handleAddEnrollment}
                      className="w-full"
                      size="sm"
                    >
                      {t("addEnrollment")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </form>
          )}
        </div>
        <div className="p-4 sm:p-6 pt-2 sm:pt-3 border-t shrink-0 bg-muted/5">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              form="edit-student-form"
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
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
