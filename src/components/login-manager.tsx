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
import { SendToBackIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"

export function LoginManager({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations('login')
  const tManager = useTranslations('managerLogin')
  const [state, action, isPending] = useActionState(loginManager, undefined)

  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state?.success && state?.data?.user) {
      login(state.data.user);
      setTimeout(() => {
        router.push("/manager");
      }, 10);
    }
  }, [state, login, router]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{tManager('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <div className="grid gap-6">
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
                  <p className="text-red-500 text-sm">{state.error.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">{t('password.label')}</Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('password.placeholder')}
                  required
                />
                {state?.error?.password && (
                  <p className="text-red-500 text-sm">{state.error.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t('submitting') : t('submit')}
              </Button>
            </div>
            <div className="text-center text-sm mt-4">
              <Link href="/" className="underline underline-offset-4">
                  <SendToBackIcon/>

              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}