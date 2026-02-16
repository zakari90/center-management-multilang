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
      href: "/admin/center",
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: t("schedule.title"),
      icon: Calendar,
      href: "/admin/schedule",
      color: "text-pink-600 bg-pink-100",
    },
    {
      title: t("allUsers.title"),
      icon: Users,
      href: "/admin/users",
      color: "text-orange-600 bg-orange-100",
    },
  ];

  return (
    <Card className="border-none shadow-sm bg-linear-to-tr from-accent/20 to-transparent">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-muted-foreground/80">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <div className="flex flex-col items-center gap-4 p-5 rounded-2xl border border-border/40 bg-card hover:bg-accent/40 hover:border-accent hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div
                  className={`h-14 w-14 rounded-2xl ${action.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}
                >
                  <action.icon className="h-7 w-7" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold tracking-wide text-card-foreground/90">
                    {action.title}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
