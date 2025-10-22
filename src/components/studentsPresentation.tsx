/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { Loader2, Eye, Pencil, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"

interface StudentSubject {
  id: string
  subject: {
    id: string
    name: string
    grade: string
    price: number
  }
}

export interface Student {
  id: string
  name: string
  email: string | null
  phone: string | null
  parentName: string | null
  parentPhone: string | null
  parentEmail: string | null
  grade: string | null
  createdAt: string
  studentSubjects: StudentSubject[]
}

export default function StudentsTable() {
  const t = useTranslations("StudentsTable")
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [gradeFilter, setGradeFilter] = useState<string>("all")

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await axios.get("/api/students")
      setStudents(response.data)
    } catch (err) {
      console.log(err instanceof Error ? err.message : "Something went wrong")
      setError(t("errorFetchStudents"))
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.includes(searchTerm) ||
      student.parentName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter

    return matchesSearch && matchesGrade
  })

  // Get unique grades for filter
  const grades = ["all", ...new Set(students.map((s) => s.grade).filter(Boolean))]

  const getTotalRevenue = (student: Student) => {
    if (!student?.studentSubjects) {
      return 0
    }
    return student.studentSubjects.reduce((total, ss) => {
      return total + (ss?.subject?.price ?? 0)
    }, 0)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin rounded-full h-12 w-12" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">{t("student")}</h1>
            <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button asChild>
            <Link href="/manager/students/create">{t("addStudent")}</Link>
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {grades.map((grade) => (
                <SelectItem key={grade} value={grade || ""}>
                  {grade === "all" ? t("allGrades") : grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">{t("totalStudents")}</p>
          <p className="text-3xl font-bold">{students?.length ?? 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">{t("activeEnrollments")}</p>
          <p className="text-3xl font-bold text-green-600">
            {students?.filter((s) => s.studentSubjects?.length > 0).length ?? 0}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">{t("totalRevenue")}</p>
          <p className="text-3xl font-bold text-blue-600">
            MAD{students?.reduce((total, s) => total + getTotalRevenue(s), 0).toFixed(2) ?? "0.00"}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">{t("avgSubjectsPerStudent")}</p>
          <p className="text-3xl font-bold text-purple-600">
            {students && students.length > 0
              ? (students.reduce((total, s) => total + (s.studentSubjects?.length ?? 0), 0) / students.length).toFixed(
                  1,
                )
              : "0"}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card>
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground">
              {searchTerm || gradeFilter !== "all" ? "No students found matching your criteria" : "No students yet"}
            </p>
            {!searchTerm && gradeFilter === "all" && (
              <Button asChild className="mt-4">
                <Link href="/manager/students/create">{t("addFirstStudent")}</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("student")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("contact")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("parentGuardian")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("subjects")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("revenue")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("enrolled")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {student.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{student.name}</div>
                          {student.grade && <div className="text-sm text-muted-foreground">{student.grade}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{student.email || "-"}</div>
                      <div className="text-sm text-muted-foreground">{student.phone || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{student.parentName || "-"}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.parentPhone || student.parentEmail || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {student.studentSubjects && student.studentSubjects.length === 0 ? (
                          <span className="text-muted-foreground italic">{t("noSubjects")}</span>
                        ) : (
                          <div className="space-y-1">
                            {student.studentSubjects &&
                              student.studentSubjects.slice(0, 2).map((ss) => (
                                <div key={ss.id}>
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                    {ss.subject.name}
                                  </span>
                                </div>
                              ))}
                            {student.studentSubjects && student.studentSubjects.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{student.studentSubjects.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold">${getTotalRevenue(student).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/manager/students/${student.id}`} title="View details">
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/manager/students/${student.id}/edit`} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination Info */}
      {filteredStudents.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          {t("showing")} {filteredStudents.length} {t("of")} {students.length} {t("students")}
        </div>
      )}
    </div>
  )
}
