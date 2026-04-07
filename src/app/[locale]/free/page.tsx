"use client";

import { useAuth } from "@/context/authContext";
import { localDb, Role } from "@/lib/dexie/dbSchema";
import { initializeFreeModeEnvironment } from "@/lib/dexie/freeModeHelper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Loader2, Rocket, ShieldCheck, Zap } from "lucide-react";
// import { cn } from "@/lib/utils";

export default function FreeModePage() {
  // const t = useTranslations("login");
  const locale = useLocale();
  const { login } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);

  const handleStartFree = async () => {
    setIsInitializing(true);
    try {
      // Use the newly created helper to initialize the free mode environment
      await initializeFreeModeEnvironment(login);
      
      // Redirect to admin dashboard
      window.location.href = `/${locale}/admin`;
    } catch (error) {
      console.error("Failed to initialize free mode:", error);
      setIsInitializing(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-linear-to-br from-indigo-50/50 via-white to-blue-50/50 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-lg animate-fade-in-up">
        <Card className="border-border/40 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 overflow-hidden text-slate-900 dark:text-slate-100">
          <div className="h-2 bg-linear-to-r from-indigo-600 via-blue-500 to-indigo-600" />
          <CardHeader className="text-center space-y-4 pt-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
              <Rocket className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight">
                {locale === 'ar' ? 'البدء مجاناً' : 'Get Started for Free'}
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                {locale === 'ar' 
                  ? 'استخدم جميع المميزات محلياً دون الحاجة لحساب.' 
                  : 'Use all features locally without needing a server account.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-10">
            <div className="grid gap-4">
              <FeatureItem 
                icon={<Zap className="w-5 h-5 text-amber-500" />}
                title={locale === 'ar' ? 'دخول فوري' : 'Instant Access'}
                desc={locale === 'ar' ? 'لا حاجة للتسجيل أو الإنترنت.' : 'No registration or internet required.'}
              />
              <FeatureItem 
                icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
                title={locale === 'ar' ? 'خصوصية تامة' : 'Total Privacy'}
                desc={locale === 'ar' ? 'بياناتك محفوظة فقط على جهازك.' : 'Your data stays only on your device.'}
              />
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleStartFree}
              disabled={isInitializing}
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {locale === 'ar' ? 'جاري التحضير...' : 'Initializing...'}
                </>
              ) : (
                <>
                  {locale === 'ar' ? 'إنشاء مركز محلي' : 'Create Local Center'}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground italic">
              {locale === 'ar' 
                ? 'يمكنك دائماً الترقية للحصول على المزامنة السحابية لاحقاً.' 
                : 'You can always upgrade to cloud sync later.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border/50 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
      <div className="shrink-0 pt-0.5">{icon}</div>
      <div className="space-y-1 text-slate-800 dark:text-slate-200">
        <h4 className="font-semibold text-sm leading-none">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">{desc}</p>
      </div>
    </div>
  );
}
