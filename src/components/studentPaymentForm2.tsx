/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Alert,
  AlertDescription
} from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2, QrCode, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

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

export default function CreateStudentPaymentForm() {
  const t = useTranslations('CreateStudentPaymentForm')
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedStudentId = searchParams.get('studentId')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // QR Scanner states
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const readerRef = useRef<any>(null) // Store QR reader reference

  const [formData, setFormData] = useState({
    paymentMethod: 'CASH',
    description: '',
    date: new Date().toISOString().split('T')[0],
    selectedSubjects: [] as string[]
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (preSelectedStudentId && students.length > 0) {
      const student = students.find(s => s.id === preSelectedStudentId)
      if (student) setSelectedStudent(student)
    }
  }, [preSelectedStudentId, students])

  useEffect(() => {
    if (showQrScanner) {
      startScanning()
    }
    return () => {
      stopScanning()
    }
  }, [showQrScanner])

  const fetchStudents = async () => {
    try {
      const { data } = await axios.get('/api/students')
      setStudents(data)
    } catch {
      setError('Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  const calculateAmount = () => {
    if (!selectedStudent) return 0
    return selectedStudent.studentSubjects
      .filter(ss => formData.selectedSubjects.includes(ss.subject.id))
      .reduce((t, ss) => t + ss.subject.price, 0)
  }

  const totalAmount = calculateAmount()

  const handleSubjectToggle = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId]
    }))
  }

  const handleSelectAllSubjects = () => {
    if (!selectedStudent) return
    const allIds = selectedStudent.studentSubjects.map(ss => ss.subject.id)
    setFormData(prev => ({ ...prev, selectedSubjects: allIds }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!selectedStudent) throw new Error('Please select a student')
      if (formData.selectedSubjects.length === 0)
        throw new Error('Please select at least one subject')

      await axios.post('/api/receipts/student-payment', {
        studentId: selectedStudent.id,
        subjectIds: formData.selectedSubjects,
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        date: formData.date
      })

      await router.push(preSelectedStudentId ? `/students/${preSelectedStudentId}` : '/receipts')
      router.refresh()
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to create receipt')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ========== QR SCANNING ==========
  const startScanning = async () => {
    try {
      setQrError(null)
      
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        
        // Add event listener when video is ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => {
              // Start QR scanning once video is playing
              scanQRCode()
            })
            .catch(err => {
              console.error('Error playing video:', err)
              setQrError('Unable to play video stream')
            })
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setQrError('Camera permission denied. Please allow camera access in your browser settings.')
        } else if (err.name === 'NotFoundError') {
          setQrError('No camera found on this device.')
        } else {
          setQrError('Unable to access camera: ' + err.message)
        }
      } else {
        setQrError('Unable to access camera.')
      }
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    // Reset the QR reader
    if (readerRef.current) {
      try {
        readerRef.current.reset()
      } catch (err) {
        console.error('Error resetting reader:', err)
      }
      readerRef.current = null
    }
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop()
        }
      })
      streamRef.current = null
    }
    
    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
  }

