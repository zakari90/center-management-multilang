"use client"

import AddStudentDialog from "@/components/AddStudentDialog"
import { EntitySyncControls } from "@/components/EntitySyncControls"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/authContext"
import { studentActions, studentSubjectActions, subjectActions, teacherActions } from "@/lib/dexie/dexieActions"
import { ChevronDown, Loader2, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useState } from "react"
import PageHeader from "./page-header"

import { StudentsCardsView } from "./students/StudentsCardsView"
import { StudentsStats } from "./students/StudentsStats"
import { StudentsTableView } from "./students/StudentsTableView"

export interface StudentSubject {
  id: string
  subject: {
    id: string
    name: string
    grade: string
    price: number
  }
  teacher: {
    id: string
    name: string
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
  const { user, isLoading: authLoading } = useAuth() // ✅ Get current user and loading state from AuthContext
  
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [gradeFilter, setGradeFilter] = useState<string>("all")
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    contact: true,
    parent: true,
    subjects: true,
    monthlyFee: true,
    actions: true,
  })

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      
      // Only proceed if auth has finished loading and user is available
      if (!user && !authLoading) {
        setError(t("unauthorized"))
        setLoading(false)
        return
      }
      
      if (!user?.id) {
        setError(t("unauthorized"))
        setLoading(false)
        return
      }

      // ✅ Fetch from local DB and join with subjects and teachers
      const [allStudents, allStudentSubjects, allSubjects, allTeachers] = await Promise.all([
        studentActions.getAll(),
        studentSubjectActions.getAll(),
        subjectActions.getAll(),
        teacherActions.getAll()
      ])

      // ✅ Filter students by status only (managers see ALL students)
      const managerStudents = allStudents
        .filter(s => s.status !== '0')

      // ✅ Build students with subjects
      const studentsWithSubjects: Student[] = managerStudents.map(student => {
        const studentSubjectsForStudent = allStudentSubjects
          .filter(ss => ss.studentId === student.id && ss.status !== '0')
          .map(ss => {
            const subject = allSubjects.find(s => s.id === ss.subjectId && s.status !== '0')
            const teacher = allTeachers.find(t => t.id === ss.teacherId && t.status !== '0')
            return subject ? {
              id: ss.id,
              subject: {
                id: subject.id,
                name: subject.name,
                grade: subject.grade,
                price: subject.price,
              },
              teacher: teacher ? {
                id: teacher.id,
                name: teacher.name,
              } : undefined,
            } : null
          })
          .filter(ss => ss !== null) as StudentSubject[]

        return {
          id: student.id,
          name: student.name,
          email: student.email ?? null,
          phone: student.phone ?? null,
          parentName: student.parentName ?? null,
          parentPhone: student.parentPhone ?? null,
          parentEmail: student.parentEmail ?? null,
          grade: student.grade ?? null,
          createdAt: new Date(student.createdAt).toISOString(),
          studentSubjects: studentSubjectsForStudent,
        }
      })

      setStudents(studentsWithSubjects)
      setError("")

      // ✅ Commented out online fetch
      // const { data } = await axios.get("/api/students")
      // setStudents(data)
    } catch (err) {
      console.error("Error fetching students:", err)
      setError(t("errorFetchStudents"))
    } finally {
      setLoading(false)
    }
  }, [user, authLoading, t])

  useEffect(() => {
    // Wait for auth to finish loading before fetching data
    if (!authLoading) {
      fetchStudents()
    }
  }, [authLoading, fetchStudents])

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

  // Show loading while auth is checking or data is loading
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <AddStudentDialog />
          <EntitySyncControls entity="students" />
        </div>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default">
                 <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={columnVisibility.name}
                onCheckedChange={(value) =>
                  setColumnVisibility(prev => ({ ...prev, name: !!value }))
                }
              >
                {t("name")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.contact}
                onCheckedChange={(value) =>
                  setColumnVisibility(prev => ({ ...prev, contact: !!value }))
                }
              >
                {t("contact")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.parent}
                onCheckedChange={(value) =>
                  setColumnVisibility(prev => ({ ...prev, parent: !!value }))
                }
              >
                {t("parent")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.subjects}
                onCheckedChange={(value) =>
                  setColumnVisibility(prev => ({ ...prev, subjects: !!value }))
                }
              >
                {t("subjects")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.monthlyFee}
                onCheckedChange={(value) =>
                  setColumnVisibility(prev => ({ ...prev, monthlyFee: !!value }))
                }
              >
                {t("monthlyFee")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.actions}
                onCheckedChange={(value) =>
                  setColumnVisibility(prev => ({ ...prev, actions: !!value }))
                }
              >
                {t("actions")}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      {/* Stats Cards */}
      <StudentsStats 
        totalStudents={totalStudents}
        filteredCount={filteredStudents.length}
        totalRevenue={totalRevenue}
        averageSubjects={averageSubjects}
      />

      {/* Students List - Responsive View */}
      <StudentsTableView 
        students={filteredStudents}
        columnVisibility={columnVisibility}
        getTotalRevenue={getTotalRevenue}
        onUpdate={fetchStudents}
      />
      
      <StudentsCardsView 
        students={filteredStudents}
        getTotalRevenue={getTotalRevenue}
        onUpdate={fetchStudents}
      />
    </div>
  )
}
