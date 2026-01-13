"use client";

import { useAuth } from "@/context/authContext";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ModeToggle } from "@/components/ModeToggle";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("homePage");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect after component has mounted and auth is loaded
    if (!mounted || isLoading) return;

    if (user?.role === "ADMIN") {
      router.push(`/${locale}/admin`);
      return;
    }

    if (user?.role === "MANAGER") {
      router.push(`/${locale}/manager`);
      return;
    }
  }, [user, isLoading, mounted, router, locale]);

  // Show loading state while checking authentication
  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-400 to-blue-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-blue-400 to-blue-600">
      <div className="w-[85%] sm:w-full max-w-md md:max-w-lg text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
          {t("title")}
        </h1>

        <p className="mt-3 text-sm sm:text-base text-white/80 px-2">
          {t("description")}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link href={`/${locale}/login`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto px-8 py-3 bg-blue-800 text-white hover:bg-blue-900 text-base font-medium">
              {t("ownerDashboard")}
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
      </div>
    </main>
  );
}

