"use client";

import { useAuth } from "@/context/authContext";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ModeToggle } from "@/components/ModeToggle";
import { Phone, MessageCircle } from "lucide-react";
import Image from "next/image";
import { PublicRegistrationDialog } from "@/components/PublicRegistrationDialog";

interface CenterContent {
  id: string;
  name: string;
  homeTitle?: string | null;
  homeSubtitle?: string | null;
  homeBadge?: string | null;
  homeDescription?: string | null;
  homeCtaText?: string | null;
  homePhone?: string | null;
  homeAddress?: string | null;
  publicRegistrationEnabled?: boolean;
}

function HomePageContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const t = useTranslations("homePage");
  const [mounted, setMounted] = useState(false);
  const [center, setCenter] = useState<CenterContent | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerType, setRegisterType] = useState<"student" | "teacher">(
    "student",
  );

  // Check URL parameter for registration type
  useEffect(() => {
    const regType = searchParams.get("register");
    if (regType === "student" || regType === "teacher") {
      setRegisterType(regType);
      setShowRegisterDialog(true);
    }
  }, [searchParams]);

  // Fetch center content on mount
  useEffect(() => {
    const fetchCenter = async () => {
      try {
        const response = await fetch("/api/public/center");
        if (response.ok) {
          const data = await response.json();
          setCenter(data);
        }
      } catch (error) {
        console.error("Failed to fetch center:", error);
      }
    };
    fetchCenter();
  }, []);

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
          <p className="mt-4 text-blue-600 dark:text-blue-400">...</p>
        </div>
      </div>
    );
  }

  // Use center content if available, otherwise use defaults
  const content = {
    title: center?.homeTitle || "الاولى اعدادي",
    subtitle: center?.homeSubtitle || "FRANCAIS - MATH",
    badge: center?.homeBadge || "التسجيل مفتوح",
    description:
      center?.homeDescription ||
      "مركز دروس الدعم و التقوية بمدينة  يقدم لكم عرض للاولى اعدادي بأثمنة جد مناسبة",
    ctaText: center?.homeCtaText || "سارعوا للتسجيل",
    phone: center?.homePhone || "0880275000",
    address: center?.homeAddress || "روض عبلة حي وريدة ",
  };

  const handleRegisterClick = () => {
    if (center && center.publicRegistrationEnabled !== false) {
      setRegisterType("student");
      setShowRegisterDialog(true);
    }
  };

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
        {/* Right Content (Text) */}
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
              {/* Main Title */}
              <h1 className="text-5xl md:text-7xl font-bold text-[#1a237e] tracking-tight">
                {content.title}
              </h1>
              {/* Subtitle */}
              <h2 className="text-3xl md:text-5xl font-bold text-[#4c8bf5] uppercase tracking-wider">
                {content.subtitle}
              </h2>
            </div>

            {/* Registration Open Badge */}
            <div className="inline-block px-8 py-2 rounded-full border-2 border-[#1a237e] bg-blue-50/50">
              <span className="text-xl md:text-2xl font-bold text-[#1a237e]">
                {content.badge}
              </span>
            </div>

            {/* Description */}
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border-l-4 border-[#1a237e] w-full shadow-sm">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-medium">
                {content.description}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
              {center ? (
                <Button
                  onClick={handleRegisterClick}
                  className="flex-1 w-full h-14 bg-orange-400 hover:bg-orange-500 text-black text-xl font-bold rounded-full shadow-lg transform transition hover:scale-105"
                  disabled={center.publicRegistrationEnabled === false}
                >
                  {content.ctaText}
                </Button>
              ) : (
                <Link href={`/${locale}/register`} className="flex-1">
                  <Button className="w-full h-14 bg-orange-400 hover:bg-orange-500 text-black text-xl font-bold rounded-full shadow-lg transform transition hover:scale-105">
                    {content.ctaText}
                  </Button>
                </Link>
              )}

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
            <div className="w-full h-full max-h-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden relative transform -rotate-2 border-4 border-white">
              <Image
                src="/hero-classroom-abstract.png"
                fill
                className="object-cover"
                alt="Students in a modern classroom environment"
                priority
              />
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
            <span className="text-xl font-mono dir-ltr">{content.phone}</span>
            <MessageCircle className="w-6 h-6" />
          </div>

          <div className="text-sm font-light opacity-90">{content.address}</div>
        </div>
      </div>

      {/* Public Registration Dialog */}
      <PublicRegistrationDialog
        open={showRegisterDialog}
        onOpenChange={setShowRegisterDialog}
        type={registerType}
        centerId={center?.id}
      />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-blue-600 dark:text-blue-400">...</p>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
