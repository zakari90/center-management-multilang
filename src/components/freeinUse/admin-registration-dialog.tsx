"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/freecomponents/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/freecomponents/ui/dialog";
import { Input } from "@/freecomponents/ui/input";
import { Label } from "@/freecomponents/ui/label";
import { Alert, AlertDescription } from "@/freecomponents/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { localDb, Role } from "@/freelib/dexie/dbSchema";
import { userActions } from "@/freelib/dexie/freedexieaction";
import { generateObjectId } from "@/freelib/utils/generateObjectId";

interface AdminRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdminRegistrationDialog({
  open,
  onOpenChange,
  onSuccess,
}: AdminRegistrationDialogProps) {
  const t = useTranslations("adminRegistration");
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Client-side validation
    if (!formData.name || !formData.email || !formData.password) {
      setError(t("allFieldsRequired") || "All fields are required");
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t("passwordMismatch") || "Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 4) {
      setError(
        t("passwordTooShort") || "Password must be at least 4 characters",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // 100% local registration
      const newAdmin = {
        id: generateObjectId(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: Role.ADMIN,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await userActions.create(newAdmin);

      setSuccess(true);
      toast.success(t("successMessage") || "Admin registered successfully!");

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Close dialog after a short delay
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        onSuccess?.();
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("registrationFailed") || "Registration failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setError(null);
      setSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="mt-2 flex items-center gap-2">
          <DialogTitle>
            {/* <UserPlus className="h-5 w-5" /> */}
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {t("successMessage")}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">{error}</AlertDescription>
            </Alert>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="admin-name">{t("nameLabel")}</Label>
            <Input
              id="admin-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t("namePlaceholder") || "Enter full name"}
              disabled={isSubmitting || success}
              required
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="admin-email">{t("emailLabel")}</Label>
            <Input
              id="admin-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder={t("emailPlaceholder") || "admin@example.com"}
              disabled={isSubmitting || success}
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="admin-password">{t("passwordLabel")}</Label>
            <Input
              id="admin-password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder={t("passwordPlaceholder") || "Enter password"}
              disabled={isSubmitting || success}
              required
            />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="admin-confirm-password">
              {t("confirmPasswordLabel")}
            </Label>
            <Input
              id="admin-confirm-password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder={
                t("confirmPasswordPlaceholder") || "Confirm password"
              }
              disabled={isSubmitting || success}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("cancelButton") || "Cancel"}
            </Button>
            <Button type="submit" disabled={isSubmitting || success}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("submitting") || "Registering..."}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t("submitButton")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
