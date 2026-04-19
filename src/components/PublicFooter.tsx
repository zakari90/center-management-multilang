"use client";

import { useTranslations } from "next-intl";

export default function PublicFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="w-full py-16 px-6 bg-[#0A0A0A] border-t border-white/10 flex flex-col items-center gap-8 text-center mt-auto">
      <div className="space-y-2">
        <p className="text-xl text-slate-300 font-bold tracking-tight">
          {t("bookingInquiry")}
        </p>
      </div>

      <button
        onClick={() => window.open("https://wa.me/212768276772", "_blank")}
        className="px-10 py-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all transform hover:scale-105 active:scale-95 backdrop-blur-sm shadow-xl shadow-indigo-500/10"
      >
        {t("btnPaid")}
      </button>

      <div className="pt-4 border-t border-white/5 w-full max-w-xs">
        <p className="text-sm text-indigo-400 font-mono tracking-wider opacity-80">
          {t("contactEmail")}
        </p>
      </div>
    </footer>
  );
}
