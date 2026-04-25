"use client";

import Lottie from "lottie-react";
import starAnimation from "../../../../public/Star.json";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAutoBackup } from "@/hooks/useAutoBackup";
import { performFreeAutoBackup } from "@/utils/backupUtils";

import { Card } from "@/components/ui/card";
import {
  WifiOff,
  Database,
  ArrowRight,
  ArrowLeft,
  History,
  Star,
} from "lucide-react";

import LanguageSwitcher from "@/components/freeinUse/LanguageSwitcher";
import { ModeToggle } from "@/components/freeinUse/ModeToggle";
import { isDatabaseCreated } from "@/freelib/dexie/dbSchema";
import PublicFooter from "@/components/PublicFooter";

export default function FreeVersionIntro() {
  const locale = useLocale();
  const t_shared = useTranslations("AllTablesViewer");
  const router = useRouter();

  const isRtl = locale === "ar";
  const [isChecking, setIsChecking] = useState(true);
  const [dbExists, setDbExists] = useState(false);

  useEffect(() => {
    // Check if the database even exists before trying to query it.
    // This prevents creating an empty IndexedDB for first-time visitors.
    isDatabaseCreated()
      .then(async (exists) => {
        if (exists) {
          setDbExists(true);
          // DB exists — dynamically import the heavy Dexie actions only when needed
          const { userActions } =
            await import("@/freelib/dexie/freedexieaction");
          const { Role } = await import("@/freelib/dexie/dbSchema");
          const users = await userActions.getAll();
          const hasAdminUser = users.some((u) => u.role === Role.ADMIN);
          if (hasAdminUser) {
            router.push(`/${locale}/free/admin`);
            return;
          }
        }
        // No DB or no admin — show the intro page
        setIsChecking(false);
      })
      .catch((error) => {
        console.error("Dexie check failed:", error);
        setIsChecking(false);
      });
  }, [locale, router]);

  const handleAutoSave = async () => {
    try {
      await performFreeAutoBackup();
      toast.success(t_shared("autoSave.savedToast"));
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  useAutoBackup(dbExists ? handleAutoSave : () => Promise.resolve());

  const handleStart = () => {
    router.push(`/${locale}/free/login`);
  };

  const content = {
    en: {
      title: "Free Local Version",
      subtitle: "Full control, zero servers.",
      description:
        "This is the free, standalone version of the application. It provides essential management features designed for total privacy and seamless offline capability.",
      features: [
        {
          title: "Local Storage Only",
          desc: "All your data stays exclusively on this device. Nothing leaves your browser.",
          icon: <Database className="w-6 h-6 text-indigo-500" />,
          color: "bg-indigo-500/10 border-indigo-500/20",
        },
        {
          title: "No Internet Needed",
          desc: "After the initial page caching, the entire app works 100% offline.",
          icon: <WifiOff className="w-6 h-6 text-emerald-500" />,
          color: "bg-emerald-500/10 border-emerald-500/20",
        },
        {
          title: "Monthly Auto Backup",
          desc: "Automatically save your database to your device on the 1st of every month at 12:00.",
          icon: <History className="w-6 h-6 text-purple-500" />,
          color: "bg-purple-500/10 border-purple-500/20",
        },
      ],

      btn: "Go to Login",
      bookmarkInfo:
        "For easy access, add this page to your favorites or bookmarks.",
    },

    ar: {
      title: "النسخة المجانية المحلية",
      subtitle: "تحكم كامل، بدون خوادم.",
      description:
        "هذه هي النسخة المجانية المستقلة من التطبيق. توفر ميزات الإدارة الأساسية المصممة للخصوصية التامة والعمل السلس بدون إنترنت.",
      features: [
        {
          title: "تخزين محلي فقط",
          desc: "جميع بياناتك تبقى حصرياً على هذا الجهاز. لا يوجد شيء يغادر متصفحك.",
          icon: <Database className="w-6 h-6 text-indigo-500" />,
          color: "bg-indigo-500/10 border-indigo-500/20",
        },
        {
          title: "لا حاجة للإنترنت",
          desc: "بعد التحميل الأولي وتحزيم الصفحات، التطبيق يعمل 100٪ بدون اتصال.",
          icon: <WifiOff className="w-6 h-6 text-emerald-500" />,
          color: "bg-emerald-500/10 border-emerald-500/20",
        },
        {
          title: "نسخ احتياطي تلقائي شهري",
          desc: "يتم حفظ بياناتك تلقائياً على جهازك كل شهر.",
          icon: <History className="w-6 h-6 text-purple-500" />,
          color: "bg-purple-500/10 border-purple-500/20",
        },
      ],

      btn: "الذهاب لتسجيل الدخول",
      bookmarkInfo:
        "لسهولة الوصول، أضف هذه الصفحة إلى المفضلة أو العلامات المرجعية.",
    },

    fr: {
      title: "Version Locale Gratuite",
      subtitle: "Contrôle total, zéro serveur.",
      description:
        "Il s'agit de la version gratuite et autonome de l'application. Elle offre des fonctionnalités de gestion essentielles conçues pour une confidentialité totale et une capacité hors ligne fluide.",
      features: [
        {
          title: "Stockage Local Uniquement",
          desc: "Toutes vos données restent exclusivement sur cet appareil. Rien ne quitte votre navigateur.",
          icon: <Database className="w-6 h-6 text-indigo-500" />,
          color: "bg-indigo-500/10 border-indigo-500/20",
        },
        {
          title: "Pas d'Internet Requis",
          desc: "Après la mise en cache initiale de la page, toute l'application fonctionne à 100 % hors ligne.",
          icon: <WifiOff className="w-6 h-6 text-emerald-500" />,
          color: "bg-emerald-500/10 border-emerald-500/20",
        },
        {
          title: "Sauvegarde Auto Mensuelle",
          desc: "Sauvegardez automatiquement votre base de données sur votre appareil le 1er de chaque mois à 12h00.",
          icon: <History className="w-6 h-6 text-purple-500" />,
          color: "bg-purple-500/10 border-purple-500/20",
        },
      ],

      btn: "Aller à la connexion",
      bookmarkInfo:
        "Pour un accès facile, ajoutez cette page à vos favoris ou marque-pages.",
    },
  };

  const t =
    locale === "ar" ? content.ar : locale === "fr" ? content.fr : content.en;

  if (isChecking) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-linear-to-br from-indigo-50/50 via-white to-blue-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-svh w-full flex-col items-center justify-center bg-linear-to-br from-indigo-50/50 via-white to-blue-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-8"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 mix-blend-multiply blur-[100px] animate-pulse"></div>
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/10 mix-blend-multiply blur-[100px] animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="w-full max-w-4xl relative z-10 animate-fade-in-up">
        {/* Header Controls */}
        <div className="flex justify-between items-center w-full mb-6 px-2">
          <div className="flex items-center gap-3">
            <ModeToggle />
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            <Lottie
              animationData={starAnimation}
              loop={true}
              autoplay={true}
              className="w-5 h-5"
            />
            v1.0 Local Edition
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-border/40 shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 overflow-hidden ring-1 ring-white/20 dark:ring-white/10">
          <div className="h-2 w-full bg-linear-to-r from-indigo-500 via-blue-500 to-indigo-500"></div>

          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left Side: Title & Description */}
            <div className="p-8 sm:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-e border-border/50">
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                    {t.title}
                  </h1>
                  <p className="text-xl font-medium bg-linear-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                    {t.subtitle}
                  </p>
                </div>

                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t.description}
                </p>

                <div className="pt-4 border-t border-border/50">
                  <Button
                    onClick={handleStart}
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-[0_8px_30px_rgb(79,70,229,0.2)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:-translate-y-0.5 transition-all duration-300 bg-indigo-600 hover:bg-indigo-700 text-white group"
                  >
                    <span>{t.btn}</span>
                    <div className="bg-white/20 p-1.5 rounded-full ml-3 group-hover:scale-110 transition-transform duration-300 rtl:mr-3 rtl:ml-0">
                      {isRtl ? (
                        <ArrowLeft size={18} strokeWidth={3} />
                      ) : (
                        <ArrowRight size={18} strokeWidth={3} />
                      )}
                    </div>
                  </Button>

                  <div className="mt-6 flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium animate-pulse">
                    <Star size={14} className="fill-current" />
                    <span>{t.bookmarkInfo}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Features Grid */}
            <div className="p-8 sm:p-12 bg-slate-50/50 dark:bg-slate-950/50 flex items-center">
              <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4 w-full">
                {t.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-5 rounded-2xl border border-border/40 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`shrink-0 p-3 xl:rounded-xl xl:border xl:${feature.color} group-hover:scale-110 transition-transform duration-300`}
                    >
                      {feature.icon}
                    </div>
                    <div className="space-y-1.5 mt-0.5">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-none">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
