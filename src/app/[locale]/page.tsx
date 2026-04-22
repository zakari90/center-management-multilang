"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Database,
  Globe,
  Laptop,
  Lock,
  MonitorSmartphone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  WifiOff,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import Contact from "@/components/Contact";
import PublicFooter from "@/components/PublicFooter";

// In-file translations to avoid polluting global dictionaries for this specific marketing page
const content = {
  ar: {
    heroTag: "إعلان إطلاق",
    heroTitle: "نظام للإدارة الذكية للمراكز التعليمية",
    heroSubtitle:
      "هل تبحث عن النظام المثالي لإدارة مركزك التعليمي (مركز لغات، دروس خصوصية، أو تدريب)؟ سواء كنت تبحث عن حل مجاني يعمل بدون إنترنت، أو نظام سحابي متكامل يربط فريق عملك بأكمله، لدينا الحل الأنسب لك!",
    pricingTitle: "اختر الباقة المناسبة لمركزك",
    pricingSubtitle: "لقد صممنا النظام بخيارين ليناسب حجم وطبيعة عمل مركزك",
    freePlan: "الباقة المجانية",
    freePlanDesc: "وضع عدم الاتصال - Offline Mode",
    freePlanTarget:
      "مصممة للمراكز التي تفضل العمل محلياً وبدون اشتراكات أو تكاليف إضافية!",
    paidPlan: "الباقة المدفوعة",
    paidPlanDesc: "النظام السحابي الشامل - Cloud Mode",
    paidPlanTarget:
      "مصممة للمراكز المتوسطة والكبرى التي تحتاج إلى إدارة متقدمة، عمل جماعي، ومتابعة عن بُعد.",
    featuresTitle: "مميزات عامة في كلا النظامين",
    featuresList: [
      "واجهة عصرية، احترافية وسهلة الاستخدام جداً.",
      "متعدد اللغات بالكامل (العربية، الإنجليزية، الفرنسية).",
      "سرعة فائقة في التعامل مع البيانات لاستخراج التقارير والبحث.",
      "🌐 يعمل بسلاسة أونلاين وأوفلاين: التطبيق مصمم ليعمل بكفاءة سواء كنت متصلاً بالإنترنت أو غير متصل.",
      "✅ مؤشر الكاش الذكي: بمجرد ظهور 'الدائرة الخضراء' (Green Bubble)، فهذا يعني اكتمال حفظ النظام استعدادًا للعمل بدون إنترنت بكل أمان!",
    ],
    ctaTitle: "لا تدع المهام الإدارية تستهلك وقتك!",
    ctaDesc:
      "ابدأ الآن فوراً مع النظام المجاني، أو تواصل معنا للاشتراك في الباقة المدفوعة.",
    btnFree: "ابدأ الآن مجاناً 🚀",
    btnPaid: "تواصل معنا للحجز 💬",
    contactUs: "للحجز أو الاستفسار: zakariazinedine1@gmail.com",
    freeToolsTitle: "أدوات ذكية مجانية فورية",
    freeToolsSubtitle:
      "جرب أدواتنا الأساسية للإدارة فوراً وبدون أي تسجيل أو تعقيد.",
    scheduleToolTitle: "مدير الجداول",
    scheduleToolDesc: "نظم حصصك في شبكة ذكية وبسيطة.",
    attendanceToolTitle: "دفتر الحضور",
    attendanceToolDesc: "سجل حضور الطلاب، تابع سجلاتهم واستخرج تقاريرك بسرعة.",
    btnTryTool: "جرب الأداة الآن",
    freeBadge: "مجاني",
    recommendedBadge: "موصى به",
  },
  en: {
    heroTag: "Launch Announcement",
    heroTitle: "Smart Management System for Educational Centers",
    heroSubtitle:
      "Looking for the perfect system to manage your center? Whether you need a simple free offline tool or a comprehensive cloud system for your entire team, we have the right solution for you!",
    pricingTitle: "Choose the Right Plan",
    pricingSubtitle:
      "We designed two powerful options to fit your center's size and needs",
    freePlan: "Free Plan",
    freePlanDesc: "Offline-First Mode",
    freePlanTarget:
      "Designed for small centers that prefer local work with zero subscriptions or extra costs!",
    paidPlan: "Premium Plan",
    paidPlanDesc: "Comprehensive Cloud SaaS",
    paidPlanTarget:
      "Designed for medium to large centers needing advanced management, team collaboration, and remote access.",
    featuresTitle: "Shared Features",
    featuresList: [
      "Modern, professional, and highly intuitive interface.",
      "Fully multilingual (Arabic, English, French).",
      "Lightning-fast data processing for reports and search.",
      "🌐 Works seamlessly online & offline: Designed to work efficiently whether you are connected or not.",
      "✅ Smart Cache Indicator: Once the 'Green Bubble' appears, the system is fully cached and ready for safe offline use!",
    ],
    ctaTitle: "Don't let admin tasks consume your time!",
    ctaDesc:
      "Start instantly with the free version, or contact us to subscribe to the cloud plan.",
    btnFree: "Start for Free 🚀",
    btnPaid: "Contact Us to Subscribe 💬",
    contactUs: "For inquiries: zakariazinedine1@gmail.com",
    freeToolsTitle: "Instant Smart Free Tools",
    freeToolsSubtitle:
      "Try our core management tools instantly with zero registration.",
    scheduleToolTitle: "Schedule Manager",
    scheduleToolDesc: "Organize your classes in a simple smart grid.",
    attendanceToolTitle: "Attendance Register",
    attendanceToolDesc:
      "Track student presence, history, and generate quick reports.",
    btnTryTool: "Try Tool Now",
    freeBadge: "FREE",
    recommendedBadge: "RECOMMENDED",
  },
  fr: {
    heroTag: "Annonce de Lancement",
    heroTitle: "Système de Gestion Intelligent pour Centres Éducatifs",
    heroSubtitle:
      "Vous cherchez le système idéal pour gérer votre centre ? Que vous ayez besoin d'un outil gratuit hors ligne ou d'un système cloud complet pour toute votre équipe, nous avons la solution !",
    pricingTitle: "Choisissez le Bon Plan",
    pricingSubtitle:
      "Nous avons conçu deux options puissantes adaptées à la taille de votre centre",
    freePlan: "Plan Gratuit",
    freePlanDesc: "Mode Hors Ligne",
    freePlanTarget:
      "Conçu pour les centres qui préfèrent le travail local sans abonnement ni frais supplémentaires !",
    paidPlan: "Plan Premium",
    paidPlanDesc: "SaaS Cloud Complet",
    paidPlanTarget:
      "Conçu pour les centres moyens à grands nécessitant une gestion avancée, un travail d'équipe et un accès à distance.",
    featuresTitle: "Fonctionnalités Communes",
    featuresList: [
      "Interface moderne, professionnelle et très intuitive.",
      "Entièrement multilingue (Arabe, Anglais, Français).",
      "Traitement ultra-rapide des données pour les rapports et recherches.",
      "🌐 Fonctionne fluidement en ligne et hors ligne : Conçu pour être efficace avec ou sans connexion internet.",
      "✅ Indicateur de Cache Intelligent : Dès que la 'Bulle Verte' apparaît, le système est entièrement mis en cache pour une utilisation hors ligne en toute sécurité !",
    ],
    ctaTitle: "Ne laissez pas les tâches administratives vous consommer !",
    ctaDesc:
      "Commencez instantanément avec la version gratuite, ou contactez-nous pour le plan cloud.",
    btnFree: "Commencer Gratuitement 🚀",
    btnPaid: "Contactez-nous 💬",
    contactUs: "Pour toute demande: zakariazinedine1@gmail.com",
    freeToolsTitle: "Outils Intelligents Gratuits",
    freeToolsSubtitle:
      "Essayez nos outils de gestion de base instantanément et sans inscription.",
    scheduleToolTitle: "Gestionnaire d'Emploi du Temps",
    scheduleToolDesc: "Organisez vos cours dans une grille simple.",
    attendanceToolTitle: "Registre de Présence",
    attendanceToolDesc:
      "Suivez les présences, l'historique et générez des rapports rapides.",
    btnTryTool: "Essayer l'outil maintenant",
    freeBadge: "GRATUIT",
    recommendedBadge: "RECOMMANDÉ",
  },
};

