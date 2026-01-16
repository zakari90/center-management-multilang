/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { receiptActions, studentActions, studentSubjectActions, subjectActions } from "@/lib/dexie/dexieActions"
import { generateObjectId } from "@/lib/utils/generateObjectId"
import { useAuth } from "@/context/authContext"
import { ReceiptType } from "@/lib/dexie/dbSchema"
import ServerActionReceipts from "@/lib/dexie/receiptServerAction"
import { isOnline } from "@/lib/utils/network"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2, Loader2, QrCode, X, User } from "lucide-react"
import { useTranslations } from "next-intl"
import jsQR from "jsqr"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  parentName: string | null
  parentPhone: string | null
  grade: string | null
  studentSubjects: StudentSubject[]
}

interface FormData {
  paymentMethod: "CASH" | "CARD" | "BANK_TRANSFER" | "CHECK" | "MOBILE_PAYMENT"
  description: string
  date: string
  selectedSubjects: string[]
}

interface AddStudentPaymentDialogProps {
  onPaymentCreated?: () => void
}

function QRScanner({
  qrError,
  onClose,
  onScan,
  t,
}: {
  qrError: string | null
  onClose: () => void
  onScan: (data: string) => void
  t: (key: string) => string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef<boolean>(false)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const stopScanning = useCallback(() => {
    scanningRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        if (track.readyState === "live") track.stop()
      })
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setIsScanning(false)
  }, [])

  const scanQRCode = useCallback(() => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (scanningRef.current) requestAnimationFrame(scanQRCode)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    })

    if (code) {
      onScan(code.data)
      return
    }

    if (scanningRef.current) requestAnimationFrame(scanQRCode)
  }, [onScan])

  const startScanning = useCallback(async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        scanningRef.current = true

        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            ?.play()
            .then(() => {
              setIsScanning(true)
              scanQRCode()
            })
            .catch((err) => {
              console.error("Error playing video:", err)
              setCameraError("Unable to play video stream")
            })
        }
      }
    } catch (err) {
      console.error("Camera error:", err)
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setCameraError("Camera permission denied. Please allow camera access in your browser settings.")
        } else if (err.name === "NotFoundError") {
          setCameraError("No camera found on this device.")
        } else {
          setCameraError("Unable to access camera: " + err.message)
        }
      } else {
        setCameraError("Unable to access camera.")
      }
    }
  }, [scanQRCode])

  useEffect(() => {
    startScanning()
    return () => stopScanning()
  }, [startScanning, stopScanning])

  const displayError = cameraError || qrError

  return (
    <div className="border rounded-lg p-3 sm:p-4 space-y-2">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{t("pointCamera")}</p>
          {isScanning && (
            <span className="flex items-center gap-1 text-xs text-green-600" aria-live="polite">
              <span className="inline-block w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              ...
            </span>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close scanner">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-lg aspect-video object-cover"
          aria-label="Camera feed"
        />
        <canvas ref={canvasRef} className="hidden" />
        {!isScanning && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>
      {displayError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">{displayError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default function AddStudentPaymentDialog({ onPaymentCreated }: AddStudentPaymentDialogProps) {
  const t = useTranslations("CreateStudentPaymentForm")
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    paymentMethod: "CASH",
    description: "",
    date: new Date().toISOString().split("T")[0],
    selectedSubjects: [],
  })

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedStudent(null)
      setSearchTerm("")
      setShowQrScanner(false)
      setQrError(null)
      setError("")
      setFormData({
        paymentMethod: "CASH",
        description: "",
        date: new Date().toISOString().split("T")[0],
        selectedSubjects: [],
      })
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

      const activeStudents = allStudents.filter(s => s.status !== '0')

      const studentsWithSubjects: Student[] = activeStudents.map(student => {
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
          parentName: student.parentName ?? null,
          parentPhone: student.parentPhone ?? null,
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
    setSearchTerm("")
    // Auto-select all subjects
    const allIds = student.studentSubjects.map((ss) => ss.subject.id)
    setFormData((prev) => ({ ...prev, selectedSubjects: allIds }))
  }, [])

  const handleQrScan = useCallback(
    (data: string) => {
      const student = students.find((s) => s.id === data)

      if (student) {
        setSelectedStudent(student)
        setShowQrScanner(false)
        setQrError(null)
        setSearchTerm("")
        // Auto-select all subjects
        const allIds = student.studentSubjects.map((ss) => ss.subject.id)
        setFormData((prev) => ({ ...prev, selectedSubjects: allIds }))
      } else {
        setQrError(`Student not found for ID: ${data.slice(0, 8)}...`)
      }
    },
    [students],
  )

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

        // Close dialog and notify parent
        setOpen(false)
        onPaymentCreated?.()
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
    [selectedStudent, formData, user, onPaymentCreated],
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
        <Button className="flex-1 bg-primary hover:bg-primary/45">
          {t("studentPayment") || "Student Payment"}
        </Button>
      </DialogTrigger>
<DialogContent className="w-[95vw] lg:w-[80vw] h-fit max-h-[90dvh] lg:h-[80dvh] max-w-none lg:max-w-7xl flex flex-col overflow-hidden">        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {loadingStudents ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4 flex-1 overflow-y-auto">
              {/* Left Column - Student Selection */}
              <div className="lg:col-span-2 space-y-6">
                {/* Student Selection Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {t("findStudent")}
                    </CardTitle>
                    <CardDescription>{t("searchOrScanStudent")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!selectedStudent && (
                      <>
                        <div className="flex gap-2">
                          <Input
                            placeholder={t("searchPlaceholder")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowQrScanner(!showQrScanner)}
                          >
                            <QrCode className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">{t("qrScan")}</span>
                          </Button>
                        </div>

                        {showQrScanner && <QRScanner qrError={qrError} onClose={() => setShowQrScanner(false)} onScan={handleQrScan} t={t} />}

                        {!showQrScanner && (
                          <div className="max-h-64 overflow-y-auto border rounded-lg">
                            {filteredStudents.length === 0 ? (
                              <p className="text-sm text-center text-muted-foreground p-4">{t("noStudentsFound")}</p>
                            ) : (
                              <div className="divide-y">
                                {filteredStudents.map((student) => (
                                  <button
                                    key={student.id}
                                    type="button"
                                    className="w-full p-3 text-left hover:bg-muted transition-colors"
                                    onClick={() => handleStudentSelect(student)}
                                  >
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">{student.email || student.phone || ""}</p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {selectedStudent && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{selectedStudent.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedStudent.email || selectedStudent.phone}</p>
                            {selectedStudent.grade && (
                              <p className="text-xs text-muted-foreground mt-1">Grade: {selectedStudent.grade}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
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
                  </CardContent>
                </Card>

                {/* Subject Selection Card */}
                <Card className={!selectedStudent ? "opacity-60 pointer-events-none" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{t("selectSubjects")}</CardTitle>
                        {!selectedStudent && (
                          <CardDescription className="text-xs text-muted-foreground mt-1">
                            {t("selectStudentFirst")}
                          </CardDescription>
                        )}
                      </div>
                      {selectedStudent && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllSubjects}
                        >
                          {t("selectAll")}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedStudent?.studentSubjects.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{t("noSubjects")}</AlertDescription>
                      </Alert>
                    ) : selectedStudent ? (
                      <div className="space-y-2 max-h-48 sm:max-h-64 lg:max-h-96 overflow-y-auto">
                        {selectedStudent.studentSubjects.map((ss) => (
                          <Card
                            key={ss.id}
                            onClick={() => handleSubjectToggle(ss.subject.id)}
                            className={`cursor-pointer transition-colors ${
                              formData.selectedSubjects.includes(ss.subject.id)
                                ? "border-primary bg-primary/5"
                                : "hover:border-gray-400"
                            }`}
                          >
                            <CardContent className="p-3 sm:p-4 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={formData.selectedSubjects.includes(ss.subject.id)}
                                  onChange={() => { }}
                                  className="h-4 w-4 rounded"
                                />
                                <div>
                                  <p className="font-semibold">{ss.subject.name}</p>
                                  <p className="text-sm text-muted-foreground">{ss.subject.grade}</p>
                                </div>
                              </div>
                              <p className="font-bold text-primary">MAD {ss.subject.price.toFixed(2)}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t("selectStudentFirst")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Payment Details */}
              <div className="space-y-6">
                {/* Payment Details Card */}
                <Card className={formData.selectedSubjects.length === 0 ? "opacity-60 pointer-events-none" : ""}>
                  <CardHeader>
                    <CardTitle>{t("paymentDetails")}</CardTitle>
                    {formData.selectedSubjects.length === 0 && (
                      <CardDescription className="text-xs">{t("selectSubjectsFirst")}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">{t("paymentMethod")}</Label>
                      <Select
                        value={formData.paymentMethod}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentMethod: value as FormData["paymentMethod"],
                          }))
                        }
                      >
                        <SelectTrigger id="paymentMethod">
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

                    <div className="space-y-2">
                      <Label htmlFor="date">{t("date")}</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">{t("description")}</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder={t("descriptionPlaceholder")}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Summary Card */}
                {formData.selectedSubjects.length > 0 && selectedStudent && (
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        {t("paymentSummary")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("student")}:</span>
                        <span className="font-medium">{selectedStudent.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("subjects")}:</span>
                        <span className="font-medium">{formData.selectedSubjects.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("method")}:</span>
                        <span className="font-medium">{formData.paymentMethod}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-semibold">{t("total")}:</span>
                        <span className="text-2xl font-bold text-primary">MAD {totalAmount.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 mt-4 border-t pt-4 sticky bottom-0 bg-background">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !selectedStudent || formData.selectedSubjects.length === 0}
                className="bg-primary"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("createPayment")}
              </Button>
            </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
