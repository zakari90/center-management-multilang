/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { receiptActions, studentActions, studentSubjectActions, subjectActions } from "@/lib/dexie/dexieActions"
import { generateObjectId } from "@/lib/utils/generateObjectId"
import { useAuth } from "@/context/authContext"
import { ReceiptType } from "@/lib/dexie/dbSchema"
import ServerActionReceipts from "@/lib/dexie/receiptServerAction"
import { isOnline } from "@/lib/utils/network"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, Plus, Receipt } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// ==================== INTERFACES ====================
interface StudentSubject {
  id: string
  subject: {
    id: string
    name: string
    grade: string
    price: number
  }
}

interface Student {
  id: string
  name: string
  email: string | null
  phone: string | null
  grade: string | null
  studentSubjects: StudentSubject[]
}

interface FormData {
  paymentMethod: "CASH" | "CARD" | "BANK_TRANSFER" | "CHECK" | "MOBILE_PAYMENT"
  description: string
  date: string
  selectedSubjects: string[]
}

interface AddReceiptDialogProps {
  onReceiptAdded?: () => void
  variant?: "default" | "outline" | "secondary"
}

// ==================== MAIN COMPONENT ====================
export default function AddReceiptDialog({ onReceiptAdded, variant = "secondary" }: AddReceiptDialogProps) {
  const t = useTranslations("CreateStudentPaymentForm")
  const tReceipts = useTranslations("ReceiptsTable")
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const [formData, setFormData] = useState<FormData>({
    paymentMethod: "CASH",
    description: "",
    date: new Date().toISOString().split("T")[0],
    selectedSubjects: [],
  })

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("")
      setSelectedStudent(null)
      setFormData({
        paymentMethod: "CASH",
        description: "",
        date: new Date().toISOString().split("T")[0],
        selectedSubjects: [],
      })
      setError("")
    }
  }, [open])

  const fetchStudents = useCallback(async () => {
    try {
      const [allStudents, allStudentSubjects, allSubjects] = await Promise.all([
        studentActions.getAll(),
        studentSubjectActions.getAll(),
        subjectActions.getAll()
      ])

      if (!user) {
        setError("Unauthorized: Please log in again")
        setLoadingStudents(false)
        return
      }

      const managerStudents = allStudents
        .filter(s => s.managerId === user.id && s.status !== '0')

      const studentsWithSubjects: Student[] = managerStudents.map(student => {
        const studentSubjectsForStudent = allStudentSubjects
          .filter(ss => ss.studentId === student.id && ss.status !== '0')
          .map(ss => {
            const subject = allSubjects.find(s => s.id === ss.subjectId)
            return subject ? {
              id: ss.id,
              subject: {
                id: subject.id,
                name: subject.name,
                grade: subject.grade,
                price: subject.price,
              }
            } : null
          })
          .filter(ss => ss !== null) as StudentSubject[]

        return {
          id: student.id,
          name: student.name,
          email: student.email ?? null,
          phone: student.phone ?? null,
          grade: student.grade ?? null,
          studentSubjects: studentSubjectsForStudent,
        }
      })

      setStudents(studentsWithSubjects)
    } catch (err) {
      setError("Failed to load students")
      console.error("Error fetching students:", err)
    } finally {
      setLoadingStudents(false)
    }
  }, [user])

  useEffect(() => {
    if (open) {
      fetchStudents()
    }
  }, [open, fetchStudents])

  const calculateAmount = useCallback(() => {
    if (!selectedStudent) return 0
    return selectedStudent.studentSubjects
      .filter((ss) => formData.selectedSubjects.includes(ss.subject.id))
      .reduce((total, ss) => total + ss.subject.price, 0)
  }, [selectedStudent, formData.selectedSubjects])

  const totalAmount = calculateAmount()

  const handleSubjectToggle = useCallback((subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter((id) => id !== subjectId)
        : [...prev.selectedSubjects, subjectId],
    }))
  }, [])

  const handleSelectAllSubjects = useCallback(() => {
    if (!selectedStudent) return
    const allIds = selectedStudent.studentSubjects.map((ss) => ss.subject.id)
    setFormData((prev) => ({ ...prev, selectedSubjects: allIds }))
  }, [selectedStudent])

  const handleStudentSelect = useCallback((student: Student) => {
    setSelectedStudent(student)
    setFormData((prev) => ({ ...prev, selectedSubjects: [] }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
      setError("")

      if (!user) {
        setError("Unauthorized: Please log in again")
        setIsLoading(false)
        return
      }

      try {
        if (!selectedStudent) throw new Error("Please select a student")
        if (formData.selectedSubjects.length === 0) throw new Error("Please select at least one subject")

        const allStudentSubjects = await studentSubjectActions.getAll()
        const allSubjects = await subjectActions.getAll()

        const studentSubjects = allStudentSubjects.filter(ss =>
          ss.studentId === selectedStudent.id &&
          formData.selectedSubjects.includes(ss.subjectId) &&
          ss.status !== '0'
        )

        if (studentSubjects.length === 0) {
          throw new Error("No valid subjects found")
        }

        const totalAmount = studentSubjects.reduce((sum, ss) => {
          const subject = allSubjects.find(s => s.id === ss.subjectId)
          return sum + (subject?.price || 0)
        }, 0)

        const subjectNames = studentSubjects
          .map(ss => {
            const subject = allSubjects.find(s => s.id === ss.subjectId)
            return subject?.name
          })
          .filter(Boolean)
          .join(', ')
        const finalDescription = formData.description || `Payment for: ${subjectNames}`

        const now = Date.now()
        const receiptId = generateObjectId()
        const receiptDate = formData.date ? new Date(formData.date).getTime() : now

        const newReceipt = {
          id: receiptId,
          receiptNumber: `RCP-${now}`,
          amount: totalAmount,
          type: ReceiptType.STUDENT_PAYMENT,
          paymentMethod: formData.paymentMethod || undefined,
          description: finalDescription,
          date: receiptDate,
          studentId: selectedStudent.id,
          managerId: user.id,
          status: 'w' as const,
          createdAt: now,
          updatedAt: now,
        }

        await receiptActions.putLocal(newReceipt)

        if (isOnline()) {
          try {
            const result = await ServerActionReceipts.SaveToServer(newReceipt as any)
            if (result) {
              await receiptActions.markSynced(receiptId)
            }
          } catch (syncError) {
            console.error("Receipt immediate sync failed, will retry later:", syncError)
          }
        }

        setOpen(false)
        onReceiptAdded?.()
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Something went wrong")
        }
      } finally {
        setIsLoading(false)
      }
    },
    [selectedStudent, formData, user, onReceiptAdded]
  )

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase()
    return (
      student.name.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search) ||
      student.phone?.includes(search) ||
      student.grade?.toLowerCase().includes(search)
    )
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus className="mr-2 h-4 w-4" />
          {tReceipts("studentPayment")}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[950px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Student Selection */}
          <div className="space-y-2">
            <Label className="text-sm">
              {t("findStudent")} <span className="text-destructive">*</span>
            </Label>
            {loadingStudents ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("loadingStudents")}
              </div>
            ) : (
              <>
                {!selectedStudent ? (
                  <>
                    <Input
                      placeholder={t("searchPlaceholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <div className="max-h-[150px] overflow-y-auto border rounded-lg">
                      {filteredStudents.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground p-4">{t("noStudentsFound")}</p>
                      ) : (
                        <ul className="divide-y">
                          {filteredStudents.slice(0, 10).map((student) => (
                            <li key={student.id}>
                              <button
                                type="button"
                                className="w-full p-2 text-left hover:bg-muted/50 transition-colors text-sm"
                                onClick={() => handleStudentSelect(student)}
                              >
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {student.grade} • {student.studentSubjects.length} subjects
                                </p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm">{selectedStudent.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedStudent.grade}</p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(null)
                          setFormData((prev) => ({ ...prev, selectedSubjects: [] }))
                        }}
                      >
                        {t("change")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Subject Selection */}
          {selectedStudent && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">
                  {t("selectSubjects")} <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllSubjects}
                  className="h-7 text-xs"
                >
                  {t("selectAll")}
                </Button>
              </div>

              {selectedStudent.studentSubjects.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{t("noSubjects")}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                  {selectedStudent.studentSubjects.map((ss) => (
                    <Card
                      key={ss.id}
                      onClick={() => handleSubjectToggle(ss.subject.id)}
                      className={`cursor-pointer transition-colors ${
                        formData.selectedSubjects.includes(ss.subject.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
                      }`}
                    >
                      <CardContent className="py-2 px-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{ss.subject.name}</p>
                          <p className="text-xs text-muted-foreground">{ss.subject.grade}</p>
                        </div>
                        <p className="font-bold text-primary text-sm">MAD {ss.subject.price}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payment Details */}
          {formData.selectedSubjects.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("paymentMethod")}</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentMethod: value as FormData["paymentMethod"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">{t("cash")}</SelectItem>
                      <SelectItem value="CARD">{t("card")}</SelectItem>
                      <SelectItem value="BANK_TRANSFER">{t("bankTransfer")}</SelectItem>
                      <SelectItem value="CHECK">{t("check")}</SelectItem>
                      <SelectItem value="MOBILE_PAYMENT">{t("mobilePayment")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("date")}</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t("description")}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder={t("descriptionPlaceholder")}
                  className="text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Payment Summary */}
              <Card className="border-primary bg-primary/5">
                <CardContent className="py-3 px-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{t("paymentSummary")}</span>
                    </div>
                    <span className="text-lg font-bold text-primary">MAD {totalAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.selectedSubjects.length} {t("subjects")} • {formData.paymentMethod}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || formData.selectedSubjects.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Create Receipt
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
