"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { BookOpen, GraduationCap, Users, CheckCircle2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getItemColor } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
  grade: string;
  price: number;
}

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  grades: string[];
}

interface PublicOfferingsProps {
  centerId?: string;
  onRegisterClick?: (type: "student" | "teacher") => void;
}

export function PublicOfferings({ centerId, onRegisterClick }: PublicOfferingsProps) {
  const t = useTranslations("PublicOfferings");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const centerQuery = centerId ? `?centerId=${centerId}` : "";
        const [subjectsRes, teachersRes] = await Promise.all([
          fetch(`/api/public/subjects${centerQuery}`),
          fetch(`/api/public/teachers${centerQuery}`),
        ]);

        if (subjectsRes.ok) setSubjects(await subjectsRes.json());
        if (teachersRes.ok) setTeachers(await teachersRes.json());
      } catch (error) {
        console.error("Failed to fetch public offerings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [centerId]);

  // Group subjects by grade
  const subjectsByGrade = subjects.reduce((acc, subject) => {
    if (!acc[subject.grade]) acc[subject.grade] = [];
    acc[subject.grade].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <section className="py-20 px-6 container mx-auto">
      {/* Subjects Section */}
      <div className="mb-20">
        <div className="text-center mb-12 space-y-4">
          <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 rounded-full text-sm font-semibold uppercase tracking-wider">
            {t("subjectsBadge") || "Academic Programs"}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
            {t("subjectsTitle") || "Available Subjects & Grades"}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t("subjectsSubtitle") || "Explore our wide range of subjects tailored for every level."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(subjectsByGrade).map(([grade, gradeSubjects], index) => (
            <motion.div
              key={grade}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden group">
                <div className="h-2 w-full bg-linear-to-r from-indigo-500 to-blue-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                    <GraduationCap className="h-6 w-6 text-indigo-600" />
                    {grade}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {gradeSubjects.map((subject) => (
                      <Badge 
                        key={subject.id} 
                        variant="secondary" 
                        className={`text-sm py-1 px-3 ${getItemColor(subject.name)} border-none shadow-sm`}
                      >
                        {subject.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">
                      {gradeSubjects.length} {t("subjectsCount") || "Subjects Available"}
                    </span>
                    <button 
                      onClick={() => onRegisterClick?.("student")}
                      className="text-primary font-bold text-sm flex items-center hover:gap-2 transition-all"
                    >
                      {t("registerNow") || "Register"} <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Teachers Section */}
      {teachers.length > 0 && (
        <div className="mb-20">
          <div className="text-center mb-12 space-y-4">
            <Badge variant="outline" className="px-4 py-1 text-emerald-600 border-emerald-200 bg-emerald-50 rounded-full text-sm font-semibold uppercase tracking-wider">
              {t("teachersBadge") || "Our Team"}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
              {t("teachersTitle") || "Meet Our Expert Teachers"}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t("teachersSubtitle") || "Learn from dedicated professionals who are passionate about education."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teachers.map((teacher, index) => (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative group text-center p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-transparent transition-all duration-500">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-500">
                    <Users className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{teacher.name}</h3>
                  <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                    {teacher.subjects.slice(0, 3).map((sub) => (
                      <span key={sub} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">
                        {sub}
                      </span>
                    ))}
                    {teacher.subjects.length > 3 && (
                      <span className="text-[10px] font-bold text-slate-400">+{teacher.subjects.length - 3} more</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">{t("verified") || "Verified Expert"}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Final CTA */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-[2.5rem] bg-indigo-600 p-12 overflow-hidden text-center text-white"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-blue-400/20 blur-3xl"></div>
        
        <div className="relative z-10 space-y-8">
          <h3 className="text-3xl md:text-5xl font-black">
            {t("ctaTitle") || "Ready to start your journey?"}
          </h3>
          <p className="text-xl text-indigo-100 font-medium max-w-2xl mx-auto">
            {t("ctaDescription") || "Join hundreds of students who are already excelling with our specialized support programs."}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => onRegisterClick?.("student")}
              className="px-10 py-5 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-lg"
            >
              {t("ctaStudentButton") || "Join as a Student"}
            </button>
            <button 
              onClick={() => onRegisterClick?.("teacher")}
              className="px-10 py-5 bg-indigo-500 text-white border border-indigo-400 font-black rounded-2xl shadow-xl hover:bg-indigo-400 hover:scale-105 active:scale-95 transition-all text-lg"
            >
              {t("ctaTeacherButton") || "Join as a Teacher"}
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
