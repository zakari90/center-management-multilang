/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/authContext"
import { register } from "@/lib/actions"
import { localDb, LocalUser } from "@/lib/dexie"
import { cn } from "@/lib/utils"
import bcrypt from "bcryptjs"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export type Role = "ADMIN" | "MANAGER"

export function RegisterForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("register")
  const tOffline = useTranslations("offline")
  const { login: setUser } = useAuth()
  const router = useRouter()
  const [state, setState] = useState<any>({})
  const [isPending, setIsPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    if (state?.success && state?.data?.user && !isOffline) {
      setUser(state.data.user)
      setTimeout(() => { router.push("/admin") }, 10)
    }
  }, [state, setUser, router, isOffline])

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    return strength
  }

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return "bg-gray-200"
    if (strength === 1) return "bg-red-500"
    if (strength === 2) return "bg-orange-500"
    if (strength === 3) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = (strength: number) => {
    if (strength === 0) return ""
    if (strength === 1) return t("passwordStrength.weak")
    if (strength === 2) return t("passwordStrength.fair")
    if (strength === 3) return t("passwordStrength.good")
    return t("passwordStrength.strong")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState({})
    setIsPending(true)
    const formData = new FormData(e.currentTarget)
    const values = Object.fromEntries(formData.entries())

    // Online registration
    if (!isOffline) {
      try {
        const result = await register(undefined, formData)
        if (result?.success && result?.data?.user) {
          setState({ success: true, data: result.data })
          setUser(result.data.user)
          setTimeout(() => router.push("/admin"), 10)
        } else {
          setState({ error: result?.error || { message: t("errors.registrationFailed") } })
        }
      } catch (err) {
        console.log("Registration error:", err);
        
        setState({ error: { message: t("errors.unexpectedError") } })
      }
      setIsPending(false)
      return
    }

    // OFFLINE registration – hash password and save in Dexie
    try {
      if (values.password !== values.confirmPassword) {
        setState({ error: { message: t("errors.passwordMismatch") } })
        setIsPending(false)
        return
      }
      const hash = bcrypt.hashSync(values.password as string, 10)
      const user: LocalUser = {
        email: values.email as string,
        name: values.username as string,
        password: hash,
        role: (values.role as Role) || "ADMIN",
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "pending"
      }
      await localDb.users.add(user)

      setState({
        success: true,
        data: { user, message: tOffline("offlineSuccessMessage") }
      })
    } catch (err) {
        console.log("Registration error:", err);

      setState({ error: { message: tOffline("offlineLoginError") } })
    }
    setIsPending(false)
  }

  return (
    <div className={cn("flex flex-col gap-4 sm:gap-6 w-full min-h-screen items-center justify-center p-3 sm:p-4", className)} {...props}>
      <Card className={cn("border-0 shadow-xl w-full ml-2 mr-2", isOffline && "border-2 border-yellow-400")}>
        <CardHeader className="space-y-1 pb-4 sm:pb-6 px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" autoComplete="off">
            {state?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <AlertDescription className="text-xs sm:text-sm text-green-700 ml-2">
                  {isOffline ? tOffline("offlineSuccessMessage") : t("successMessage")}
                </AlertDescription>
              </Alert>
            )}
            {state?.error?.message && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <AlertDescription className="text-xs sm:text-sm ml-2">
                  {isOffline ? tOffline("offlineLoginError") : state.error.message}
                </AlertDescription>
              </Alert>
            )}
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs sm:text-sm font-medium">
                {t("username.label")}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t("username.placeholder")}
                  className={cn("pl-10 pr-3 h-11 sm:h-12 w-full text-sm", state?.error?.username && "border-red-500 focus-visible:ring-red-500")}
                  required
                  disabled={isPending}
                  autoComplete="username"
                />
              </div>
              {state?.error?.username && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {Array.isArray(state.error.username) ? state.error.username[0] : state.error.username}
                </p>
              )}
            </div>
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
                {t("email.label")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("email.placeholder")}
                  className={cn("pl-10 pr-3 h-11 sm:h-12 w-full text-sm", state?.error?.email && "border-red-500 focus-visible:ring-red-500")}
                  required
                  disabled={isPending}
                  autoComplete="email"
                />
              </div>
              {state?.error?.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {Array.isArray(state.error.email) ? state.error.email[0] : state.error.email}
                </p>
              )}
            </div>
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                {t("password.label")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={cn("pl-10 pr-10 h-11 sm:h-12 w-full text-sm", state?.error?.password && "border-red-500 focus-visible:ring-red-500")}
                  required
                  disabled={isPending}
                  autoComplete="new-password"
                  onChange={(e) => setPasswordStrength(calculatePasswordStrength(e.target.value))}
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
              {passwordStrength > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          level <= passwordStrength ? getStrengthColor(passwordStrength) : "bg-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn(
                    "text-xs font-medium",
                    passwordStrength === 1 && "text-red-500",
                    passwordStrength === 2 && "text-orange-500",
                    passwordStrength === 3 && "text-yellow-600",
                    passwordStrength === 4 && "text-green-600"
                  )}>
                    {getStrengthText(passwordStrength)} {t("passwordStrength.label")}
                  </p>
                </div>
              )}
              {state?.error?.password && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {Array.isArray(state.error.password) ? state.error.password[0] : state.error.password}
                </p>
              )}
            </div>
            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium">
                {t("confirmPassword.label")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={cn("pl-10 pr-10 h-11 sm:h-12 w-full text-sm", state?.error?.confirmPassword && "border-red-500 focus-visible:ring-red-500")}
                  required
                  disabled={isPending}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  disabled={isPending}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {state?.error?.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {Array.isArray(state.error.confirmPassword) ? state.error.confirmPassword[0] : state.error.confirmPassword}
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
                  {isOffline ? tOffline("offlineActionRetry") : t("submitting")}
                </>
              ) : t("submit")}
            </Button>
            {/* Offline status & info */}
            {isOffline && (
              <div className="mt-3 mb-2 text-xs text-yellow-700 text-center bg-yellow-50 rounded py-2 px-3">
                {tOffline("offlineLoginInfo")}<br/>
                {tOffline("offlineInfoSafe")}<br/>
                {tOffline("offlineInfoSync")}
              </div>
            )}
            <p className="text-xs text-center text-muted-foreground px-2 leading-relaxed">
              {t("terms")}{" "}
              <Link href="/terms" className="text-primary hover:underline underline-offset-4 font-medium">{t("termsOfService")}</Link>{" "}
              {t("and")}{" "}
              <Link href="/privacy" className="text-primary hover:underline underline-offset-4 font-medium">{t("privacyPolicy")}</Link>
            </p>
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground text-xs">{t("alreadyHaveAccount")}</span>
              </div>
            </div>
            <div className="text-center">
              <Link href="/login" className="text-sm sm:text-base font-medium text-primary hover:underline underline-offset-4 inline-flex items-center gap-1 transition-colors">
                {t("login")}
                <span aria-hidden="true" className="text-lg">→</span>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
