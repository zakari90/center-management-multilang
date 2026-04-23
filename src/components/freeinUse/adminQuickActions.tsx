// components/admin/admin-quick-actions.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Calendar, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function AdminQuickActions() {
  const t = useTranslations("adminQuickActions");

  const actions = [
    {
      title: t("myCenter.title"),
      icon: Building2,
      href: "/free/admin/center",
      color: "text-blue-600 bg-blue-600",
    },
    {
      title: t("schedule.title"),
      icon: Calendar,
      href: "/free/admin/schedule",
      color: "text-purple-600 bg-purple-600",
    },
    {
      title: t("allUsers.title"),
      icon: Users,
      href: "/free/admin/users",
      color: "text-orange-600 bg-orange-600",
    },
  ];

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

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <ActionCard
              icon={action.icon}
              title={action.title}
              colorClass={action.color.split(" ")[0]}
              bgColorClass={action.color.split(" ")[1]}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
