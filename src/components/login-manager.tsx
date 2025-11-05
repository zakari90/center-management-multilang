/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
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
import { loginManager as loginManagerAction } from "@/lib/actions"
import { getAllUsers, saveUserLocal } from "@/lib/dexieUserActions"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import bcrypt from "bcryptjs"
import { 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  Home, 
  UserCog, 
  Mail, 
  Lock 
} from "lucide-react"

export function LoginManager({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations('login')
  const tManager = useTranslations('loginManager')
  const tOffline = useTranslations('offline')
  const [state, setState] = useState<any>({})
  const [isPending, setIsPending] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  
  const [showPassword, setShowPassword] = useState(false)
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
    if (state?.success && state?.data?.user) {
      login(state.data.user)
      setTimeout(() => {
        router.push("/manager")
      }, 10)
    }
  }, [state, login, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState({})
    setIsPending(true)
    const formData = new FormData(e.currentTarget)
    const values = Object.fromEntries(formData.entries())

    // ONLINE
    if (!isOffline) {
      try {
        const result = await loginManagerAction(undefined, formData)
        if (result?.success && result?.data?.user) {
          // Save user locally for offline access
          await saveUserLocal({ ...result.data.user, status: "1" })
          setState({ success: true, data: result.data })
        } else {
          setState({ error: result?.error || { message: t("errors.loginFailed") } })
        }
      } catch (err) {
        console.log(err)
        setState({ error: { message: t("errors.unexpectedError") } })
      }
      setIsPending(false)
      return
    }

    // OFFLINE
    try {
      const users = await getAllUsers()
      const user = users.find(
        (u) => u.email === values.email && u.role === 'MANAGER'
      )
      if (user && bcrypt.compareSync(values.password as string, user.password)) {
        const { setClientUser } = await import('@/lib/clientAuth')
        await setClientUser({
          id: user.id || '',
          email: user.email,
          name: user.name,
          role: user.role,
        })
        setState({
          success: true,
          data: { user, message: tOffline("offlineSuccessMessage") }
        })
      } else {
        setState({ error: { message: tOffline("offlineLoginIncorrect") } })
      }
    } catch (err) {
      console.log(err)
      setState({ error: { message: tOffline("offlineLoginError") } })
    }
    setIsPending(false)
  }

  return (
    <div className={cn("flex flex-col gap-4 sm:gap-6 w-full min-h-screen items-center justify-center p-3 sm:p-4", className)} {...props}>
      <Card className={cn("border-0 shadow-xl w-full ml-2 mr-2", isOffline && "border-2 border-yellow-400")}>
        <CardHeader className="space-y-1 pb-4 sm:pb-6 px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center flex items-center justify-center gap-2">
            {tManager('title')}
          </CardTitle>
          <CardDescription className="text-center text-xs sm:text-sm px-2">
            {tManager('subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Success Message */}
            {state?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <AlertDescription className="text-xs sm:text-sm text-green-700 ml-2">
                  {isOffline
                    ? tOffline('offlineSuccessMessage')
                    : tManager('successMessage')}
                </AlertDescription>
              </Alert>
            )}

            {/* General Error Message */}
            {state?.error?.message && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <AlertDescription className="text-xs sm:text-sm ml-2">
                  {isOffline
                    ? tOffline('offlineLoginError')
                    : state.error.message}
                </AlertDescription>
              </Alert>
            )}

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
                  <span>
                    {Array.isArray(state.error.email) ? state.error.email[0] : state.error.email}
                  </span>
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
                  placeholder={t('password.placeholder')}
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  {isOffline
                    ? tOffline('offlineActionRetry')
                    : t('submitting')}
                </>
              ) : (
                <>
                  <UserCog className="mr-2 h-4 w-4 flex-shrink-0" />
                  {t('submit')}
                </>
              )}
            </Button>

            {/* Show offline info banner when offline */}
            {isOffline && (
              <div className="mt-3 mb-2 text-xs text-yellow-700 text-center bg-yellow-50 rounded py-2 px-3">
                {tOffline('offlineLoginInfo')}<br />
                {tOffline('offlineInfoSafe')}<br />
                {tOffline('offlineInfoSync')}
              </div>
            )}

            {/* Divider */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground text-xs">
                  {tManager('or')}
                </span>
              </div>
            </div>

            {/* Home Link */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Home className="h-4 w-4 flex-shrink-0" />
                <span>{tManager('backToHome')}</span>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50 border-dashed w-full max-w-sm">
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 flex-shrink-0 mt-1">
              <AlertCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1 min-w-0">
              {/* If offline, show offline info too */}
              <p className="text-xs sm:text-sm font-medium break-words">
                {isOffline
                  ? tOffline('offlineTitle')
                  : tManager('infoTitle')}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isOffline
                  ? tOffline('offlineInfoContinue')
                  : tManager('infoDescription')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
