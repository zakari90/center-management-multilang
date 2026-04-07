"use client";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ModeToggle } from "@/components/ModeToggle";
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
import { useAuth } from "@/context/authContext";
import { localDb, Role as DbRole } from "@/lib/dexie/dbSchema";
import { initializeFreeModeEnvironment } from "@/lib/dexie/freeModeHelper";
import { cn } from "@/lib/utils";
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
import { useEffect, useRef, useState } from "react";

type Role = "admin";

interface LoginFormProps extends React.ComponentProps<"div"> {
  initialRole?: Role;
  isFree?: boolean;
}

// Local login state type
interface LocalLoginState {
  success?: boolean;
  error?: {
    message: string;
    field?: string;
  };
}

export function FreeLoginForm({
  className,
  isFree = true,
  initialRole = "admin",
  ...props
}: LoginFormProps) {
  const t = useTranslations("login");
  const tManager = useTranslations("loginManager");
  const locale = useLocale();
  const { login } = useAuth();

  const [role, setRole] = useState<Role>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<LocalLoginState | undefined>(undefined);
  
  const formRef = useRef<HTMLFormElement>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  // Check if admin exists in local Dexie DB
  useEffect(() => {
    const checkLocalAdmin = async () => {
      setCheckingAdmin(true);
      try {
        const admin = await localDb.users
          .where("role")
          .equals(DbRole.ADMIN)
          .first();
        
        const exists = !!admin;
        setHasAdmin(exists);
        
        setHasAdmin(exists);
      } catch (error) {
        console.error("Failed to check local admin:", error);
        setHasAdmin(null);
      } finally {
        setCheckingAdmin(false);
      }
    };
    
    checkLocalAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteAdmin = async () => {
    if (confirm("Are you sure you want to delete the local admin data?")) {
      try {
        await localDb.users.clear();
        await localDb.centers.clear();
        setHasAdmin(false);
        setIsRegisterDialogOpen(true);
      } catch (error) {
        console.error("Failed to clear local data:", error);
      }
    }
  };

  const handleLocalLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setState(undefined);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const selectedRole = formData.get("role") as string;

    try {
      // Find user in local DB
      const user = await localDb.users
        .where("email")
        .equals(email)
        .first();

      if (!user) {
        setState({
          success: false,
          error: { message: t("errorInvalidCredentials"), field: "email" }
        });
        setIsPending(false);
        return;
      }

      // Check role
      const userRole = user.role.toLowerCase();
      if (userRole !== "admin") {
         setState({
          success: false,
          error: { message: "Only admin access is allowed in local mode." }
        });
        setIsPending(false);
        return;
      }

      // In Free local mode, we assume simple password check if needed,
      // but usually the first created user has no password yet or a simple one.
      // For now, let's just log them in.
      
      await login(user, password);
      
      const destination = `/${locale}/free/admin`;
        
      window.location.href = destination;
    } catch (err) {
      setState({
        success: false,
        error: { message: "Login failed locally." }
      });
    } finally {
      setIsPending(false);
    }
  };

  const successFallback = t("successMessage");

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      {" "}
      <div>
        {/* --- Main Card --- */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-2 pb-4 text-center sm:pb-6">
            <h2 className="text-xl font-bold">{t("title")}</h2>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-6">
            <form
              key={role}
              ref={formRef}
              onSubmit={handleLocalLogin}
              className="space-y-5"
            >
              <input type="hidden" name="role" value={role} />

              {/* Alerts Container */}
              <div className="space-y-4">
                {state?.success && (
                  <Alert
                    className="border-green-200 bg-green-50 text-green-800"
                    aria-live="polite"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <AlertDescription className="text-xs sm:text-sm font-medium ml-2">
                      {successFallback}
                    </AlertDescription>
                  </Alert>
                )}

                {state?.error?.message && (
                  <Alert variant="destructive" aria-live="assertive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <AlertDescription className="text-xs sm:text-sm font-medium ml-2">
                      {state.error.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Show registration prompt if no local admin exists */}
                {role === "admin" && hasAdmin === false && !checkingAdmin && (
                  <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                    <Info className="h-4 w-4 shrink-0" />
                    <AlertDescription className="text-xs sm:text-sm font-medium ml-2">
                      {t("noLocalAdminExists") ||
                        "No local center found on this device. Create one to start using the app offline."}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Show delete admin button for testing */}
                {/* {role === "admin" && hasAdmin === true && !checkingAdmin && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAdmin}
                    className="w-full h-8 text-xs font-medium"
                  >
                    Delete Admin Data (Testing)
                  </Button>
                )} */}
              </div>

              {/* Show registration button if no admin exists */}
              {role === "admin" && hasAdmin === false && !checkingAdmin ? (
                <Button
                  type="button"
                  onClick={async () => {
                    setIsPending(true);
                    try {
                      await initializeFreeModeEnvironment(login);
                      window.location.href = `/${locale}/free/admin`;
                    } catch (error) {
                      console.error(error);
                    } finally {
                      setIsPending(false);
                    }
                  }}
                  className="w-full h-11 text-sm font-medium"
                >
                  <UserCog className="mr-2 h-4 w-4 shrink-0" />
                  {t("initializeLocalCenter") || "Create My Local Center"}
                </Button>
              ) : (
                <>
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor={`email-${role}`}
                      className="text-sm font-semibold"
                    >
                      {t("email.label")}
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
                      <Input
                        id={`email-${role}`}
                        name="email"
                        type="email"
                        placeholder={t("email.placeholder")}
                        className={cn(
                          "ps-9 h-11 w-full transition-colors",
                          state?.error?.field === "email" &&
                            "border-destructive focus-visible:ring-destructive",
                        )}
                        required
                        disabled={isPending}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {state?.error?.field === "email" && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{state.error.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={`password-${role}`}
                        className="text-sm font-semibold"
                      >
                        {t("password.label")}
                      </Label>
                      {/* Optional: Add Forgot Password link here if needed */}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
                      <Input
                        id={`password-${role}`}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("password.placeholder")}
                        className={cn(
                          "ps-9 pe-10 h-11 w-full transition-colors",
                          state?.error?.field === "password" &&
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
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {state?.error?.field === "password" && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{state.error.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
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

                  {/* Terms */}
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

            {/* Visual Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
            </div>

            {/* Utility Footer (Theme & Lang) */}
            <div className="flex items-center justify-center gap-4">
              <ModeToggle />
              <LanguageSwitcher />
            </div>
          </CardContent>
        </Card>

      </div>
      {/* --- Modals --- */}
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
    </div>
  );
}
