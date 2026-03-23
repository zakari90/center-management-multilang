"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { toast } from "sonner";

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
  const [isEncrypted, setIsEncrypted] = useState(false);

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
      const response = await fetch("/api/admin/register-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          isEncrypted,
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register admin");
      }

      setSuccess(true);
      toast.success(t("successMessage") || "Admin registered successfully!");

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setIsEncrypted(false);

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
      setIsEncrypted(false);
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

          {/* Encryption Toggle */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-base text-destructive">
                  {t("e2eeTitle")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("e2eeDescription")}
                </p>
              </div>
              <div className="flex shrink-0 items-center space-x-4 rtl:space-x-reverse">
                <label className="flex cursor-pointer items-center gap-1.5 text-sm font-medium">
                  <input
                    type="radio"
                    name="encryption_mode"
                    className="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                    checked={!isEncrypted}
                    onChange={() => setIsEncrypted(false)}
                    disabled={isSubmitting || success}
                  />
                  <span>{t("e2eeNo")}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-destructive">
                  <input
                    type="radio"
                    name="encryption_mode"
                    className="h-4 w-4 cursor-pointer accent-destructive disabled:cursor-not-allowed disabled:opacity-50"
                    checked={isEncrypted}
                    onChange={() => setIsEncrypted(true)}
                    disabled={isSubmitting || success}
                  />
                  <span>{t("e2eeYes")}</span>
                </label>
              </div>
            </div>
            {isEncrypted && (
              <Alert variant="destructive" className="mt-2 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertDescription className="ml-2 text-xs font-semibold leading-relaxed">
                  {t("e2eeWarning")}
                </AlertDescription>
              </Alert>
            )}
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
