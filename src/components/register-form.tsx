"use client"

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { register } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/authContext"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations('register')
  const [state, action, isPending] = useActionState(register, undefined)
  const { login: setUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state?.data?.user) {
      setUser(state.data.user)
      setTimeout(() => {
        router.push("/admin")
      }, 10)
    }
  }, [state, setUser, router])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <div className="grid gap-6">
              {/* General error message */}
              {state?.error?.message && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {state.error.message}
                </div>
              )}

              <div className="grid gap-3">
                <Label htmlFor="username">{t('username.label')}</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t('username.placeholder')}
                  required
                />
                {state?.error?.username && (
                  <p className="text-red-500 text-sm">
                    {state.error.username}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">{t('email.label')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('email.placeholder')}
                  required
                />
                {state?.error?.email && (
                  <p className="text-red-500 text-sm">
                    {state.error.email}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">{t('password.label')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                />
                {state?.error?.password && (
                  <p className="text-red-500 text-sm">
                    {state.error.password}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">{t('confirmPassword.label')}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                />
                {state?.error?.confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {state.error.confirmPassword}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t('submitting') : t('submit')}
              </Button>
            </div>

            <div className="text-center text-sm mt-4">
              {t('alreadyHaveAccount')}{" "}
              <Link href="/login" className="underline underline-offset-4">
                {t('login')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