const freeFeaturesAr = [
  { text: "مجانية 100%: بدون رسوم خفية", icon: <Rocket className="w-5 h-5" /> },
  {
    text: "تعمل بدون إنترنت (Offline-First)",
    icon: <WifiOff className="w-5 h-5" />,
  },
  { text: "إدارة شاملة للطلاب والمعلمين", icon: <Users className="w-5 h-5" /> },
  {
    text: "تثبيت كتطبيق (PWA) على أي جهاز",
    icon: <MonitorSmartphone className="w-5 h-5" />,
  },
  {
    text: "خصوصية تامة: بياناتك محلياً فقط",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    text: "دعم فني مجاني مع 3 صفحات ويب لمركزك",
    icon: <Globe className="w-5 h-5" />,
  },
];

const paidFeaturesAr = [
  {
    text: "مزامنة سحابية: وصول من أي مكان",
    icon: <Cloud className="w-5 h-5" />,
  },
  { text: "تعدد المستخدمين والصلاحيات", icon: <Users className="w-5 h-5" /> },
  { text: "برنامج حاسوب أوفلاين 100%", icon: <Laptop className="w-5 h-5" /> },
  { text: "روابط تسجيل عامة للطلاب", icon: <Globe className="w-5 h-5" /> },
  { text: "نسخ احتياطي وتأمين مستمر", icon: <Database className="w-5 h-5" /> },
  { text: "متابعة الإحصائيات عن بُعد", icon: <Laptop className="w-5 h-5" /> },
];

