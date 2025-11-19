"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/context/authContext"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { ModeToggle } from "@/components/ModeToggle"
import { useEffect } from "react"

export default function HomePage() {
  const t = useTranslations("homePage")
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "ADMIN") {
        router.push("/admin")
      } else if (user.role === "MANAGER") {
        router.push("/manager")
      }
    }
  }, [user, isLoading, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl text-center">
          <p>Loading...</p>
        </div>
      </main>
    )
  }

  // Don't render if user is authenticated (redirect will happen)
  if (user) {
    return null
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-800">
          {t("title")}
        </h1>

        <p className="mt-3 text-base sm:text-lg text-blue-800/70">
          {t("description")}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link href="/login" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white hover:bg-blue-700">
              {t("ownerDashboard")}
            </Button>
          </Link>

          <Link href="/managerLogin" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white hover:bg-green-700">
              {t("managerDashboard")}
            </Button>
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <ModeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </main>
  )
}
