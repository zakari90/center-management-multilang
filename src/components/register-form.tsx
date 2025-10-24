"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/authContext"
import { register } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations('register')
  const [state, action, isPending] = useActionState(register, undefined)
  const { login: setUser } = useAuth()
  const router = useRouter()
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  useEffect(() => {
    if (state?.success && state?.data?.user) {
      setUser(state.data.user)
      setTimeout(() => {
        router.push("/admin")
      }, 10)
    }
  }, [state, setUser, router])

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
    if (strength === 1) return "Weak"
    if (strength === 2) return "Fair"
    if (strength === 3) return "Good"
    return "Strong"
  }

  return (
    <div className={cn("flex flex-col gap-4 sm:gap-6 w-full min-h-screen flex items-center justify-center p-3 sm:p-4", className)} {...props}>
      <Card className="border-0 shadow-xl w-full max-w-sm">
        <CardHeader className="space-y-1 pb-4 sm:pb-6 px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
            {t('title')}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-6">
          <form action={action} className="space-y-4 sm:space-y-5">
            {/* Success Message */}
            {state?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <AlertDescription className="text-xs sm:text-sm text-green-700 ml-2">
                  {t('successMessage')}
                  Account created successfully! Redirecting...
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

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs sm:text-sm font-medium">
                {t('username.label')}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t('username.placeholder')}
                  className={cn(
                    "pl-10 pr-3 h-11 sm:h-12 w-full text-sm",
                    state?.error?.username && "border-red-500 focus-visible:ring-red-500"
                  )}
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
                {t('email.label')}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('email.placeholder')}
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
                  {Array.isArray(state.error.email) ? state.error.email[0] : state.error.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                {t('password.label')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={cn(
                    "pl-10 pr-10 h-11 sm:h-12 w-full text-sm",
                    state?.error?.password && "border-red-500 focus-visible:ring-red-500"
                  )}
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
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
                    {getStrengthText(passwordStrength)} password
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
                {t('confirmPassword.label')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={cn(
                    "pl-10 pr-10 h-11 sm:h-12 w-full text-sm",
                    state?.error?.confirmPassword && "border-red-500 focus-visible:ring-red-500"
                  )}
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
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {state?.error?.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {Array.isArray(state.error.confirmPassword) ? state.error.confirmPassword[0] : state.error.confirmPassword}
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
                  {t('submitting')}
                </>
              ) : (
                t('submit')
              )}
            </Button>

            {/* Terms */}
            <p className="text-xs text-center text-muted-foreground px-2 leading-relaxed">
              {t('terms')}{" "}
              <Link href="/terms" className="text-primary hover:underline underline-offset-4 font-medium">
                {t('termsOfService')}
              </Link>{" "}
              {t('and')}{" "}
              <Link href="/privacy" className="text-primary hover:underline underline-offset-4 font-medium">
                {t('privacyPolicy')}
              </Link>
            </p>

            {/* Divider */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground text-xs">
                  {t('alreadyHaveAccount')}
                </span>
              </div>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <Link 
                href="/login" 
                className="text-sm sm:text-base font-medium text-primary hover:underline underline-offset-4 inline-flex items-center gap-1 transition-colors"
              >
                {t('login')}
                <span aria-hidden="true" className="text-lg">→</span>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}