const scanQRCode = async () => {
  if (!videoRef.current || !isScanning) return
  
  try {
    const { BrowserQRCodeReader } = await import('@zxing/library')
    const reader = new BrowserQRCodeReader()
    readerRef.current = reader
    
    // Use decodeFromVideoDevice for continuous scanning
    reader.decodeFromVideoDevice(
      null, // deviceId (null = default camera) ✅ Changed from undefined
      videoRef.current,
      (result, error) => {
        if (result) {
          // QR code found!
          console.log('QR Code detected:', result.getText())
          handleQrScan(result.getText())
        }
        
        // Only log errors that aren't "QR code not found"
        if (error && error.name !== 'NotFoundException') {
          console.error('QR Scan error:', error)
        }
      }
    )
  } catch (err) {
    console.error('Scanner initialization error:', err)
    setQrError('Failed to initialize QR scanner')
  }
}


  const handleQrScan = (data: string) => {
    console.log('Processing scanned data:', data)
    
    const student = students.find(
      s => s.id === data || s.email === data || s.phone === data
    )
    
    if (student) {
      setSelectedStudent(student)
      setShowQrScanner(false)
      stopScanning()
      setQrError(null)
      setSearchTerm('')
    } else {
      setQrError(`Student not found for: ${data}`)
      // Don't stop scanning - let them try again
    }
  }

  const filteredStudents = students.filter(student => {
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
          <CardTitle className="text-lg sm:text-2xl">{t('title')}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t('subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Student Finder */}
            <div className="space-y-2">
              <Label>{t('findStudent')} {t('required')} *</Label>
              {loadingStudents ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('loadingStudents')}
                </div>
              ) : (
                <>
                  {/* Search Input + QR button */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('searchPlaceholder')}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      disabled={!!selectedStudent}
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowQrScanner(!showQrScanner)}
                      disabled={!!selectedStudent}
                      className="flex-shrink-0"
                    >
                      <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className='hidden sm:inline ml-2'>{t('qrScan')}</span>
                    </Button>
                  </div>

                  {showQrScanner && (
                    <div className="border rounded-lg p-3 sm:p-4 bg-white space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">{t('pointCamera')}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowQrScanner(false)
                            stopScanning()
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-lg bg-black aspect-video object-cover"
                      />
                      {qrError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs sm:text-sm">
                            {qrError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Student List */}
                  {!selectedStudent && (
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      {filteredStudents.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground p-4">
                          {t('noStudentsFound')}
                        </p>
                      ) : (
                        filteredStudents.map(student => (
                          <div
                            key={student.id}
                            className="p-3 border-b hover:bg-gray-50 cursor-pointer text-sm sm:text-base"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.email || student.phone || ''}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {selectedStudent && (
                    <div className="p-3 sm:p-4 bg-blue-50 border rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div>
                          <p className="font-semibold text-sm sm:text-base">{selectedStudent.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {selectedStudent.email || selectedStudent.phone}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudent(null)}
                          className="w-full sm:w-auto"
                        >
                          {t('change')}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Subjects */}
            {selectedStudent && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <Label>{t('selectSubjects')} {t('required')}*</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllSubjects}
                      className="w-full sm:w-auto"
                    >
                      {t('selectAll')}
                    </Button>
                  </div>

                  {selectedStudent.studentSubjects.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('noSubjects')}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {selectedStudent.studentSubjects.map(ss => (
                        <Card
                          key={ss.id}
                          onClick={() => handleSubjectToggle(ss.subject.id)}
                          className={`cursor-pointer transition-colors ${
                            formData.selectedSubjects.includes(ss.subject.id)
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-gray-400'
                          }`}
                        >
                          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div>
                              <p className="font-semibold text-sm sm:text-base">{ss.subject.name}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {ss.subject.grade}
                              </p>
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

            {/* Payment Details */}
            {formData.selectedSubjects.length > 0 && (
              <>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">{t('paymentMethod')} {t('required')}</Label>
                    <select
                      value={formData.paymentMethod}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          paymentMethod: e.target.value
                        }))
                      }
                      className="w-full border rounded-md p-2 text-sm"
                    >
                      <option value="CASH">{t('cash')}</option>
                      <option value="CARD">{t('card')}</option>
                      <option value="BANK_TRANSFER">{t('bank_transfer')}</option>
                      <option value="CHECK">{t('check')}</option>
                      <option value="MOBILE_PAYMENT">{t('mobile_payment')}</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm">{t('date')} {t('required')}</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, date: e.target.value }))
                      }
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">{t('description')}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        description: e.target.value
                      }))
                    }
                    placeholder={t('descriptionPlaceholder')}
                    className="text-sm"
                  />
                </div>

                <Card className="bg-primary/5 border-primary">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      {t('paymentSummary')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p><strong>{t('student')}:</strong> {selectedStudent?.name}</p>
                    <p><strong>{t('subjects')}:</strong> {formData.selectedSubjects.length}</p>
                    <p><strong>{t('method')}:</strong> {formData.paymentMethod}</p>
                    <p><strong>{t('date')}:</strong> {new Date(formData.date).toLocaleDateString()}</p>
                    <Separator className="my-2" />
                    <p className="text-base sm:text-lg font-bold text-primary">
                      {t('total')}: MAD {totalAmount.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || !selectedStudent || formData.selectedSubjects.length === 0
              }
              className="w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('createReceipt')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
