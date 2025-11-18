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
import { AutoSyncProvider } from "./AutoSyncProvider"

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
      <AutoSyncProvider />
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
    <div className={cn("bg-background", className)} {...props}>
      <div className=" mx-auto flex-col w-full max-w-6xl flex-1 gap-12 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-8 text-center lg:text-left">
          {/* <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <ModeToggle />
            <LanguageSwitcher />
          </div> */}
          <div className="space-y-4">
            {/* <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
              {t("welcomeBadge")}
            </span> */}
            <h1 className="text-center mb-4  text-xl font-bold leading-tight text-foreground ">
              {tHome("title")}
            </h1>
            {/* <p className="text-base text-muted-foreground sm:text-lg">
              {tHome("description")}
            </p> */}
          </div>
          {/* <div className="grid gap-4 sm:grid-cols-2">
            {[tHome("ownerDashboard"), tHome("managerDashboard")].map((feature, index) => (
              <div
                key={feature}
                className="rounded-xl border border-border/70 bg-background/60 p-4 text-left shadow-sm transition hover:border-primary/40"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{feature}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {index === 0
                        ? t("adminOptionDescription")
                        : tManager("managerOptionDescription")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div> */}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center rounded-full border bg-muted/60 p-1 text-sm font-medium">
                    {(["admin", "manager"] as Role[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleRoleChange(option)}
                        className={cn(
                          "px-4 py-1.5 rounded-full transition-colors",
                          role === option
                            ? "bg-background text-foreground shadow"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {option === "admin" ? t("adminOption") : tManager("managerOption")}
                      </button>
                    ))}
                  </div>
                  {/* <div className="text-center space-y-1">
                    <CardTitle className="text-2xl sm:text-3xl font-bold">
                      {title}
                    </CardTitle>
                    {subtitle && (
                      <CardDescription className="text-xs sm:text-sm">
                        {subtitle}
                      </CardDescription>
                    )}
                  </div> */}
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-6">
                <form key={role} action={action} className="space-y-4 sm:space-y-5">
                  <input type="hidden" name="role" value={role} />

                  {state?.success && activeStateMatchesRole && (
                    <Alert className="border-green-200 bg-green-50" aria-live="polite">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm text-green-700 ml-2">
                        {successFallback}
                      </AlertDescription>
                    </Alert>
                  )}

                  {errorState?.error?.message && activeStateMatchesRole && (
                    <Alert variant="destructive" aria-live="assertive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm ml-2">
                        {errorState.error.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`email-${role}`} className="text-xs sm:text-sm font-medium">
                      {t("email.label")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        id={`email-${role}`}
                        name="email"
                        type="email"
                        placeholder={t("email.placeholder")}
                        className={cn(
                          "pl-10 pr-3 h-11 sm:h-12 w-full text-sm",
                          errorState?.error?.field === "email" && activeStateMatchesRole && "border-red-500 focus-visible:ring-red-500"
                        )}
                        required
                        disabled={isPending}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {errorState?.error?.field === "email" && activeStateMatchesRole && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {errorState.error.message}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`password-${role}`} className="text-xs sm:text-sm font-medium">
                      {t("password.label")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        id={`password-${role}`}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("password.placeholder")}
                        className={cn(
                          "pl-10 pr-10 h-11 sm:h-12 w-full text-sm",
                          errorState?.error?.field === "password" && activeStateMatchesRole && "border-red-500 focus-visible:ring-red-500"
                        )}
                        required
                        disabled={isPending}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        disabled={isPending}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errorState?.error?.field === "password" && activeStateMatchesRole && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {errorState.error.message}
                        </span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium mt-6"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                        {t("submitting")}
                      </>
                    ) : role === "manager" ? (
                      <>
                        <UserCog className="mr-2 h-4 w-4 flex-shrink-0" />
                        {t("submit")}
                      </>
                    ) : (
                      t("submit")
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground px-2 leading-relaxed">
                    {t("terms")}{" "}
                    <button
                      type="button"
                      onClick={() => setIsTermsOpen(true)}
                      className="text-primary hover:underline underline-offset-4 font-medium"
                    >
                      {t("termsOfService")}
                    </button>{" "}
                    {t("and")}{" "}
                    <button
                      type="button"
                      onClick={() => setIsPrivacyOpen(true)}
                      className="text-primary hover:underline underline-offset-4 font-medium"
                    >
                      {t("privacyPolicy")}
                    </button>
                  </p>
                </form>
                <div className="m-2 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <ModeToggle />
            <LanguageSwitcher />
          </div>
              </CardContent>
            </Card>
          </div>

          {role === "manager" && (
            <Card className="w-full max-w-md bg-muted/50 border-dashed">
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 flex-shrink-0 mt-1">
                    <AlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium break-words">
                      {tManager("infoTitle")}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tManager("infoDescription")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("privacyDialogTitle")}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("privacyDialogContent")}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("termsDialogTitle")}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground space-y-3">
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