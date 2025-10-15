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
  const { login: setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state?.success && state?.data?.user) {
      setUser(state.data.user);
      setTimeout(() => {
        router.push("/admin");
      }, 10);
    }
  }, [state, setUser, router]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">{t('username.label')}</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t('username.placeholder')}
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">{t('email.label')}</Label>
                <Input
                  id="email"
                  name="email"
                  placeholder={t('email.placeholder')}
                  required
                />
                {state?.error?.email && (
                  <p className="text-red-500 text-sm mt-1">
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
              </div>

              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">{t('confirmPassword.label')}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                />
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

      {/* <div className="text-muted-foreground text-center text-xs text-balance">
        {t('terms')}{" "}
        <a href="#" className="underline underline-offset-4">{t('termsOfService')}</a> {t('and')} <a href="#" className="underline underline-offset-4">{t('privacyPolicy')}</a>.
      </div> */}
    </div>
  )
}