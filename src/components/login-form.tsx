"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/authContext"
import { loginAdmin } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Home, Loader2, Lock, Mail } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"

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
    <div className={cn("flex flex-col gap-4 sm:gap-6 w-full min-h-screen items-center justify-center p-3 sm:p-4", className)} {...props}>
      <Card className="border-0 shadow-xl w-full max-w-md">
        <CardHeader className="space-y-1 pb-4 sm:pb-6 px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
            {t("title")}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-6">
          <form action={action} className="space-y-4 sm:space-y-5">
            {/* Success Message */}
            {state?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <AlertDescription className="text-xs sm:text-sm text-green-700 ml-2">
                  Login successful! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            {/* General Error Message */}
            {state?.error?.message && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <AlertDescription className="text-xs sm:text-sm ml-2">
                  {state.error.message}
                </AlertDescription>
              </Alert>
            )}

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
                  className={cn(
                    "pl-10 pr-3 h-11 sm:h-12 w-full text-sm",
                    state?.error?.email && "border-red-500 focus-visible:ring-red-500"
                  )}
                  required
                  disabled={isPending}
                  autoComplete="email"
                />
              </div>
              {state?.error?.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>
                    {Array.isArray(state.error.email) ? state.error.email[0] : state.error.email}
                  </span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                  {t("password.label")}
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline underline-offset-4 whitespace-nowrap"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("password.placeholder")}
                  className={cn(
                    "pl-10 pr-10 h-11 sm:h-12 w-full text-sm",
                    state?.error?.password && "border-red-500 focus-visible:ring-red-500"
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {state?.error?.password && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>
                    {Array.isArray(state.error.password) ? state.error.password[0] : state.error.password}
                  </span>
                </p>
              )}
            </div>

            {/* Submit Button */}
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
              ) : (
                t("submit")
              )}
            </Button>

            {/* Terms */}
            <p className="text-xs text-center text-muted-foreground px-2 leading-relaxed">
              {t("terms")}{" "}
              <Link href="/terms" className="text-primary hover:underline underline-offset-4 font-medium">
                {t("termsOfService")}
              </Link>{" "}
              {t("and")}{" "}
              <Link href="/privacy" className="text-primary hover:underline underline-offset-4 font-medium">
                {t("privacyPolicy")}
              </Link>
            </p>

            {/* Divider */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground text-xs">
                  {t("noAccount")}
                </span>
              </div>
            </div>

            {/* Sign Up & Home Links */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/register"
                className="text-sm sm:text-base font-medium text-primary hover:underline underline-offset-4 inline-flex items-center gap-1 transition-colors"
              >
                {t("signUp")}
                <span aria-hidden="true" className="text-lg">→</span>
              </Link>
              <div className="hidden sm:block h-4 w-px bg-gray-300" />
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}