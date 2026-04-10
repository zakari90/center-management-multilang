"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";

interface PublicRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "student" | "teacher";
  centerId?: string;
}

interface Subject {
  id: string;
  name: string;
  grade: string;
  price: number;
}

export function PublicRegistrationDialog({
  open,
  onOpenChange,
  type = "student",
  centerId,
}: PublicRegistrationDialogProps) {
  const t = useTranslations("publicRegistration");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    grade: "",
    parentName: "",
    parentPhone: "",
    selectedSubjects: [] as string[],
  });

  // Fetch available subjects when dialog opens
  useEffect(() => {
    if (open && centerId && type === "student") {
      fetchSubjects();
    }
  }, [open, centerId, type]);

  const fetchSubjects = async () => {
    if (!centerId) return;
    setLoadingSubjects(true);
    try {
      const response = await fetch(`/api/public/subjects?centerId=${centerId}`);
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/public/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          centerId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(true);
      toast.success(t("success") || "Registration submitted successfully!");

      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: "",
          phone: "",
          email: "",
          grade: "",
          parentName: "",
          parentPhone: "",
          selectedSubjects: [],
        });
        setSuccess(false);
        onOpenChange(false);
      }, 2500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !success) {
      setFormData({
        name: "",
        phone: "",
        email: "",
        grade: "",
        parentName: "",
        parentPhone: "",
        selectedSubjects: [],
      });
      onOpenChange(false);
    }
  };

  // Get unique grades from subjects
  const availableGrades = [...new Set(subjects.map((s) => s.grade))];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "student" ? (
              <GraduationCap className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
            {type === "student"
              ? t("studentTitle") || "Student Registration"
              : t("teacherTitle") || "Teacher Registration"}
          </DialogTitle>
          <DialogDescription>
            {t("description") || "Fill in your details to register"}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8">
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <AlertDescription className="ml-2 text-lg">
                {t("success") || "Registration submitted successfully!"}
                <p className="text-sm mt-2 text-green-600">
                  {t("successDescription") ||
                    "We'll contact you soon with next steps."}
                </p>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("name") || "Full Name"} *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={t("namePlaceholder") || "Enter your full name"}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone") || "Phone Number"} *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="0612345678"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("email") || "Email"}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@example.com"
                disabled={isSubmitting}
              />
            </div>

            {type === "student" && (
              <>
                {/* Grade Selection */}
                <div className="space-y-2">
                  <Label htmlFor="grade">{t("grade") || "Grade"} *</Label>
                  <Select
                    value={formData.grade}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, grade: value }))
                    }
                    disabled={isSubmitting || loadingSubjects}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("selectGrade") || "Select grade"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGrades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Parent Name */}
                <div className="space-y-2">
                  <Label htmlFor="parentName">
                    {t("parentName") || "Parent Name"}
                  </Label>
                  <Input
                    id="parentName"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    placeholder={t("parentNamePlaceholder") || "Parent's name"}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Parent Phone */}
                <div className="space-y-2">
                  <Label htmlFor="parentPhone">
                    {t("parentPhone") || "Parent Phone"}
                  </Label>
                  <Input
                    id="parentPhone"
                    name="parentPhone"
                    type="tel"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    placeholder="0612345678"
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("submitting") || "Submitting..."}
                </>
              ) : (
                t("register") || "Register"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
