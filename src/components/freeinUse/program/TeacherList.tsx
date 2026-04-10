"use client";

import { useTranslations } from "next-intl";
import { Teacher, TeacherSubject, Subject } from "./ProgramView";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Clock,
  CreditCard,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/freelib/utils";

interface TeacherListProps {
  teachers: Teacher[];
  teacherSubjects: TeacherSubject[];
  subjects: Subject[];
}

export function TeacherList({
  teachers,
  teacherSubjects,
  subjects,
}: TeacherListProps) {
  const t = useTranslations("Program");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {teachers.length === 0 ? (
        <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center text-center">
          <User className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <CardTitle className="text-muted-foreground">
            {t("noTeachers") || "No teachers found"}
          </CardTitle>
          <CardDescription>
            {t("addTeachersDescription") ||
              "Try adding teachers to your center first."}
          </CardDescription>
        </Card>
      ) : (
        teachers.map((teacher) => {
          const personalSubjects = teacherSubjects.filter(
            (ts) => ts.teacherId === teacher.id,
          );

          return (
            <Card
              key={teacher.id}
              className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-card"
            >
              <CardHeader className="relative pb-0">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <User size={80} />
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                    {teacher.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                      {teacher.name}
                    </CardTitle>
                    <div className="flex flex-col gap-1">
                      {teacher.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {teacher.email}
                        </div>
                      )}
                      {teacher.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {teacher.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/30 rounded-xl p-2.5 border border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[9px] uppercase font-extrabold tracking-wider mb-1">
                      <Clock className="w-2.5 h-2.5" />
                      {t("teachingHours") || "Weekly"}
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {teacher.teachingHours || 0}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        h
                      </span>
                    </div>
                  </div>

                  <div className="bg-primary/5 rounded-xl p-2.5 border border-primary/10">
                    <div className="flex items-center gap-1.5 text-primary text-[9px] uppercase font-extrabold tracking-wider mb-1">
                      <TrendingUp className="w-2.5 h-2.5" />
                      {t("availableHours") || "Available"}
                    </div>
                    <div className="text-base font-bold text-primary">
                      {teacher.availableHours || 0}{" "}
                      <span className="text-[10px] font-normal text-primary/70">
                        h
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-2.5 border border-border/50 text-right">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[9px] uppercase font-extrabold tracking-wider mb-1 justify-end">
                      {t("subjects") || "Subs"}
                      <BookOpen className="w-2.5 h-2.5" />
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {teacher.subjects?.length || 0}
                    </div>
                  </div>
                </div>

                {/* Subjects Badges */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70 flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    {t("assignedSpecialties") || "Assigned Specialties"}
                    <div className="h-px flex-1 bg-border" />
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.subjects && teacher.subjects.length > 0 ? (
                      teacher.subjects.map((sub, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/10 rounded-md transition-colors px-2 py-0.5 text-[10px]"
                        >
                          {sub}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {t("noSubjectsAssigned") || "No subjects assigned"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Compensation Insight */}
                {personalSubjects.length > 0 && (
                  <div className="pt-2">
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3 text-primary/60" />
                          {t("billingTerms") || "Billing Terms"}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase tracking-tighter bg-background"
                        >
                          {t("activeContract") || "Active"}
                        </Badge>
                      </div>
                      <div className="divide-y divide-primary/10">
                        {personalSubjects.slice(0, 3).map((ts, idx) => {
                          const sub = subjects.find(
                            (s) => s.id === ts.subjectId,
                          );
                          return (
                            <div
                              key={idx}
                              className="py-2 first:pt-0 last:pb-0 flex justify-between items-center"
                            >
                              <span className="text-[11px] font-medium max-w-[120px] truncate">
                                {sub?.name || "???"}
                              </span>
                              <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-primary">
                                {ts.hourlyRate && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-2.5 h-2.5" />
                                    {ts.hourlyRate} MAD/h
                                  </span>
                                )}
                                {ts.percentage && (
                                  <span className="bg-primary/10 px-1.5 py-0.5 rounded italic">
                                    {ts.percentage}%
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {personalSubjects.length > 3 && (
                          <div className="pt-2 text-center">
                            <button className="text-[9px] font-bold text-primary flex items-center gap-1 mx-auto hover:underline uppercase">
                              {t("moreRecords") || "View all records"}
                              <ChevronRight className="w-2 h-2" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
