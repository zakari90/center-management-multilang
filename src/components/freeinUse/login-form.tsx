"use client";

import { AdminRegistrationDialog } from "@/components/freeinUse/admin-registration-dialog";
import LanguageSwitcher from "@/components/freeinUse/LanguageSwitcher";
import { ModeToggle } from "@/components/freeinUse/ModeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/freelib/context/authContext";
import { loginWithRole } from "@/freelib/actionsClient";
import { cn } from "@/freelib/utils";
import { Role } from "@/freelib/dexie/dbSchema";
import { userActions } from "@/freelib/dexie/freedexieaction";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  UserCog,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";

interface LoginFormProps extends React.ComponentProps<"div"> {}

// Type guard to check if state is an error
function isErrorState(
  state: Awaited<ReturnType<typeof loginWithRole>> | undefined,
): state is Extract<
  Awaited<ReturnType<typeof loginWithRole>>,
  { success: false }
> {
  return state !== undefined && !state.success;
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const t = useTranslations("login");
  const locale = useLocale();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [state, action, isPending] = useActionState(loginWithRole, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // Check if admin exists on mount
  useEffect(() => {
    setCheckingAdmin(true);
    userActions
      .getAll()
      .then((users) => {
        const hasAdminUser = users.some((u) => u.role === Role.ADMIN);
        setHasAdmin(hasAdminUser);
      })
      .catch((error) => {
        console.error("Failed to check admin existence:", error);
        setHasAdmin(null);
      })
      .finally(() => {
        setCheckingAdmin(false);
      });
  }, []);

  const errorState = isErrorState(state) ? state : null;

  useEffect(() => {
    if (state?.success && state?.data?.user) {
      login(state.data.user);
      const base = `/${locale}`;
      const destination = `${base}/free/admin`;
      window.location.href = destination;
    }
  }, [state, login, locale]);

  const handleRegistrationSuccess = () => {
    setHasAdmin(true);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      {" "}
      <div>
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-2 pb-4 text-center sm:pb-6">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <UserCog className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">{t("title")}</h1>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                {t("adminOptionDescription")}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-6">
            <form ref={formRef} action={action} className="space-y-5">
              <input type="hidden" name="role" value="admin" />

              <div className="space-y-4">
                {state?.success && (
                  <Alert
                    className="border-green-200 bg-green-50 text-green-800"
                    aria-live="polite"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <AlertDescription className="text-xs sm:text-sm font-medium ml-2">
                      {t("successMessage")}
                    </AlertDescription>
                  </Alert>
                )}

                {errorState?.error?.message && (
                  <Alert variant="destructive" aria-live="assertive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <AlertDescription className="text-xs sm:text-sm font-medium ml-2">
                      {errorState.error.message}
                    </AlertDescription>
                  </Alert>
                )}

                {hasAdmin === false && !checkingAdmin && (
                  <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                    <Info className="h-4 w-4 shrink-0" />
                    <AlertDescription className="text-xs sm:text-sm font-medium ml-2">
                      {t("noAdminExists") ||
                        "No admin account exists. Please register an admin account first."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {hasAdmin === false && !checkingAdmin ? (
                <Button
                  type="button"
                  onClick={() => setIsRegisterDialogOpen(true)}
                  className="w-full h-11 text-sm font-medium"
                >
                  <UserCog className="mr-2 h-4 w-4 shrink-0" />
                  {t("registerAdminButton") || "Register Admin Account"}
                </Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">
                      {t("email.label")}
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t("email.placeholder")}
                        className={cn(
                          "ps-9 h-11 w-full transition-colors",
                          errorState?.error?.field === "email" &&
                            "border-destructive focus-visible:ring-destructive",
                        )}
                        required
                        disabled={isPending}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-sm font-semibold"
                      >
                        {t("password.label")}
                      </Label>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("password.placeholder")}
                        className={cn(
                          "ps-9 pe-10 h-11 w-full transition-colors",
                          errorState?.error?.field === "password" &&
                            "border-destructive focus-visible:ring-destructive",
                        )}
                        required
                        disabled={isPending}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none z-10"
                        disabled={isPending}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-sm font-medium mt-2"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                        {t("submitting")}
                      </>
                    ) : (
                      t("submit")
                    )}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground leading-relaxed px-2">
                    {t("terms")}{" "}
                    <button
                      type="button"
                      onClick={() => setIsTermsOpen(true)}
                      className="text-primary hover:underline underline-offset-2 font-medium transition-colors"
                    >
                      {t("termsOfService")}
                    </button>{" "}
                    {t("and")}{" "}
                    <button
                      type="button"
                      onClick={() => setIsPrivacyOpen(true)}
                      className="text-primary hover:underline underline-offset-2 font-medium transition-colors"
                    >
                      {t("privacyPolicy")}
                    </button>
                  </p>
                </>
              )}
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <ModeToggle />
              <LanguageSwitcher />
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("privacyDialogTitle")}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              {t("privacyDialogContent")}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("termsDialogTitle")}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground space-y-3 pt-2">
              <p>{t("termsDialogOwnership")}</p>
              <p>{t("termsDialogRestrictions")}</p>
              <p>{t("termsDialogConsent")}</p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <AdminRegistrationDialog
        open={isRegisterDialogOpen}
        onOpenChange={setIsRegisterDialogOpen}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
