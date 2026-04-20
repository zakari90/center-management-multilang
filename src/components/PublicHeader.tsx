"use client";

import { useAuth } from "@/context/authContext";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Home, LogIn, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import LanguageSwitcher from "./LanguageSwitcher";
import { ModeToggle } from "./ModeToggle";
import { Separator } from "./ui/separator";

interface PublicHeaderProps {
  institution?: string;
}

export function PublicHeader({ institution }: PublicHeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("NavUser"); // Reuse translations for login/logout if possible

  const isArabic = locale === "ar";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side: Institution & Home */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}`)}
            title="Home"
            className="rounded-full"
          >
            <Home className="h-5 w-5" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-bold bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent truncate max-w-[200px]">
            {institution || (isArabic ? "مركزنا" : "Our Center")}
          </h1>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ModeToggle />
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {isAuthenticated ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push(`/${locale}/pro/${user?.role?.toLowerCase()}`)}
              className="rounded-full gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isArabic ? "لوحة التحكم" : "Dashboard"}
              </span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push(`/${locale}/pro/login`)}
              className="rounded-full gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isArabic ? "تسجيل الدخول" : "Login"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
