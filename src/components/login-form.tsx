"use client"

import { useActionState, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/authContext"
import { loginAdmin } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Eye, EyeOff, Loader2, AlertCircle, LogIn, Mail, Lock } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, action, isPending] = useActionState(loginAdmin, undefined)
  const { login } = useAuth()
  const router = useRouter()
  const t = useTranslations("login")
  
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (state?.success && state?.data?.user) {
      login(state.data.user)
      setTimeout(() => {
        router.push("/admin")
      }, 10)
    }
  }, [state, login, router])

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto p-4", className)} {...props}>
      <Card className="border-0 shadow-xl">
        <CardHeader className="space-y-1 pb-4 px-4 sm:px-6">
          <div className="flex items-center justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-center text-xs sm:text-sm">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          <form action={action} className="space-y-4">
            {/* Success Message */}
            {state?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm text-green-700">
                  Login successful! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            {/* General Error Message */}
            {state?.error?.message && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {state.error.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t("email.label")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("email.placeholder")}
                  className={cn(
                    "pl-10 h-10 sm:h-11 w-full",
                    state?.error?.email && "border-red-500 focus-visible:ring-red-500"
                  )}
                  required
                  disabled={isPending}
                  autoComplete="email"
                />
              </div>
              {state?.error?.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {Array.isArray(state.error.email) ? state.error.email[0] : state.error.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("password.label")}
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline underline-offset-4"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("password.placeholder")}
                  className={cn(
                    "pl-10 pr-10 h-10 sm:h-11 w-full",
                    state?.error?.password && "border-red-500 focus-visible:ring-red-500"
                  )}
                  required
                  disabled={isPending}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
              {state?.error?.password && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {Array.isArray(state.error.password) ? state.error.password[0] : state.error.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>

            {/* Terms */}
            <p className="text-xs text-center text-muted-foreground px-2">
              {t("terms")}{" "}
              <Link href="/terms" className="text-primary hover:underline underline-offset-4">
                {t("termsOfService")}
              </Link>{" "}
              {t("and")}{" "}
              <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
                {t("privacyPolicy")}
              </Link>
            </p>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("noAccount")}
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link
                href="/register"
                className="text-sm font-medium text-primary hover:underline underline-offset-4 inline-flex items-center gap-1"
              >
                {t("signUp")}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
