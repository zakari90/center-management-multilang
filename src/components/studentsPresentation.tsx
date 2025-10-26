/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { Loader2, Eye, Pencil, Search, WifiOff, RefreshCw, Users, GraduationCap, DollarSign } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useOfflineStudents, Student } from "@/hooks/useOfflineStudents"

export default function StudentsTable() {
  const t = useTranslations("StudentsTable")
  
  const { 
    students, 
    isOnline, 
    isSyncing, 
    pendingCount, 
    forceSync 
  } = useOfflineStudents()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [gradeFilter, setGradeFilter] = useState<string>("all")

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.includes(searchTerm) ||
      student.parentName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter

    return matchesSearch && matchesGrade
  })

  const grades = ["all", ...new Set(students.map((s) => s.grade).filter(Boolean))]

  const getTotalRevenue = (student: Student) => {
    if (!student?.studentSubjects) return 0
    return student.studentSubjects.reduce((total, ss) => total + (ss?.subject?.price ?? 0), 0)
  }

  const totalStudents = students.length
  const totalRevenue = students.reduce((sum, student) => sum + getTotalRevenue(student), 0)
  const averageSubjects = totalStudents > 0 
    ? students.reduce((sum, s) => sum + (s.studentSubjects?.length || 0), 0) / totalStudents 
    : 0

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Offline Warning */}
      {!isOnline && (
        <Alert className="mb-4 border-orange-500 bg-orange-50">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            أنت غير متصل بالإنترنت. التغييرات ستُزامن تلقائياً عند عودة الاتصال.
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Changes */}
      {pendingCount > 0 && (
        <Alert className="mb-4 border-blue-500 bg-blue-50">
          <AlertDescription className="text-blue-800">
            {pendingCount} {t("pendingChanges") || "تغيير في انتظار المزامنة"}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">{t("student")}</h1>
            <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={forceSync}
              disabled={!isOnline || isSyncing}
              variant="outline"
              size="sm"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("syncing") || "جارٍ المزامنة..."}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("sync") || "مزامنة"}
                </>
              )}
            </Button>
            <Button asChild>
              <Link href="/manager/students/create">{t("addStudent")}</Link>
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalStudents")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredStudents.length} {t("filtered")}
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

      {/* Students Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t("name")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t("contact")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t("parent")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t("subjects")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t("monthlyFee")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    {t("noStudents")}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {student.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{student.name}</div>
                            {!student.synced && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                غير مُزامن
                              </Badge>
                            )}
                          </div>
                          {student.grade && (
                            <div className="text-sm text-muted-foreground">{student.grade}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{student.email || "-"}</div>
                      <div className="text-sm text-muted-foreground">{student.phone || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{student.parentName || "-"}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.parentPhone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">
                        {student.studentSubjects?.length || 0} {t("subjects")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">MAD {getTotalRevenue(student).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/manager/students/${student.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/manager/students/${student.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
