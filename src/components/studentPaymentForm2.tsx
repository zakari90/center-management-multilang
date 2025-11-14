"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
// import axios from "axios" // ✅ Commented out - using local DB
import { useRouter, useSearchParams } from "next/navigation"
import { receiptActions, studentActions, studentSubjectActions, subjectActions } from "@/lib/dexie/_dexieActions"
import { generateObjectId } from "@/lib/utils/generateObjectId"
import { useAuth } from "@/context/authContext"
import { ReceiptType } from "@/lib/dexie/dbSchema"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2, Loader2, QrCode, X } from "lucide-react"
import { useTranslations } from "next-intl"
import jsQR from "jsqr"

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
      console.log("QR Code detected:", code.data)
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
        <canvas ref={canvasRef} className="hiddenden" />
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

function StudentSelector({
  selectedStudent,
  searchTerm,
  filteredStudents,
  loadingStudents,
  showQrScanner,
  qrError,
  onSearchChange,
  onStudentSelect,
  onStudentChange,
  onQrToggle,
  onQrScan,
  t,
}: {
  selectedStudent: Student | null
  searchTerm: string
  filteredStudents: Student[]
  loadingStudents: boolean
  showQrScanner: boolean
  qrError: string | null
  onSearchChange: (value: string) => void
  onStudentSelect: (student: Student) => void
  onStudentChange: () => void
  onQrToggle: () => void
  onQrScan: (data: string) => void
  t: (key: string) => string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="student-search">
        {t("findStudent")} <span className="text-red-500">*</span>
      </Label>
      {loadingStudents ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t("loadingStudents")}
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <Input
              id="student-search"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={!!selectedStudent}
              className="text-sm"
              aria-label="Search for student"
            />
            <Button
              type="button"
              variant="outline"
              onClick={onQrToggle}
              disabled={!!selectedStudent}
              className="flex-shrink-0"
              aria-label={t("qrScan")}
            >
              <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline ml-2">{t("qrScan")}</span>
            </Button>
          </div>

          {showQrScanner && <QRScanner qrError={qrError} onClose={onQrToggle} onScan={onQrScan} t={t} />}

          {!selectedStudent && !showQrScanner && (
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {filteredStudents.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground p-4">{t("noStudentsFound")}</p>
              ) : (
                <ul className="divide-y">
                  {filteredStudents.map((student) => (
                    <li key={student.id}>
                      <button
                        type="button"
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors text-sm sm:text-base"
                        onClick={() => onStudentSelect(student)}
                        aria-label={`Select ${student.name}`}
                      >
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email || student.phone || ""}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {selectedStudent && (
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <p className="font-semibold text-sm sm:text-base">{selectedStudent.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {selectedStudent.email || selectedStudent.phone}
                  </p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={onStudentChange} className="w-full sm:w-auto">
                  {t("change")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PaymentSummary({
  selectedStudent,
  selectedSubjectsCount,
  paymentMethod,
  date,
  totalAmount,
  t,
}: {
  selectedStudent: Student | null
  selectedSubjectsCount: number
  paymentMethod: string
  date: string
  totalAmount: number
  t: (key: string) => string
}) {
  return (
    <Card className=" border-primary">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" aria-hidden="true" />
          {t("paymentSummary")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>
          <strong>{t("student")}:</strong> {selectedStudent?.name}
        </p>
        <p>
          <strong>{t("subjects")}:</strong> {selectedSubjectsCount}
        </p>
        <p>
          <strong>{t("method")}:</strong> {paymentMethod}
        </p>
        <p>
          <strong>{t("date")}:</strong> {new Date(date).toLocaleDateString()}
        </p>
        <Separator className="my-2" />
        <p className="text-base sm:text-lg font-bold text-primary">
          {t("total")}: MAD {totalAmount.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  )
}

export default function CreateStudentPaymentForm() {
  const t = useTranslations("CreateStudentPaymentForm")
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedStudentId = searchParams.get("studentId")
  const { user } = useAuth() // ✅ Get current user from AuthContext

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

  const subjectsRef = useRef<HTMLDivElement>(null)

  const fetchStudents = useCallback(async () => {
    try {
      // ✅ Fetch from local DB and join with subjects
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

      // ✅ Filter students by managerId and status
      const managerStudents = allStudents
        .filter(s => s.managerId === user.id && s.status !== '0')

      // ✅ Build students with subjects
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
          parentName: student.parentName ?? null,
          parentPhone: student.parentPhone ?? null,
          grade: student.grade ?? null,
          studentSubjects: studentSubjectsForStudent,
        }
      })

      setStudents(studentsWithSubjects)

      // ✅ Commented out online fetch
      // const { data } = await axios.get("/api/students")
      // setStudents(data)
    } catch (err) {
      setError("Failed to load students")
      console.error("Error fetching students:", err)
    } finally {
      setLoadingStudents(false)
    }
  }, [user])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    if (preSelectedStudentId && students.length > 0) {
      const student = students.find((s) => s.id === preSelectedStudentId)
      if (student) setSelectedStudent(student)
    }
  }, [preSelectedStudentId, students])

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
    setTimeout(() => {
      subjectsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }, [])

  const handleQrScan = useCallback(
    (data: string) => {
      console.log("Processing scanned data:", data)

      // Find student by ID (the QR code contains the student ID)
      const student = students.find((s) => s.id === data)

      if (student) {
        setSelectedStudent(student)
        setShowQrScanner(false)
        setQrError(null)
        setSearchTerm("")
        setTimeout(() => {
          subjectsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 100)
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

        // ✅ Get student subjects from local DB
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

        // ✅ Calculate total amount
        const totalAmount = studentSubjects.reduce((sum, ss) => {
          const subject = allSubjects.find(s => s.id === ss.subjectId)
          return sum + (subject?.price || 0)
        }, 0)

        // ✅ Create description if not provided
        const subjectNames = studentSubjects
          .map(ss => {
            const subject = allSubjects.find(s => s.id === ss.subjectId)
            return subject?.name
          })
          .filter(Boolean)
          .join(', ')
        const finalDescription = formData.description || `Payment for: ${subjectNames}`

        // ✅ Create receipt in local DB
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
          status: 'w' as const, // Waiting for sync
          createdAt: now,
          updatedAt: now,
        }

        await receiptActions.putLocal(newReceipt)

        // ✅ Navigate to receipts page
        await router.push(preSelectedStudentId ? `/manager/students/${preSelectedStudentId}` : "/manager/receipts")
        router.refresh()

        // ✅ Commented out online creation
        // await axios.post("/api/receipts/student-payment", {
        //   studentId: selectedStudent.id,
        //   subjectIds: formData.selectedSubjects,
        //   paymentMethod: formData.paymentMethod,
        //   description: formData.description,
        //   date: formData.date,
        // })
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
    [selectedStudent, formData, preSelectedStudentId, router, user],
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
    <div className="max-w-4xl mx-auto p-3 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-2xl">{t("title")}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t("subtitle")}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <StudentSelector
              selectedStudent={selectedStudent}
              searchTerm={searchTerm}
              filteredStudents={filteredStudents}
              loadingStudents={loadingStudents}
              showQrScanner={showQrScanner}
              qrError={qrError}
              onSearchChange={setSearchTerm}
              onStudentSelect={handleStudentSelect}
              onStudentChange={() =>{
                setSelectedStudent(null)
                router.refresh()}}
              onQrToggle={() => setShowQrScanner(!showQrScanner)}
              onQrScan={handleQrScan}
              t={t}
            />

            {selectedStudent && (
              <>
                <Separator />
                <div className="space-y-4" ref={subjectsRef}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <Label htmlFor="subjects-list">
                      {t("selectSubjects")} <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllSubjects}
                      className="w-full sm:w-auto"
                    >
                      {t("selectAll")}
                    </Button>
                  </div>

                  {selectedStudent.studentSubjects.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      <AlertDescription>{t("noSubjects")}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2" id="subjects-list" role="group" aria-label="Available subjects">
                      {selectedStudent.studentSubjects.map((ss) => (
                        <Card
                          key={ss.id}
                          onClick={() => handleSubjectToggle(ss.subject.id)}
                          className={`cursor-pointer transition-colors ${
                            formData.selectedSubjects.includes(ss.subject.id)
                              ? "border-primary"
                              : "hover:border-gray-400"
                          }`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              handleSubjectToggle(ss.subject.id)
                            }
                          }}
                          aria-pressed={formData.selectedSubjects.includes(ss.subject.id)}
                          aria-label={`${ss.subject.name}, ${ss.subject.grade}, ${ss.subject.price} MAD`}
                        >
                          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div>
                              <p className="font-semibold text-sm sm:text-base">{ss.subject.name}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">{ss.subject.grade}</p>
                            </div>
                            <p className="font-bold text-primary text-sm sm:text-base">
                              MAD {ss.subject.price.toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {formData.selectedSubjects.length > 0 && (
              <>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment-method" className="text-sm">
                      {t("paymentMethod")} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: value as FormData["paymentMethod"],
                        }))
                      }
                    >
                      <SelectTrigger id="payment-method" className="text-sm">
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
                  <div>
                    <Label htmlFor="payment-date" className="text-sm">
                      {t("date")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="payment-date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                      className="text-sm"
                      aria-label={t("date")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment-description" className="text-sm">
                    {t("description")}
                  </Label>
                  <Textarea
                    id="payment-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder={t("descriptionPlaceholder")}
                    className="text-sm"
                    aria-label={t("description")}
                  />
                </div>

                <PaymentSummary
                  selectedStudent={selectedStudent}
                  selectedSubjectsCount={formData.selectedSubjects.length}
                  paymentMethod={formData.paymentMethod}
                  date={formData.date}
                  totalAmount={totalAmount}
                  t={t}
                />
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedStudent || formData.selectedSubjects.length === 0}
              className="w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {t("createReceipt")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
