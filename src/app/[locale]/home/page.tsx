"use client";

import { PublicRegistrationDialog } from "@/components/PublicRegistrationDialog";
import { PublicOfferings } from "@/components/PublicOfferings";
import { useAuth } from "@/context/authContext";
import { useLocale, useTranslations } from "next-intl";
import Lottie from "lottie-react";
import studentAnimation from "../../Student-transparent.json";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";

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

  const isRtl = locale === "ar";

  useEffect(() => {
    const regType = searchParams.get("register");
    if (regType === "student" || regType === "teacher") {
      setRegisterType(regType);
      setShowRegisterDialog(true);
    }
  }, [searchParams]);

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

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const content = {
    title: center?.homeTitle || "مركز دروس الدعم و التقوية",
    subtitle: center?.homeSubtitle || "جميع المواد",
    badge: center?.homeBadge || "التسجيل مفتوح",
    description:
      center?.homeDescription ||
      "مركز دروس الدعم و التقوية يقدم لكم عرض بأثمنة جد مناسبة",
    ctaText: center?.homeCtaText || "سارعوا للتسجيل",
    phone: center?.homePhone || "0880275000",
    address: center?.homeAddress || "حي وريدة",
  };

  const handleRegisterClick = (type: "student" | "teacher" = "student") => {
    if (center && center.publicRegistrationEnabled !== false) {
      setRegisterType(type);
      setShowRegisterDialog(true);
    }
  };

  const dashboardLink = user
    ? user.role === "ADMIN"
      ? `/${locale}/admin`
      : `/${locale}/manager`
    : `/${locale}/login`;

  return (
    <main
      className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 selection:bg-indigo-500/30"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Modern Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Animated Gradient Orbs */}
        <div className="absolute -top-[40%] -right-[10%] w-[80vw] h-[80vw] rounded-full bg-indigo-400/20 mix-blend-multiply filter blur-[100px] animate-pulse-slow"></div>
        <div
          className="absolute top-[20%] -left-[20%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 mix-blend-multiply filter blur-[120px] animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-violet-400/20 mix-blend-multiply filter blur-[100px] animate-pulse-slow"
          style={{ animationDelay: "4s" }}
        ></div>
        {/* Subtle grid texture overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
      </div>

      {/* Top Bar Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-transparent">
        {/* Empty div for flex layout spacing */}
        <div></div>

        <button
          onClick={() => router.push(dashboardLink)}
          className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full overflow-hidden bg-white/40 backdrop-blur-md border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:bg-white/60 transition-all duration-300 ease-out active:scale-95"
        >
          <span className="relative z-10 font-semibold text-slate-700 tracking-wide text-sm">
            {user ? t("dashboard") : t("ownerDashboard")}
          </span>
          <div className="relative z-10 text-slate-700 group-hover:translate-x-1 transition-transform duration-300">
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </div>
        </button>
      </nav>

      {/* Main Hero Content */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 container mx-auto px-6 pt-24 pb-32">
        <div className="flex-1 flex justify-center lg:items-center">
          <div
            className="w-full max-w-xl flex flex-col mt-4 lg:mt-0 items-center lg:items-start text-center lg:text-start"
            style={{
              alignItems: isRtl ? "flex-start" : "flex-end",
              textAlign: isRtl ? "right" : "left",
            }}
          >
            {/* Status Badge */}
            {content.badge && (
              <div className="animate-fade-in-up md:hover:scale-105 transition-transform duration-300 mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-200/50 bg-white/50 backdrop-blur-md shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-bold bg-linear-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent transform translate-y-px">
                  {content.badge}
                </span>
              </div>
            )}

            {/* Typography Section */}
            <div
              className="space-y-4 w-full animate-fade-in-up"
              style={{ animationDelay: "100ms" }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-800 tracking-tight leading-[1.1]">
                {content.title}
              </h1>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-linear-to-br from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent pb-2 uppercase tracking-wide">
                {content.subtitle}
              </h2>
            </div>

            {/* Glassmorphic Description Card */}
            <div
              className="animate-fade-in-up w-full mt-8"
              style={{ animationDelay: "200ms" }}
            >
              <div className="relative p-px rounded-2xl bg-linear-to-b from-white/60 to-white/10 overflow-hidden group">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl transition-all duration-500 group-hover:bg-white/50"></div>

                {/* Decorative Side Blur */}
                <div
                  className={`absolute top-0 bottom-0 w-2 ${isRtl ? "right-0" : "left-0"} bg-linear-to-b from-indigo-500 to-blue-500`}
                ></div>

                <div className="relative p-6 sm:p-8">
                  <p className="text-lg sm:text-xl text-slate-700 leading-relaxed font-medium">
                    {content.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action Register Button (If enabled) */}
            {center?.publicRegistrationEnabled !== false && (
              <div
                className="animate-fade-in-up mt-10"
                style={{ animationDelay: "300ms" }}
              >
                <button
                  onClick={() => handleRegisterClick("student")}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl shadow-[0_8px_30px_rgb(79,70,229,0.3)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(79,70,229,0.4)] hover:-translate-y-1 active:translate-y-0 active:scale-95"
                >
                  <span className="transform translate-y-px">
                    {content.ctaText}
                  </span>
                  <div className="bg-white/20 p-1.5 rounded-full group-hover:scale-110 transition-transform duration-300">
                    {isRtl ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hero Image / Animation */}
        <div
          className="flex-1 relative flex items-center justify-center mt-12 lg:mt-0 animate-fade-in-up"
          style={{ animationDelay: "400ms" }}
        >
          <div className="relative w-full max-w-[400px] lg:max-w-[550px] aspect-square rounded-[3rem] overflow-hidden drop-shadow-2xl">
            {/* Soft Glow behind animation */}
            <div className="absolute inset-10 bg-indigo-500/20 blur-3xl rounded-full"></div>
            <Lottie
              animationData={studentAnimation}
              loop={true}
              autoplay={true}
              className="w-full h-full object-contain relative z-10"
            />
          </div>
        </div>
      </div>

      {/* Public Offerings (Subjects, Grades, Teachers) */}
      <PublicOfferings
        centerId={center?.id}
        onRegisterClick={handleRegisterClick}
      />

      {/* Floating Glassmorphic Contact Dock */}
      <div
        className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 animate-fade-in-up"
        style={{ animationDelay: "500ms" }}
      >
        <div className="flex items-center gap-6 px-6 sm:px-8 py-3.5 bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] rounded-full hover:bg-white/80 transition-colors duration-300">
          {/* WhatsApp Button */}
          {content.phone && (
            <button
              onClick={() =>
                window.open(
                  `https://wa.me/${content.phone?.replace(/\D/g, "")}`,
                  "_blank",
                )
              }
              className="group flex flex-row-reverse items-center gap-3 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <div className="bg-[#25D366]/10 p-2.5 rounded-full group-hover:bg-[#25D366]/20 transition-colors">
                <svg fill="#25D366" viewBox="0 0 32 32" className="w-6 h-6">
                  <path d="M26.576 5.363c-2.69-2.69-6.406-4.354-10.511-4.354-8.209 0-14.865 6.655-14.865 14.865 0 2.732 0.737 5.291 2.022 7.491l-0.038-0.070-2.109 7.702 7.879-2.067c2.051 1.139 4.498 1.809 7.102 1.809h0.006c8.209-0.003 14.862-6.659 14.862-14.868 0-4.103-1.662-7.817-4.349-10.507l0 0zM16.062 28.228h-0.005c-0 0-0.001 0-0.001 0-2.319 0-4.489-0.64-6.342-1.753l0.056 0.031-0.451-0.267-4.675 1.227 1.247-4.559-0.294-0.467c-1.185-1.862-1.889-4.131-1.889-6.565 0-6.822 5.531-12.353 12.353-12.353s12.353 5.531 12.353 12.353c0 6.822-5.53 12.353-12.353 12.353h-0zM22.838 18.977c-0.371-0.186-2.197-1.083-2.537-1.208-0.341-0.124-0.589-0.185-0.837 0.187-0.246 0.371-0.958 1.207-1.175 1.455-0.216 0.249-0.434 0.279-0.805 0.094-1.15-0.466-2.138-1.087-2.997-1.852l0.010 0.009c-0.799-0.74-1.484-1.587-2.037-2.521l-0.028-0.052c-0.216-0.371-0.023-0.572 0.162-0.757 0.167-0.166 0.372-0.434 0.557-0.65 0.146-0.179 0.271-0.384 0.366-0.604l0.006-0.017c0.043-0.087 0.068-0.188 0.068-0.296 0-0.131-0.037-0.253-0.101-0.357l0.002 0.003c-0.094-0.186-0.836-2.014-1.145-2.758-0.302-0.724-0.609-0.625-0.836-0.637-0.216-0.010-0.464-0.012-0.712-0.012-0.395 0.010-0.746 0.188-0.988 0.463l-0.001 0.002c-0.802 0.761-1.3 1.834-1.3 3.023 0 0.026 0 0.053 0.001 0.079l-0-0.004c0.131 1.467 0.681 2.784 1.527 3.857l-0.012-0.015c1.604 2.379 3.742 4.282 6.251 5.564l0.094 0.043c0.548 0.248 1.25 0.513 1.968 0.74l0.149 0.041c0.442 0.14 0.951 0.221 1.479 0.221 0.303 0 0.601-0.027 0.889-0.078l-0.031 0.004c1.069-0.223 1.956-0.868 2.497-1.749l0.009-0.017c0.165-0.366 0.261-0.793 0.261-1.242 0-0.185-0.016-0.366-0.047-0.542l0.003 0.019c-0.092-0.155-0.34-0.247-0.712-0.434z"></path>
                </svg>
              </div>
              <span className="text-xl font-bold font-mono text-slate-700 tracking-wider transform translate-y-px">
                {content.phone}
              </span>
            </button>
          )}

          {/* Divider */}
          {content.phone && content.address && (
            <div className="w-[1.5px] h-10 bg-slate-200"></div>
          )}

          {/* Location Badge */}
          {content.address && (
            <div className="hidden sm:flex items-center gap-2 group cursor-default">
              <div className="bg-indigo-100 p-2.5 rounded-full text-indigo-600 transition-colors group-hover:bg-indigo-200 group-hover:text-indigo-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <span className="text-[15px] font-bold text-slate-600 whitespace-nowrap transform translate-y-px">
                {content.address}
              </span>
            </div>
          )}
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
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
