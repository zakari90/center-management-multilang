"use client"

import { useTranslations } from "next-intl"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ViewStudentDialog from "@/components/ViewStudentDialog"
import ViewStudentCardDialog from "@/components/ViewStudentCardDialog"
import EditStudentDialog from "@/components/EditStudentDialog"
import { Student } from "../studentsPresentation"

interface StudentsTableViewProps {
  students: Student[]
  columnVisibility: {
    name: boolean
    contact: boolean
    parent: boolean
    subjects: boolean
    monthlyFee: boolean
    actions: boolean
  }
  getTotalRevenue: (student: Student) => number
  onUpdate: () => void
}

export function StudentsTableView({
  students,
  columnVisibility,
  getTotalRevenue,
  onUpdate,
}: StudentsTableViewProps) {
  const t = useTranslations("StudentsTable")

  return (
    <Card className="hidden md:block">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columnVisibility.name && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("name")}
                </th>
              )}
              {columnVisibility.contact && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("contact")}
                </th>
              )}
              {columnVisibility.parent && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("parent")}
                </th>
              )}
              {columnVisibility.subjects && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("subjects")}
                </th>
              )}
              {columnVisibility.monthlyFee && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("monthlyFee")}
                </th>
              )}
              {columnVisibility.actions && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  {t("noStudents")}
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                  {columnVisibility.name && (
                    <td className="px-6 py-4 whitespace-nowrap border-x">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {student.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{student.name}</div>
                          {student.grade && (
                            <div className="text-sm text-muted-foreground">{student.grade}</div>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  {columnVisibility.contact && (
                    <td className="px-6 py-4 border-x">
                      <div className="text-sm">{student.email || "-"}</div>
                      <div className="text-sm text-muted-foreground">{student.phone || "-"}</div>
                    </td>
                  )}
                  {columnVisibility.parent && (
                    <td className="px-6 py-4 border-x">
                      <div className="text-sm">{student.parentName || "-"}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.parentPhone || "-"}
                      </div>
                    </td>
                  )}
                  {columnVisibility.subjects && (
                    <td className="px-6 py-4 border-x">
                      <Badge variant="secondary">
                        {student.studentSubjects?.length || 0} {t("subjects")}
                      </Badge>
                    </td>
                  )}
                  {columnVisibility.monthlyFee && (
                    <td className="px-6 py-4 whitespace-nowrap border-x">
                      <div className="text-sm font-medium">MAD {getTotalRevenue(student).toFixed(2)}</div>
                    </td>
                  )}
                  {columnVisibility.actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right border-x">
                      <div className="flex gap-1 justify-end">
                        <ViewStudentDialog studentId={student.id} />
                        <ViewStudentCardDialog studentId={student.id} />
                        <EditStudentDialog studentId={student.id} onStudentUpdated={onUpdate} />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
