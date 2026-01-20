"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, GraduationCap } from "lucide-react"
import { useTranslations } from "next-intl"

interface StudentsStatsProps {
  totalStudents: number
  filteredCount: number
  totalRevenue: number
  averageSubjects: number
}

export function StudentsStats({
  totalStudents,
  filteredCount,
  totalRevenue,
  averageSubjects,
}: StudentsStatsProps) {
  const t = useTranslations("StudentsTable")

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 m-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("totalStudents")}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStudents}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredCount} {t("filtered")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("totalRevenue")}</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">MAD {totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">{t("monthlyRevenue")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("avgSubjects")}</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageSubjects.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground mt-1">{t("perStudent")}</p>
        </CardContent>
      </Card>
    </div>
  )
}
