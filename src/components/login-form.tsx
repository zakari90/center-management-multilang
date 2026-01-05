"use client"

import LanguageSwitcher from "@/components/LanguageSwitcher"
import { ModeToggle } from "@/components/ModeToggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/authContext"
import { loginWithRole } from "@/lib/actionsClient"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  UserCog
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
// import { AutoSyncProvider } from "./AutoSyncProvider"

type Role = "admin" | "manager"

interface LoginFormProps extends React.ComponentProps<"div"> {
  initialRole?: Role
}

// Type guard to check if state is an error
function isErrorState(
  state: Awaited<ReturnType<typeof loginWithRole>> | undefined
): state is Extract<Awaited<ReturnType<typeof loginWithRole>>, { success: false }> {
  return state !== undefined && !state.success
}

export function LoginForm({
  className,
  initialRole = "admin",
  ...props
}: LoginFormProps) {
  const t = useTranslations("login")
  const tManager = useTranslations("loginManager")
  const tHome = useTranslations("homePage")
  const { login } = useAuth()
  const router = useRouter()

  const [role, setRole] = useState<Role>(initialRole)
  const [showPassword, setShowPassword] = useState(false)
  const [state, action, isPending] = useActionState(loginWithRole, undefined)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)

  useEffect(() => {
    setRole(initialRole)
  }, [initialRole])

  const activeStateMatchesRole = state?.role ? state.role === role : true
  const errorState = isErrorState(state) ? state : null

  useEffect(() => {
    if (state?.success && activeStateMatchesRole && state?.data?.user) {
      // <AutoSyncProvider />
      login(state.data.user)
      const userRole = state.data.user.role
      const destination = userRole === "MANAGER"
        ? "/manager"
        : userRole === "ADMIN"
          ? "/admin"
          : role === "manager"
            ? "/manager"
            : "/admin"

      const timeout = setTimeout(() => {
        router.push(destination)
      }, 10)

      return () => clearTimeout(timeout)
    }
  }, [state, activeStateMatchesRole, login, router, role])

  const successFallback = role === "manager" ? tManager("successMessage") : "Login successful! Redirecting..."

  const handleRoleChange = (nextRole: Role) => {
    if (nextRole !== role) {
      setRole(nextRole)
    }
  }

  return (
<div className={cn("bg-background min-h-svh w-full", className)} {...props}>
  <div className="flex min-h-svh flex-1 items-center justify-center px-4 py-10 sm:px-6">
    <div className="w-full w-[420px] space-y-1">
      
      {/* --- Main Card --- */}
      <Card className="border-border shadow-lg">
        <CardHeader className="space-y-2 pb-4 text-center sm:pb-6">
          {/* Role Toggle (Segmented Control Style) */}
          <div className="inline-flex items-center justify-center rounded-lg bg-muted p-1 text-sm font-medium ring-offset-background">
            {(["admin", "manager"] as Role[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleRoleChange(option)}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  role === option
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                )}
              >
                {option === "admin" ? t("adminOption") : tManager("managerOption")}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-6">
          <form key={role} action={action} className="space-y-5">
            <input type="hidden" name="role" value={role} />

            {/* Alerts Container */}
            <div className="space-y-4">
              {state?.success && activeStateMatchesRole && (
                <Alert className="border-green-200 bg-green-50 text-green-800" aria-live="polite">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm font-medium ml-2">
                    {successFallback}
                  </AlertDescription>
                </Alert>
              )}

              {errorState?.error?.message && activeStateMatchesRole && (
                <Alert variant="destructive" aria-live="assertive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm font-medium ml-2">
                    {errorState.error.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor={`email-${role}`} className="text-sm font-semibold">
                {t("email.label")}
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <Input
                  id={`email-${role}`}
                  name="email"
                  type="email"
                  placeholder={t("email.placeholder")}
                  className={cn(
                    "pl-9 h-11 w-full transition-colors",
                    errorState?.error?.field === "email" && activeStateMatchesRole && "border-destructive focus-visible:ring-destructive"
                  )}
                  required
                  disabled={isPending}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {errorState?.error?.field === "email" && activeStateMatchesRole && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{errorState.error.message}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`password-${role}`} className="text-sm font-semibold">
                  {t("password.label")}
                </Label>
                {/* Optional: Add Forgot Password link here if needed */}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <Input
                  id={`password-${role}`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("password.placeholder")}
                  className={cn(
                    "pl-9 h-11 w-full transition-colors",
                    errorState?.error?.field === "password" && activeStateMatchesRole && "border-destructive focus-visible:ring-destructive"
                  )}
                  required
                  disabled={isPending}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  disabled={isPending}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errorState?.error?.field === "password" && activeStateMatchesRole && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{errorState.error.message}</span>
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
                <>
                  {role === "manager" && <UserCog className="mr-2 h-4 w-4 shrink-0" />}
                  {t("submit")}
                </>
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

      {/* --- Manager Info Card (Conditional) --- */}
      {role === "manager" && (
        <Card className="bg-muted/30 border-muted-foreground/20 shadow-sm">
          <CardContent className="pt-4 px-6 pb-4">
            <div className="flex gap-3">
              <div className="mt-0.5 shrink-0">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold leading-none">
                  {tManager("infoTitle")}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed pt-1">
                  {tManager("infoDescription")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
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
  )
}