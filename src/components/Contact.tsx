"use client";

import emailjs from "@emailjs/browser";
import { Mail, MapPin, MessageSquare, Send, User } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";

type ContactForm = z.infer<typeof contactSchema>;

// Define base schema for type inference, but actual schema will be created in component
const contactSchema = z.object({
  name: z.string(),
  email: z.string(),
  message: z.string(),
});

export default function Contact() {
  const t = useTranslations("Contact");

  // Create schema with translated error messages
  const formSchema = z.object({
    name: z.string().min(2, { message: t("err_name_min") }),
    email: z.string().email({ message: t("err_email_invalid") }),
    message: z.string().min(10, { message: t("err_message_min") }),
  });

  const [formData, setFormData] = useState<ContactForm>({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    setApiError("");

    try {
      formSchema.parse(formData);

      // Send via EmailJS
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "",
      );

      // Clear form inputs
      setFormData({ name: "", email: "", message: "" });
      setIsSuccess(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<ContactForm> = {};
        error.issues.forEach((issue: z.ZodIssue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as keyof ContactForm] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error("Error sending email:", error);
        setApiError(t("err_api_failed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="contact"
      className="relative z-10 py-20 px-4 md:px-6 max-w-7xl mx-auto"
    >
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
          {t("contact_title")}
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">{t("description")}</p>
      </div>

      <div className="bg-white/5 border border-white/10 p-5 md:p-12 rounded-[24px] md:rounded-[32px] backdrop-blur-xl shadow-2xl overflow-hidden">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="text-emerald-400" size={32} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {t("success_title")}
            </h3>
            <p className="text-slate-400 text-base sm:text-lg">
              {t("success_msg")}
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="mt-8 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              {t("send_another")}
            </button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div className="space-y-10 lg:space-y-12">
              {/* <div className="space-y-6">
                <p className="text-slate-400 text-lg leading-relaxed">
                  {t("description")}
                </p>
              </div> */}

              {/* Contact Cards */}
              <div className="grid gap-6">
                <div className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 group hover:border-indigo-500/50 transition-colors">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Mail size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
                      {t("email")}
                    </p>
                    <p className="text-base md:text-lg font-medium text-white break-all">
                      zakariazinedine1@gmail.com
                    </p>
                  </div>
                </div>
                <div className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 group hover:border-indigo-500/50 transition-colors">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                    <MapPin size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1">
                      {t("address")}
                    </p>
                    <p className="text-base md:text-lg font-medium text-white wrap-break-word">
                      Sale, Morocco
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.open("https://wa.me/212768276772", "_blank")}
                className="px-10 py-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all transform hover:scale-105 active:scale-95 backdrop-blur-sm shadow-xl shadow-indigo-500/10 cursor-pointer"
              >
                {t("btnPaid")}
              </button>
            </div>

            <div className="bg-white/5 p-5 md:p-10 rounded-[20px] md:rounded-[24px] border border-white/10 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                {apiError && (
                  <div className="p-4 bg-red-500/10 text-red-400 rounded-xl text-sm font-medium border border-red-500/20">
                    {apiError}
                  </div>
                )}
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label
                      htmlFor="name"
                      className="text-xs font-bold text-indigo-400 uppercase tracking-widest ps-1 block text-start"
                    >
                      {t("name")}
                    </label>
                    <div className="relative group">
                      <User
                        className="absolute left-4 rtl:left-auto rtl:right-4 top-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                        size={20}
                      />
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                        }}
                        className={`w-full bg-white/5 border rounded-xl py-4 pl-12 pr-4 rtl:pr-12 rtl:pl-4 font-medium focus:outline-none transition-all text-start text-white ${
                          errors.name
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-white/10 focus:border-indigo-500 focus:bg-white/10"
                        }`}
                        placeholder={t("name_placeholder")}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-2 ps-1 font-medium text-start">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label
                      htmlFor="email"
                      className="text-xs font-bold text-indigo-400 uppercase tracking-widest ps-1 block text-start"
                    >
                      {t("email")}
                    </label>
                    <div className="relative group">
                      <Mail
                        className="absolute left-4 rtl:left-auto rtl:right-4 top-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                        size={20}
                      />
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                        }}
                        className={`w-full bg-white/5 border rounded-xl py-4 pl-12 pr-4 rtl:pr-12 rtl:pl-4 font-medium focus:outline-none transition-all text-start text-white ${
                          errors.email
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-white/10 focus:border-indigo-500 focus:bg-white/10"
                        }`}
                        placeholder={t("email_placeholder")}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-2 ps-1 font-medium text-start">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label
                      htmlFor="message"
                      className="text-xs font-bold text-indigo-400 uppercase tracking-widest ps-1 block text-start"
                    >
                      {t("message")}
                    </label>
                    <div className="relative group">
                      <MessageSquare
                        className="absolute left-4 rtl:left-auto rtl:right-4 top-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                        size={20}
                      />
                      <textarea
                        id="message"
                        rows={4}
                        value={formData.message}
                        onChange={(e) => {
                          setFormData({ ...formData, message: e.target.value });
                        }}
                        className={`w-full bg-white/5 border rounded-xl py-4 pl-12 pr-4 rtl:pr-12 rtl:pl-4 font-medium focus:outline-none transition-all resize-none text-start text-white ${
                          errors.message
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-white/10 focus:border-indigo-500 focus:bg-white/10"
                        }`}
                        placeholder={t("message_placeholder")}
                      />
                    </div>
                    {errors.message && (
                      <p className="text-red-400 text-xs mt-2 ps-1 font-medium text-start">
                        {errors.message}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-xl shadow-xl shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {t("send")} <Send size={20} className="rtl:rotate-180" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