const freeFeaturesEn = [
  { text: "100% Free: No hidden fees", icon: <Rocket className="w-5 h-5" /> },
  { text: "Works completely Offline", icon: <WifiOff className="w-5 h-5" /> },
  {
    text: "Full student & teacher management",
    icon: <Users className="w-5 h-5" />,
  },
  {
    text: "Install as a PWA anywhere",
    icon: <MonitorSmartphone className="w-5 h-5" />,
  },
  {
    text: "Total privacy: Local data only",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    text: "Free tech support + 3 landing pages",
    icon: <Globe className="w-5 h-5" />,
  },
];

const paidFeaturesEn = [
  {
    text: "Cloud sync: Access from anywhere",
    icon: <Cloud className="w-5 h-5" />,
  },
  { text: "Multi-user & roles support", icon: <Users className="w-5 h-5" /> },
  {
    text: "100% Offline Desktop Application",
    icon: <Laptop className="w-5 h-5" />,
  },
  {
    text: "Public registration links for students",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    text: "Continuous automated backups",
    icon: <Database className="w-5 h-5" />,
  },
  { text: "Remote dashboard monitoring", icon: <Laptop className="w-5 h-5" /> },
];

const freeFeaturesFr = [
  {
    text: "100% Gratuit : Aucun frais caché",
    icon: <Rocket className="w-5 h-5" />,
  },
  {
    text: "Fonctionne entièrement Hors Ligne",
    icon: <WifiOff className="w-5 h-5" />,
  },
  {
    text: "Gestion complète élèves & profs",
    icon: <Users className="w-5 h-5" />,
  },
  {
    text: "Installation PWA sur tout support",
    icon: <MonitorSmartphone className="w-5 h-5" />,
  },
  {
    text: "Vie privée : Données locales uniquement",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    text: "Support gratuit + 3 pages de centre",
    icon: <Globe className="w-5 h-5" />,
  },
];

const paidFeaturesFr = [
  { text: "Sync Cloud : Accès partout", icon: <Cloud className="w-5 h-5" /> },
  { text: "Multi-utilisateurs & rôles", icon: <Users className="w-5 h-5" /> },
  {
    text: "Application Bureau 100% Hors Ligne",
    icon: <Laptop className="w-5 h-5" />,
  },
  {
    text: "Liens publics pour inscriptions",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    text: "Sauvegardes auto continues",
    icon: <Database className="w-5 h-5" />,
  },
  { text: "Suivi des stats à distance", icon: <Laptop className="w-5 h-5" /> },
];

