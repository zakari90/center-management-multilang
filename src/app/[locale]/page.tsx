"use client";

import { useAuth } from "@/context/authContext";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ModeToggle } from "@/components/ModeToggle";
import { Phone, MessageCircle } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-600 dark:text-blue-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col bg-white overflow-hidden relative"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Top Navigation / Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <LanguageSwitcher />
        <ModeToggle />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Right Content (Text) - Actually Left in RTL, but flex logic depends on dir. 
            In RTL, this is first, so it appears on Right. 
            In LTR, it appears on Left. 
            The design has Text on Right and Image on Left. 
            To force Text Right / Image Left regardless of Language (if that's desired for the flyer look), we might need order classes or explicit row-reverse in LTR.
            But assuming matching the user's language preference is better.
        */}
        <div className="flex-1 z-10 flex items-center justify-center p-6 pt-20 lg:pt-6">
          <div
            className="max-w-xl w-full flex flex-col items-center lg:items-start space-y-6 text-center lg:text-start"
            style={{
              alignItems: locale === "ar" ? "flex-start" : "flex-end",
              textAlign: locale === "ar" ? "right" : "left",
            }}
          >
            {/* Title Section */}
            <div className="space-y-2 w-full">
              {/* 1st Year Middle School */}
              <h1 className="text-5xl md:text-7xl font-bold text-[#1a237e] tracking-tight">
                الاولى اعدادي
              </h1>
              {/* FRANCAIS - MATH */}
              <h2 className="text-3xl md:text-5xl font-bold text-[#4c8bf5] uppercase tracking-wider">
                FRANCAIS - MATH
              </h2>
            </div>

            {/* Registration Open Badge */}
            <div className="inline-block px-8 py-2 rounded-full border-2 border-[#1a237e] bg-blue-50/50">
              <span className="text-xl md:text-2xl font-bold text-[#1a237e]">
                التسجيل مفتوح
              </span>
            </div>

            {/* Description */}
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border-l-4 border-[#1a237e] w-full shadow-sm">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-medium">
                مركز دروس الدعم و التقوية بمدينة تازة يقدم لكم عرض للاولى اعدادي
                بأثمنة جد مناسبة
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
              <Link href={`/${locale}/register`} className="flex-1">
                <Button className="w-full h-14 bg-orange-400 hover:bg-orange-500 text-black text-xl font-bold rounded-full shadow-lg transform transition hover:scale-105">
                  سارعوا للتسجيل
                </Button>
              </Link>

              <div className="flex items-center justify-center h-14 w-full sm:w-auto px-6 bg-blue-600 text-white rounded-full font-bold text-lg shadow-md">
                الان ممكن
              </div>
            </div>

            {/* Owner Login Link (Subtle) */}
            <div className="pt-8">
              <Link
                href={`/${locale}/login`}
                className="text-sm text-gray-500 hover:underline"
              >
                {t("ownerDashboard")}
              </Link>
            </div>
          </div>
        </div>

        {/* Left Content (Image & Shapes) */}
        <div className="hidden lg:block lg:w-1/2 relative min-h-[600px]">
          {/* Orange Curve Background */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] rounded-[50%] bg-[#FFB74D] z-0"></div>
          </div>

          {/* Image Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center z-10 p-12">
            <div className="w-full h-full max-h-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden relative transform rotate-[-2deg] border-4 border-white">
              {/* Placeholder Content */}
              <div className="w-full h-full bg-slate-200 flex items-center justify-center flex-col text-slate-400">
                <svg
                  className="w-24 h-24 mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xl font-medium">Classroom Image</span>
              </div>
              {/* If user provides a real image later, replace the inner div above with:
                      <Image src="/path/to/image.jpg" fill className="object-cover" alt="Classroom" />
                  */}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Contact Bar */}
      <div className="bg-[#5B7CFD] text-white py-4 px-6 fixed bottom-0 left-0 right-0 lg:static z-20">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Phone className="w-6 h-6 fill-current" />
            <MessageCircle className="w-6 h-6" />
            <span className="text-lg font-bold">للتواصل معنا</span>
          </div>

          <div className="flex items-center gap-4 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
            <span className="text-xl font-mono dir-ltr">0770275193</span>
            <MessageCircle className="w-6 h-6" />
          </div>

          <div className="text-sm font-light opacity-90">
            روض عبلة حي وريدة تازة
          </div>
        </div>
      </div>
    </main>
  );
}
