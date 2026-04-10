"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, WifiOff, ServerOff, Database, ArrowRight, ArrowLeft } from "lucide-react";
import LanguageSwitcher from "@/components/freeinUse/LanguageSwitcher";
import { ModeToggle } from "@/components/freeinUse/ModeToggle";
import { userActions } from "@/freelib/dexie/freedexieaction";
import { Role } from "@/freelib/dexie/dbSchema";

export default function FreeVersionIntro() {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    userActions
      .getAll()
      .then((users) => {
        const hasAdminUser = users.some((u) => u.role === Role.ADMIN);
        if (hasAdminUser) {
          router.push(`/${locale}/free/admin`);
        } else {
          setIsChecking(false);
        }
      })
      .catch((error) => {
        console.error("Dexie check failed:", error);
        setIsChecking(false);
      });
  }, [locale, router]);

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
          title: "No Server",
          desc: "No backend databases, no subscriptions, and no complicated cloud setups.",
          icon: <ServerOff className="w-6 h-6 text-rose-500" />,
          color: "bg-rose-500/10 border-rose-500/20",
        },
        {
          title: "Absolute Privacy",
          desc: "We do not have access to your local data. You are in complete offline control.",
          icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
          color: "bg-blue-500/10 border-blue-500/20",
        },
      ],
      btn: "Go to Login",
      footer: "Basically, this is the free version of the current app.",
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
          title: "بدون خوادم",
          desc: "لا توجد قواعد بيانات خلفية، ولا اشتراكات، ولا إعدادات سحابية معقدة.",
          icon: <ServerOff className="w-6 h-6 text-rose-500" />,
          color: "bg-rose-500/10 border-rose-500/20",
        },
        {
          title: "خصوصية مطلقة",
          desc: "ليس لدينا أي وصول إلى بياناتك المحلية. أنت تتحكم تحكماً كاملاً.",
          icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
          color: "bg-blue-500/10 border-blue-500/20",
        },
      ],
      btn: "الذهاب لتسجيل الدخول",
      footer: "ببساطة، هذه هي النسخة المجانية من التطبيق الحالي.",
    },
  };

  const t = locale === "ar" ? content.ar : content.en;

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
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/10 mix-blend-multiply blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-4xl relative z-10 animate-fade-in-up">
        {/* Header Controls */}
        <div className="flex justify-between items-center w-full mb-6 px-2">
          <div className="flex items-center gap-3">
            <ModeToggle />
            <LanguageSwitcher />
          </div>
          <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
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
                  <p className="text-sm italic text-muted-foreground mb-8">
                    {t.footer}
                  </p>
                  
                  <Button 
                    onClick={handleStart}
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-[0_8px_30px_rgb(79,70,229,0.2)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:-translate-y-0.5 transition-all duration-300 bg-indigo-600 hover:bg-indigo-700 text-white group"
                  >
                    <span>{t.btn}</span>
                    <div className="bg-white/20 p-1.5 rounded-full ml-3 group-hover:scale-110 transition-transform duration-300 rtl:mr-3 rtl:ml-0">
                      {isRtl ? <ArrowLeft size={18} strokeWidth={3} /> : <ArrowRight size={18} strokeWidth={3} />}
                    </div>
                  </Button>
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
                    <div className={`shrink-0 p-3 rounded-xl border ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
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
    </div>
  );
}
