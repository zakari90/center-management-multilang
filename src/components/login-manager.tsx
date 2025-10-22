"use client"

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
import { loginManager } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { Home } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"

export function LoginManager({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations('login')
  const [state, action, isPending] = useActionState(loginManager, undefined)
  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state?.data?.user) {
      login(state.data.user)
      setTimeout(() => {
        router.push("/manager")
      }, 10)
    }
  }, [state, login, router])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <div className="grid gap-6">
              {state?.error?.message && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {state.error.message}
                </div>
              )}

              <div className="grid gap-3">
                <Label htmlFor="email">{t('email.label')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('email.placeholder')}
                  required
                  autoComplete="email"
                />
                {state?.error?.email && (
                  <p className="text-red-500 text-sm">{state.error.email}</p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">{t('password.label')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('password.placeholder')}
                  required
                  autoComplete="current-password"
                />
                {state?.error?.password && (
                  <p className="text-red-500 text-sm">{state.error.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t('submitting') : t('submit')}
              </Button>
            </div>

            <div className="text-center text-sm mt-4">
              <Link href="/" className="inline-flex items-center gap-2 underline underline-offset-4">
                <Home className="h-6 w-6" />
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
