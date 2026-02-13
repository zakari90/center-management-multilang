"use client";

import { GraduationCap, UserPlus, Wallet, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import AddStudentDialog from "./AddStudentDialog";
import AddStudentPaymentDialog from "./AddStudentPaymentDialog";
import AddTeacherDialog from "./AddTeacherDialog";
import AddTeacherPaymentDialog from "./AddTeacherPaymentDialog";
import { useAuth } from "@/context/authContext";

export default function QuickActions() {
  const t = useTranslations("QuickActions");
  const { user } = useAuth();

  const ActionCard = ({ icon: Icon, title, colorClass, bgColorClass }: any) => (
    <div
      className={`
      relative group overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm
      transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer
      flex flex-col items-center justify-center p-6 gap-3 h-full w-full
    `}
    >
      <div
        className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity ${bgColorClass}`}
      />
      <div
        className={`p-3 rounded-full ${colorClass} bg-opacity-10 ring-1 ring-inset ring-black/5 ${bgColorClass.replace("bg-", "bg-opacity-10 ")}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <span className="font-semibold text-sm text-center">{title}</span>
    </div>
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight">{t("title")}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AddStudentDialog
          adminMode={user?.role === "ADMIN"}
          trigger={
            <ActionCard
              icon={GraduationCap}
              title={t("actions.addStudent.title")}
              colorClass="text-blue-600"
              bgColorClass="bg-blue-600"
            />
          }
        />

        <AddTeacherDialog
          adminMode={user?.role === "ADMIN"}
          trigger={
            <ActionCard
              icon={UserPlus}
              title={t("actions.addTeacher.title")}
              colorClass="text-purple-600"
              bgColorClass="bg-purple-600"
            />
          }
        />

        <AddStudentPaymentDialog
          trigger={
            <ActionCard
              icon={Wallet}
              title={t("actions.newReceipt.title")}
              colorClass="text-green-600"
              bgColorClass="bg-green-600"
            />
          }
        />

        <AddTeacherPaymentDialog
          trigger={
            <ActionCard
              icon={CreditCard}
              title={
                t("actions.teacherPaymentMainAction.title") || "Pay Teacher"
              }
              colorClass="text-orange-600"
              bgColorClass="bg-orange-600"
            />
          }
        />
      </div>
    </section>
  );
}
