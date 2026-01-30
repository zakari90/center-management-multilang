/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/authContext";
import { ReceiptType } from "@/lib/dexie/dbSchema";
import {
  receiptActions,
  studentSubjectActions,
  subjectActions,
  teacherActions,
  teacherSubjectActions,
} from "@/lib/dexie/dexieActions";
import ServerActionReceipts from "@/lib/dexie/receiptServerAction";
import { generateObjectId } from "@/lib/utils/generateObjectId";
import { isOnline } from "@/lib/utils/network";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  User,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface SubjectStats {
  subjectId: string;
  subjectName: string;
  grade: string;
  price: number;
  percentage: number | null;
  hourlyRate: number | null;
  enrolledStudents: number;
  calculatedAmount: number;
}

interface Teacher {
  id: string;
  name: string;
  email: string | null;
}

interface TeacherPaymentData {
  teacher: Teacher;
  subjects: SubjectStats[];
  totalAmount: number;
}

interface AddTeacherPaymentDialogProps {
  onPaymentCreated?: () => void;
  trigger?: React.ReactNode;
}

// Step Indicator for mobile
const StepIndicator = ({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) => {
  const icons = [User, BookOpen, CreditCard];

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
                  ? "bg-orange-600 text-white scale-110"
                  : isCompleted
                    ? "bg-orange-200 text-orange-600"
                    : "bg-muted text-muted-foreground"
              }
            `}
            >
              <Icon className="h-4 w-4" />
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 ${isCompleted ? "bg-orange-600" : "bg-muted"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function AddTeacherPaymentDialog({
  onPaymentCreated,
  trigger,
}: AddTeacherPaymentDialogProps) {
  const t = useTranslations("TeacherPayment");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingCalculation, setLoadingCalculation] = useState(false);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [paymentData, setPaymentData] = useState<TeacherPaymentData | null>(
    null,
  );
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const isSubmittingRef = useRef(false);

  const [formData, setFormData] = useState({
    teacherId: "",
    paymentMethod: "BANK_TRANSFER",
    description: "",
    date: new Date().toISOString().split("T")[0],
    selectedSubjects: [] as string[],
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        teacherId: "",
        paymentMethod: "BANK_TRANSFER",
        description: "",
        date: new Date().toISOString().split("T")[0],
        selectedSubjects: [],
      });
      setPaymentData(null);
      setError("");
      setCurrentStep(1);
    }
  }, [open]);

  useEffect(() => {
    if (open && user) {
      fetchTeachers();
    }
  }, [open, user]);

  useEffect(() => {
    if (formData.teacherId) {
      calculateTeacherPayment();
    }
  }, [formData.teacherId]);

  const fetchTeachers = async () => {
    try {
      if (!user) {
        setError("Unauthorized: Please log in again");
        setLoadingTeachers(false);
        return;
      }
      const allTeachers = await teacherActions.getAll();
      const activeTeachers = allTeachers
        .filter((t) => t.status !== "0")
        .map((t) => ({ id: t.id, name: t.name, email: t.email ?? null }));
      setTeachers(activeTeachers);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
      setError(t("errorloadTeachers"));
    } finally {
      setLoadingTeachers(false);
    }
  };

  const calculateTeacherPayment = async () => {
    setLoadingCalculation(true);
    try {
      if (!user) {
        setError("Unauthorized: Please log in again");
        setLoadingCalculation(false);
        return;
      }
      const [allTeacherSubjects, allStudentSubjects, allSubjects, allTeachers] =
        await Promise.all([
          teacherSubjectActions.getAll(),
          studentSubjectActions.getAll(),
          subjectActions.getAll(),
          teacherActions.getAll(),
        ]);
      const selectedTeacher = allTeachers.find(
        (t) => t.id === formData.teacherId && t.status !== "0",
      );
      if (!selectedTeacher) throw new Error("Teacher not found");

      const teacherSubjects = allTeacherSubjects.filter(
        (ts) => ts.teacherId === formData.teacherId && ts.status !== "0",
      );
      const subjectsStats: SubjectStats[] = teacherSubjects
        .map((ts) => {
          const subject = allSubjects.find(
            (s) => s.id === ts.subjectId && s.status !== "0",
          );
          if (!subject) return null;
          const enrolledStudents = allStudentSubjects.filter(
            (ss) =>
              ss.subjectId === ts.subjectId &&
              ss.teacherId === formData.teacherId &&
              ss.status !== "0",
          ).length;
          let calculatedAmount = 0;
          if (ts.percentage)
            calculatedAmount =
              ((subject.price * ts.percentage) / 100) * enrolledStudents;
          else if (ts.hourlyRate)
            calculatedAmount = ts.hourlyRate * enrolledStudents;
          return {
            subjectId: ts.subjectId,
            subjectName: subject.name,
            grade: subject.grade,
            price: subject.price,
            percentage: ts.percentage ?? null,
            hourlyRate: ts.hourlyRate ?? null,
            enrolledStudents,
            calculatedAmount,
          };
        })
        .filter((s) => s !== null) as SubjectStats[];
      const totalAmount = subjectsStats.reduce(
        (sum, s) => sum + s.calculatedAmount,
        0,
      );
      setPaymentData({
        teacher: {
          id: selectedTeacher.id,
          name: selectedTeacher.name,
          email: selectedTeacher.email ?? null,
        },
        subjects: subjectsStats,
        totalAmount,
      });
      setFormData((prev) => ({
        ...prev,
        selectedSubjects: subjectsStats.map((s) => s.subjectId),
      }));
    } catch (err) {
      console.error("Failed to calculate payment:", err);
      setError(t("errorcalcPayment"));
    } finally {
      setLoadingCalculation(false);
    }
  };

  const calculateTotalAmount = () => {
    if (!paymentData) return 0;
    return paymentData.subjects
      .filter((s) => formData.selectedSubjects.includes(s.subjectId))
      .reduce((total, s) => total + s.calculatedAmount, 0);
  };

  const totalAmount = calculateTotalAmount();

  const handleSubjectToggle = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter((id) => id !== subjectId)
        : [...prev.selectedSubjects, subjectId],
    }));
  };

  const handleSelectAllSubjects = () => {
    if (!paymentData) return;
    setFormData((prev) => ({
      ...prev,
      selectedSubjects: paymentData.subjects.map((s) => s.subjectId),
    }));
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.teacherId) {
      setError(t("teacherplaceholder") || "Please select a teacher");
      return;
    }
    if (currentStep === 2 && formData.selectedSubjects.length === 0) {
      setError("Please select at least one subject");
      return;
    }
    setError("");
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError("");
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Unified behavior: If not on final step, act as "Next"
    if (currentStep < totalSteps) {
      nextStep();
      return;
    }

    // Immediate guard - prevents double submission
    if (isSubmittingRef.current || isLoading) {
      console.warn("Teacher payment submission already in progress");
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    setError("");
    try {
      if (!user) throw new Error("Unauthorized: Please log in again");
      if (!formData.teacherId) throw new Error("Please select a teacher");
      if (formData.selectedSubjects.length === 0)
        throw new Error("Please select at least one subject");
      if (!paymentData) throw new Error("Payment data not calculated");

      const selectedSubjectsData = paymentData.subjects.filter((s) =>
        formData.selectedSubjects.includes(s.subjectId),
      );
      const total = selectedSubjectsData.reduce(
        (sum, s) => sum + s.calculatedAmount,
        0,
      );
      const subjectDetails = selectedSubjectsData.map(
        (s) =>
          `${s.subjectName} (${s.enrolledStudents} students): MAD ${s.calculatedAmount.toFixed(2)}`,
      );
      const finalDescription =
        formData.description || `Payment for: ${subjectDetails.join(", ")}`;
      const now = Date.now();
      const receiptId = generateObjectId();
      const receiptDate = formData.date
        ? new Date(formData.date).getTime()
        : now;

      const newReceipt = {
        id: receiptId,
        receiptNumber: `RCP-${now}`,
        amount: total,
        type: ReceiptType.TEACHER_PAYMENT,
        paymentMethod: formData.paymentMethod || undefined,
        description: finalDescription,
        date: receiptDate,
        teacherId: formData.teacherId,
        managerId: user.id,
        status: "w" as const,
        createdAt: now,
        updatedAt: now,
      };
      await receiptActions.putLocal(newReceipt);
      if (isOnline()) {
        try {
          const result = await ServerActionReceipts.SaveToServer(
            newReceipt as any,
          );
          if (result) await receiptActions.markSynced(receiptId);
        } catch (syncError) {
          console.error("Receipt immediate sync failed:", syncError);
        }
      }
      setOpen(false);
      onPaymentCreated?.();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(t("errorgeneric"));
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {t("teacherlabel")}
      </h3>
      {loadingTeachers ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="teacherId" className="sr-only">
            {t("teacherlabel")}
          </Label>
          <Select
            value={formData.teacherId}
            onValueChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                teacherId: value,
                selectedSubjects: [],
              }));
              setPaymentData(null);
            }}
          >
            <SelectTrigger className="h-10 md:h-9">
              <SelectValue placeholder={t("teacherplaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {paymentData && (
        <p className="text-sm text-muted-foreground">
          {t("teacheremail")}:{" "}
          {paymentData.teacher.email || t("teachernoEmail")}
        </p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      {loadingCalculation && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      {paymentData && !loadingCalculation && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
              {t("subjectsselectLabel")}
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllSubjects}
            >
              {t("subjectsselectAll")}
            </Button>
          </div>
          {paymentData.subjects.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t("subjectsnone")}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3 max-h-[300px] md:max-h-[250px] overflow-y-auto">
              {paymentData.subjects.map((subject) => (
                <Card
                  key={subject.subjectId}
                  className={`cursor-pointer transition-colors ${formData.selectedSubjects.includes(subject.subjectId) ? "border-orange-500 bg-orange-50" : "hover:border-gray-400"}`}
                  onClick={() => handleSubjectToggle(subject.subjectId)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={formData.selectedSubjects.includes(
                            subject.subjectId,
                          )}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-gray-300 mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            {subject.subjectName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {subject.grade}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-xs flex items-center gap-1 mt-1 w-fit"
                          >
                            <Users className="h-3 w-3" />
                            {subject.enrolledStudents}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-orange-600">
                        MAD {subject.calculatedAmount.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {formData.selectedSubjects.length > 0 && (
            <div className="flex justify-between items-center pt-2 border-t md:hidden">
              <span className="text-sm text-muted-foreground">
                {formData.selectedSubjects.length} subject(s)
              </span>
              <span className="text-lg font-bold text-orange-600">
                MAD {totalAmount.toFixed(2)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground hidden md:block">
        {t("paymentmethod")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="paymentMethod"
            className="text-sm sr-only md:not-sr-only"
          >
            {t("paymentmethod")}
          </Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, paymentMethod: value }))
            }
          >
            <SelectTrigger className="h-10 md:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BANK_TRANSFER">
                {t("paymentmethodbank")}
              </SelectItem>
              <SelectItem value="CASH">{t("paymentmethodcash")}</SelectItem>
              <SelectItem value="CHECK">{t("paymentmethodcheck")}</SelectItem>
              <SelectItem value="MOBILE_PAYMENT">
                {t("paymentmethodmobile")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-sm sr-only md:not-sr-only">
            {t("paymentdate")}
          </Label>
          <Input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date: e.target.value }))
            }
            required
            className="h-10 md:h-9"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-sm sr-only md:not-sr-only">
          {t("paymentdescription")}
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder={t("paymentdescriptionplaceholder")}
          rows={2}
        />
      </div>
      {paymentData && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-orange-600" />
              {t("summarytitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("summaryteacher")}
              </span>
              <span className="font-medium">{paymentData.teacher.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("summarysubjects")}
              </span>
              <span className="font-medium">
                {formData.selectedSubjects.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("summarymethod")}
              </span>
              <span className="font-medium">{formData.paymentMethod}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center pt-1">
              <span className="font-semibold">{t("summarytotal")}</span>
              <span className="text-xl font-bold text-orange-600">
                MAD {totalAmount.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
            {t("teacherPayment") || "Teacher Payment"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-[95vw] md:max-w-[700px] lg:max-w-[800px] w-full h-auto flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="hidden md:block">
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        <div className="flex-1 overflow-y-auto px-1">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="space-y-4 flex-1">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-4 md:space-y-6">
                <div
                  className={currentStep !== 1 ? "hidden md:block" : "block"}
                >
                  {renderStep1()}
                </div>
                <div
                  className={currentStep !== 2 ? "hidden md:block" : "block"}
                >
                  {paymentData && !loadingCalculation && (
                    <div className="space-y-6">
                      <Separator className="hidden md:block" />
                      {renderStep2()}
                    </div>
                  )}
                </div>
                <div
                  className={currentStep !== 3 ? "hidden md:block" : "block"}
                >
                  {formData.selectedSubjects.length > 0 && paymentData && (
                    <div className="space-y-6">
                      <Separator className="hidden md:block" />
                      {renderStep3()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between gap-3 pt-4 border-t mt-4 md:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? () => setOpen(false) : prevStep}
                disabled={isLoading}
                className="flex-1"
              >
                {currentStep === 1 ? (
                  t("buttonscancel")
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </>
                )}
              </Button>
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    isLoading ||
                    (currentStep === 1 && !formData.teacherId) ||
                    loadingCalculation
                  }
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading || formData.selectedSubjects.length === 0}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("buttonscreate")}
                </Button>
              )}
            </div>
            <div className="hidden md:flex flex-col-reverse sm:flex-row justify-end gap-4 mt-4 border-t pt-4 sticky bottom-0 bg-background">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                {t("buttonscancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || formData.selectedSubjects.length === 0}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("buttonscreate")}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
