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
import { loginWithRole } from "@/lib/actions"
import { setClientUser } from "@/lib/clientAuth"
import { userActions } from "@/lib/dexie/dexieActions"
import { generateObjectId } from "@/lib/utils/generateObjectId"
import { saveManagerToLocalDb } from "@/lib/utils/saveManagerToLocalDb"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  UserCog,
  WifiOff,
  Bug,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import bcrypt from "bcryptjs"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { useEffect, useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

type Role = "admin" | "manager"

interface LoginFormProps extends React.ComponentProps<"div"> {
  initialRole?: Role
}

export function LoginForm({
  className,
  initialRole = "admin",
  ...props
}: LoginFormProps) {
  const t = useTranslations("login")
  const tManager = useTranslations("loginManager")
  const tHome = useTranslations("homePage")
  const tOffline = useTranslations("offline")
  const { login } = useAuth()
  const router = useRouter()

  const [role, setRole] = useState<Role>(initialRole)
  const [showPassword, setShowPassword] = useState(false)
  
  // Replace useActionState with useState + useTransition
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<{
    success?: boolean
    error?: { 
      message?: string
      email?: string | string[]
      password?: string | string[]
    }
    data?: { 
      user?: {
        id: string
        email: string
        name: string
        role: string
      }
      message?: string
    }
    role?: string
  } | undefined>(undefined)

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [offlineError, setOfflineError] = useState<string | null>(null)
  const [offlineSuccess, setOfflineSuccess] = useState(false)
  const [isOfflineLoading, setIsOfflineLoading] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    setRole(initialRole)
  }, [initialRole])

  // Track online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine)
    }

    // Set initial status
    updateOnlineStatus()

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  // Reset offline states when role changes
  useEffect(() => {
    setOfflineError(null)
    setOfflineSuccess(false)
    setState(undefined) // Also reset online state
  }, [role])

  const activeStateMatchesRole = state?.role ? state.role === role : true

  // Handle online login success
  useEffect(() => {
    if (state?.success && activeStateMatchesRole && state?.data?.user) {
      console.log('✅ [REDIRECT] Online login successful, preparing redirect...', {
        userRole: state.data.user.role,
        currentRole: role,
        stateSuccess: state.success
      })
      
      login(state.data.user)
      const userRole = state.data.user.role
      const destination = userRole === "MANAGER"
        ? "/manager"
        : userRole === "ADMIN"
          ? "/admin"
          : role === "manager"
            ? "/manager"
            : "/admin"

      console.log('🚀 [REDIRECT] Redirecting to:', destination)
      
      const timeout = setTimeout(() => {
        router.push(destination)
        console.log('✅ [REDIRECT] Navigation triggered to:', destination)
      }, 10)

      return () => clearTimeout(timeout)
    }
  }, [state, activeStateMatchesRole, login, router, role])

  // Handle offline login success
  useEffect(() => {
    if (offlineSuccess) {
      console.log('✅ [REDIRECT] Offline login successful, preparing redirect...', {
        role,
        offlineSuccess
      })
      
      const destination = role === "manager" ? "/manager" : "/admin"
      console.log('🚀 [REDIRECT] Redirecting to:', destination)
      
      const timeout = setTimeout(() => {
        router.push(destination)
        console.log('✅ [REDIRECT] Navigation triggered to:', destination)
      }, 10)

      return () => clearTimeout(timeout)
    }
  }, [offlineSuccess, role, router])

  const successFallback = role === "manager" ? tManager("successMessage") : "Login successful! Redirecting..."

  const handleRoleChange = (nextRole: Role) => {
    if (nextRole !== role) {
      setRole(nextRole)
    }
  }

  const handleOfflineLogin = async (formData: FormData) => {
    setIsOfflineLoading(true)
    setOfflineError(null)
    setOfflineSuccess(false)

    try {
      const email = (formData.get("email") as string)?.toLowerCase().trim()
      const password = (formData.get("password") as string) || ""
      
      console.log('📴 [OFFLINE LOGIN] Attempting offline login...', { email, role, isOffline })

      if (!email || !password) {
        setOfflineError(tOffline("offlineLoginError"))
        setIsOfflineLoading(false)
        return
      }

      // Admin credentials - match API route
      const ADMIN_EMAIL = "admin@admin.com"
      const ADMIN_PASSWORD = "admin"
      const ADMIN_NAME = "admin"

      // Handle admin login
      if (role === "admin") {
        // Check if it's the default admin credentials
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          let adminUser = await userActions.getLocalByEmail(email)

          // If admin doesn't exist in localDb, create it with status 'w'
          if (!adminUser) {
            const adminId = generateObjectId() // Generate MongoDB-compatible ID
            
            // Save admin to localDb with status 'w' (will sync when online)
            adminUser = await saveManagerToLocalDb(
              {
                id: adminId,
                email: ADMIN_EMAIL,
                name: ADMIN_NAME,
                role: "ADMIN",
              },
              ADMIN_PASSWORD
            )
            
            // If online, trigger full sync (push + pull)
            if (!isOffline && typeof window !== 'undefined') {
              const { fullSync } = await import('@/lib/dexie/syncWorker')
              fullSync().catch(err => console.error('Sync failed:', err))
            }
          } else {
            // Verify password for existing admin
            const isValid = await bcrypt.compare(password, adminUser.password)
            if (!isValid) {
              setOfflineError(tOffline("offlineInvalidCredentials") || tOffline("offlineLoginError"))
              setIsOfflineLoading(false)
              return
            }
          }

          // Login successful
          await setClientUser({
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: "ADMIN",
          })

          setOfflineSuccess(true)
          setIsOfflineLoading(false)
          return
        } else {
          // Try to find admin by email in localDb
          const adminUser = await userActions.getLocalByEmail(email)
          if (adminUser && adminUser.role === "ADMIN") {
            const isValid = await bcrypt.compare(password, adminUser.password)
            if (isValid) {
              await setClientUser({
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
                role: "ADMIN",
              })
              setOfflineSuccess(true)
              setIsOfflineLoading(false)
              return
            }
          }
        }
      }

      // Handle manager login
      if (role === "manager") {
        const managerUser = await userActions.getLocalByEmail(email)

        if (!managerUser || !managerUser.password) {
          setOfflineError(tOffline("offlineLoginError"))
          setIsOfflineLoading(false)
          return
        }

        // Verify password
        const isValid = await bcrypt.compare(password, managerUser.password)
        if (!isValid) {
          setOfflineError(tOffline("offlineInvalidCredentials") || tOffline("offlineLoginError"))
          setIsOfflineLoading(false)
          return
        }

        // Verify it's a manager
        if (managerUser.role !== "MANAGER") {
          setOfflineError(tOffline("offlineLoginError"))
          setIsOfflineLoading(false)
          return
        }

        // Login successful
        await setClientUser({
          id: managerUser.id,
          email: managerUser.email,
          name: managerUser.name,
          role: "MANAGER",
        })

        setOfflineSuccess(true)
        setIsOfflineLoading(false)
        return
      }

      // If we reach here, login failed
      console.log('❌ [OFFLINE LOGIN] Login failed - no matching user found')
      setOfflineError(tOffline("offlineLoginError"))
      setIsOfflineLoading(false)
    } catch (error) {
      console.error("❌ [OFFLINE LOGIN] Offline login failed:", error)
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
      console.error("❌ [OFFLINE LOGIN] Error details:", errorDetails)
      setOfflineError(tOffline("offlineLoginError"))
      setIsOfflineLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    formData.set("role", role)

    // Debug logging
    const email = (formData.get("email") as string)?.toLowerCase().trim()
    const password = formData.get("password") as string
    console.log('🔍 [LOGIN DEBUG]', {
      role,
      email,
      passwordLength: password?.length || 0,
      isOffline,
      navigatorOnline: typeof navigator !== 'undefined' ? navigator.onLine : 'N/A',
      apiUrl: process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' 
        ? `${window.location.origin}/api` 
        : `http://localhost:${process.env.PORT || 6524}/api`),
      timestamp: new Date().toISOString()
    })

    // Handle offline login
    await handleOfflineLogin(formData)

    // if (isOffline) {
    //   await handleOfflineLogin(formData)
    //   return
    // }

    // Handle online login
    startTransition(async () => {
      try {
        const email = (formData.get("email") as string)?.toLowerCase().trim()
        const password = (formData.get("password") as string) || ""
        
        console.log('🌐 [ONLINE LOGIN] Attempting login...', { email, role })
        const result = await loginWithRole(state, formData)
        console.log('✅ [ONLINE LOGIN] Result:', { success: result.success, error: result.error, hasUser: !!result.data?.user })
        
        // If login is successful, save user to localDb with status 'w' (will sync after)
        if (result.success && result.data?.user && email && password) {
          try {
            const userData = result.data.user
            
            // Save to localDb with status 'w' (waiting for sync)
            // The sync will happen after and change status to '1'
            await saveManagerToLocalDb(
              {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role as 'ADMIN' | 'MANAGER',
              },
              password
            )
            
            // Trigger sync for all waiting items (including this user)
            if (typeof window !== 'undefined') {
              const { fullSync } = await import('@/lib/dexie/syncWorker')
              fullSync().catch(err => console.error('Sync failed:', err))
            }
          } catch (error) {
            console.error('Failed to save user to localDb:', error)
            // Continue with login even if saving to localDb fails
          }
        }
        
        setState(result)
      } catch (error) {
        console.error("❌ [ONLINE LOGIN] Login failed:", error)
        const errorDetails = error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error
        console.error("❌ [ONLINE LOGIN] Error details:", errorDetails)
        setState({
          error: { message: "An unexpected error occurred" },
          role: role
        })
      }
    })
  }

  return (
    <div className={cn("bg-background", className)} {...props}>
      <div className=" mx-auto flex-col w-full max-w-6xl flex-1 gap-12 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-8 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="text-center mb-4  text-xl font-bold leading-tight text-foreground ">
              {tHome("title")}
            </h1>
          </div>
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
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-6">
                <form key={role} onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <input type="hidden" name="role" value={role} />

                  {/* Offline mode indicator */}
                  {isOffline && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <WifiOff className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm text-yellow-700 ml-2">
                        {tOffline("offlineMode")}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Online success */}
                  {state?.success && activeStateMatchesRole && !isOffline && (
                    <Alert className="border-green-200 bg-green-50" aria-live="polite">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm text-green-700 ml-2">
                        {state?.data?.message ?? successFallback}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Offline success */}
                  {offlineSuccess && (
                    <Alert className="border-green-200 bg-green-50" aria-live="polite">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm text-green-700 ml-2">
                        {tOffline("offlineSuccessMessage")}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Online error */}
                  {state?.error?.message && activeStateMatchesRole && !isOffline && (
                    <Alert variant="destructive" aria-live="assertive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm ml-2">
                        {state.error.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Offline error */}
                  {offlineError && (
                    <Alert variant="destructive" aria-live="assertive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm ml-2">
                        {offlineError}
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
                          state?.error?.email && activeStateMatchesRole && "border-red-500 focus-visible:ring-red-500"
                        )}
                        required
                        disabled={isPending || isOfflineLoading}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {state?.error?.email && activeStateMatchesRole && !isOffline && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {Array.isArray(state.error.email) ? state.error.email[0] : state.error.email}
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
                          state?.error?.password && activeStateMatchesRole && !isOffline && "border-red-500 focus-visible:ring-red-500"
                        )}
                        required
                        disabled={isPending || isOfflineLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        disabled={isPending || isOfflineLoading}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {state?.error?.password && activeStateMatchesRole && !isOffline && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {Array.isArray(state.error.password) ? state.error.password[0] : state.error.password}
                        </span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium mt-6"
                    disabled={isPending || isOfflineLoading}
                  >
                    {(isPending || isOfflineLoading) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                        {isOffline ? tOffline("offlineLoggingIn") : t("submitting")}
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

          {/* Offline info card */}
          {isOffline && (
            <Card className="w-full max-w-md bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-yellow-100 p-2 flex-shrink-0 mt-1">
                    <WifiOff className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-yellow-900 break-words">
                      {tOffline("offlineInfoTitle")}
                    </p>
                    <p className="text-xs text-yellow-700 leading-relaxed">
                      {tOffline("offlineLoginInfo")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manager info card */}
          {role === "manager" && !isOffline && (
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

          {/* Debug Panel */}
          <Card className="w-full max-w-md border-2 border-dashed border-blue-300 bg-blue-50/50">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <button
                type="button"
                onClick={() => setShowDebug(!showDebug)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-blue-600" />
                  <p className="text-xs sm:text-sm font-medium text-blue-900">
                    Debug Info
                  </p>
                </div>
                {showDebug ? (
                  <ChevronUp className="h-4 w-4 text-blue-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-blue-600" />
                )}
              </button>
              
              {showDebug && (
                <div className="mt-4 space-y-2 text-xs font-mono bg-white/50 p-3 rounded border border-blue-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-blue-700 font-semibold">Role:</span>
                      <span className="ml-2 text-blue-900">{role}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-semibold">Online:</span>
                      <span className={`ml-2 ${isOffline ? 'text-red-600' : 'text-green-600'}`}>
                        {isOffline ? 'No' : 'Yes'}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-semibold">Navigator:</span>
                      <span className={`ml-2 ${typeof navigator !== 'undefined' && navigator.onLine ? 'text-green-600' : 'text-red-600'}`}>
                        {typeof navigator !== 'undefined' ? (navigator.onLine ? 'Online' : 'Offline') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-semibold">Loading:</span>
                      <span className={`ml-2 ${isPending || isOfflineLoading ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {isPending || isOfflineLoading ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-blue-700 font-semibold mb-1">API URL:</div>
                    <div className="text-blue-900 break-all text-[10px]">
                      {process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' 
                        ? `${window.location.origin}/api` 
                        : `http://localhost:${process.env.PORT || 6524}/api`)}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-blue-700 font-semibold mb-1">Login State:</div>
                    <div className="text-blue-900 space-y-1">
                      <div>Success: {state?.success ? '✅' : '❌'}</div>
                      <div>Error: {state?.error?.message || offlineError || 'None'}</div>
                      <div>Offline Success: {offlineSuccess ? '✅' : '❌'}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-blue-700 font-semibold mb-1">Actions:</div>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🔍 [DEBUG] Current State:', {
                            role,
                            isOffline,
                            isPending,
                            isOfflineLoading,
                            state,
                            offlineError,
                            offlineSuccess,
                            navigatorOnline: typeof navigator !== 'undefined' ? navigator.onLine : 'N/A',
                            apiUrl: process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' 
                              ? `${window.location.origin}/api` 
                              : `http://localhost:${process.env.PORT || 6524}/api`)
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800 underline text-[10px]"
                      >
                        Log State to Console
                      </button>
                      <br />
                      <button
                        type="button"
                        onClick={async () => {
                          const users = await userActions.getAll();
                          console.log('👥 [DEBUG] All Users in LocalDb:', users);
                        }}
                        className="text-blue-600 hover:text-blue-800 underline text-[10px]"
                      >
                        Log LocalDb Users
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
