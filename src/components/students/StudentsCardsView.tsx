"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ViewStudentDialog from "@/components/ViewStudentDialog"
import ViewStudentCardDialog from "@/components/ViewStudentCardDialog"
import EditStudentDialog from "@/components/EditStudentDialog"
import { Student } from "../studentsPresentation"
import { Phone, Mail, User } from "lucide-react"

interface StudentsCardsViewProps {
  students: Student[]
  getTotalRevenue: (student: Student) => number
  onUpdate: () => void
}

export function StudentsCardsView({
  students,
  getTotalRevenue,
  onUpdate,
}: StudentsCardsViewProps) {
  const t = useTranslations("StudentsTable")

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden px-3">
      {students.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {t("noStudents")}
        </Card>
      ) : (
        students.map((student) => (
          <Card key={student.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-green-600 text-white font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">{student.name}</CardTitle>
                    {student.grade && (
                      <p className="text-xs text-foreground/70 font-medium">{student.grade}</p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary font-semibold">
                  {student.studentSubjects?.length || 0} {t("subjects")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-2 py-2 border-y text-xs">
                <div className="space-y-1">
                  <p className="text-foreground/60 font-semibold text-[11px]">{t("contact")}</p>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-foreground/70" />
                    <span className="truncate text-foreground/90 font-medium">{student.phone || "-"}</span>
                  </div>
                  {student.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-foreground/70" />
                      <span className="truncate text-foreground/90 font-medium">{student.email}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-foreground/60 font-semibold text-[11px]">{t("parent")}</p>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-foreground/70" />
                    <span className="truncate text-foreground/90 font-medium">{student.parentName || "-"}</span>
                  </div>
                  {student.parentPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-foreground/70" />
                      <span className="truncate text-foreground/90 font-medium">{student.parentPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-foreground/60 uppercase font-bold tracking-wider">
                    {t("monthlyFee")}
                  </p>
                  <p className="text-base font-bold text-primary">
                    MAD {getTotalRevenue(student).toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <ViewStudentDialog studentId={student.id} />
                  <ViewStudentCardDialog studentId={student.id} />
                  <EditStudentDialog studentId={student.id} onStudentUpdated={onUpdate} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