export default function SaaSMarketingPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";

  // Use English as fallback for missing locales
  const t = content[locale as keyof typeof content] || content.en;

  let freeFeatures = freeFeaturesEn;
  let paidFeatures = paidFeaturesEn;

  if (locale === "ar") {
    freeFeatures = freeFeaturesAr;
    paidFeatures = paidFeaturesAr;
  } else if (locale === "fr") {
    freeFeatures = freeFeaturesFr;
    paidFeatures = paidFeaturesFr;
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <main
      className="min-h-screen bg-[#0A0A0A] text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Background ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/10 blur-[120px] mix-blend-screen" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md mb-8"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-indigo-300 tracking-wide uppercase">
            {t.heroTag}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight"
        >
          <span className="bg-linear-to-br from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            {t.heroTitle}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed mb-12"
        >
          {t.heroSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <button
            onClick={() => router.push(`/${locale}/free`)}
            className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.3)] cursor-pointer"
          >
            {t.btnFree}
          </button>
          <button
            onClick={() => window.open("https://wa.me/212768276772", "_blank")}
            className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all hover:scale-105 active:scale-95 backdrop-blur-sm cursor-pointer"
          >
            {t.btnPaid}
          </button>
        </motion.div>
      </section>

      {/* Pricing/Tiers Section */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.pricingTitle}
          </h2>
          <p className="text-slate-400">{t.pricingSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Tier Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-indigo-500/50 transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {t.freePlan}
                  </h3>
                  <div className="text-indigo-400 font-medium">
                    {t.freePlanDesc}
                  </div>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl">
                  <WifiOff className="w-6 h-6 text-indigo-300" />
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-8 pb-8 border-b border-white/10">
                {t.freePlanTarget}
              </p>

              <ul className="space-y-4 mb-8">
                {freeFeatures.map((feat, i) => (
                  <li key={i} className="flex gap-3 text-slate-300">
                    <div className="text-indigo-400 mt-0.5">{feat.icon}</div>
                    <span>{feat.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => router.push(`/${locale}/free`)}
                className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all active:scale-95 cursor-pointer"
              >
                {t.btnFree}
              </button>
            </div>
          </motion.div>

          {/* Premium Tier Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative p-8 rounded-3xl bg-linear-to-br from-indigo-900/40 to-violet-900/40 border border-indigo-500/30 backdrop-blur-xl shadow-[0_0_40px_rgba(79,70,229,0.15)] hover:shadow-[0_0_60px_rgba(79,70,229,0.25)] transition-all duration-300"
          >
            <div className="absolute top-0 right-10 transform -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              {t.recommendedBadge}
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {t.paidPlan}
                  </h3>
                  <div className="text-violet-300 font-medium">
                    {t.paidPlanDesc}
                  </div>
                </div>
                <div className="bg-indigo-500/20 p-3 rounded-2xl">
                  <Cloud className="w-6 h-6 text-indigo-300" />
                </div>
              </div>

              <p className="text-sm text-indigo-200/70 mb-8 pb-8 border-b border-indigo-500/20">
                {t.paidPlanTarget}
              </p>

              <ul className="space-y-4 mb-8">
                {paidFeatures.map((feat, i) => (
                  <li key={i} className="flex gap-3 text-indigo-100">
                    <div className="text-indigo-400 mt-0.5">{feat.icon}</div>
                    <span>{feat.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() =>
                  window.open("https://wa.me/212768276772", "_blank")
                }
                className="w-full py-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.4)] cursor-pointer"
              >
                {t.btnPaid}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Free Instant Tools Section */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Sparkles className="w-3 h-3" /> {t.freeBadge}
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            {t.freeToolsTitle}
          </h2>
          <p className="text-slate-400 text-lg">{t.freeToolsSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Schedule Tool Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/8 transition-all duration-300"
          >
            <div className="flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {t.scheduleToolTitle}
              </h3>
              <p className="text-slate-400 mb-8 grow">{t.scheduleToolDesc}</p>
              <button
                onClick={() => router.push(`/${locale}/schedule?tab=schedule`)}
                className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {t.btnTryTool} <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Attendance Tool Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/8 transition-all duration-300"
          >
            <div className="flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {t.attendanceToolTitle}
              </h3>
              <p className="text-slate-400 mb-8 grow">{t.attendanceToolDesc}</p>
              <button
                onClick={() =>
                  router.push(`/${locale}/schedule?tab=attendance`)
                }
                className="inline-flex items-center gap-2 text-emerald-400 font-bold hover:text-emerald-300 transition-colors cursor-pointer"
              >
                {t.btnTryTool} <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Universal Features Section */}
      <section className="relative z-10 py-24 px-6 bg-white/5 border-y border-white/10 mt-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-10 text-white">
            {t.featuresTitle}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {t.featuresList.map((feat: string, i: number) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-6 bg-white/5 rounded-2xl border border-white/5"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-4" />
                <p className="text-slate-300 text-sm leading-relaxed">{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <Contact />

      {/* Footer / CTA */}
      <section className="relative z-10 py-32 px-6 text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold mb-6">{t.ctaTitle}</h2>
        <p className="text-xl text-slate-400 mb-10">{t.ctaDesc}</p>
        {/* <p className="text-sm text-indigo-400 font-mono flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" /> {t.contactUs}
        </p> */}
      </section>
      <PublicFooter />
    </main>
  );
}
