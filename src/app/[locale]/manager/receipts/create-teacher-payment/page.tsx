/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { teacherActions, teacherSubjectActions, studentSubjectActions, subjectActions, receiptActions } from '@/lib/dexie/dexieActions'
import { useAuth } from '@/context/authContext'
import { generateObjectId } from '@/lib/utils/generateObjectId'
import { ReceiptType } from '@/lib/dexie/dbSchema'
// import axios from 'axios' // ✅ Commented out - using local DB
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface SubjectStats {
  subjectId: string
  subjectName: string
  grade: string
  price: number
  percentage: number | null
  hourlyRate: number | null
  enrolledStudents: number
  calculatedAmount: number
}

interface Teacher {
  id: string
  name: string
  email: string | null
}

interface TeacherPaymentData {
  teacher: Teacher
  subjects: SubjectStats[]
  totalAmount: number
}

export default function CreateTeacherPaymentForm() {
  const t = useTranslations('TeacherPayment')
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedTeacherId = searchParams.get('teacherId')
  const { user } = useAuth() // ✅ Get current user from AuthContext
  
  const [isLoading, setIsLoading] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  const [loadingCalculation, setLoadingCalculation] = useState(false)
  const [error, setError] = useState('')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [paymentData, setPaymentData] = useState<TeacherPaymentData | null>(null)
  
  const [formData, setFormData] = useState({
    teacherId: preSelectedTeacherId || '',
    paymentMethod: 'BANK_TRANSFER',
    description: '',
    date: new Date().toISOString().split('T')[0],
    selectedSubjects: [] as string[], // Subject IDs to include in payment
  })

  useEffect(() => {
    fetchTeachers()
  }, [user])

  useEffect(() => {
    if (formData.teacherId) {
      calculateTeacherPayment()
    }
  }, [formData.teacherId])

  const fetchTeachers = async () => {
    try {
      if (!user) {
        setError("Unauthorized: Please log in again")
        setLoadingTeachers(false)
        return
      }

      // ✅ Fetch from local DB
      const allTeachers = await teacherActions.getAll()
      
      // ✅ Filter teachers by managerId and status
      const managerTeachers = allTeachers
        .filter(t => t.managerId === user.id && t.status !== '0')
        .map(t => ({
          id: t.id,
          name: t.name,
          email: t.email ?? null,
        }))

      setTeachers(managerTeachers)

      // ✅ Commented out online fetch
      // const { data } = await axios.get('/api/teachers')
      // setTeachers(data)
    } catch (err) {
      console.error('Failed to fetch teachers:', err)
      setError(t('errorloadTeachers'))
    } finally {
      setLoadingTeachers(false)
    }
  }

  const calculateTeacherPayment = async () => {
    setLoadingCalculation(true)
    try {
      if (!user) {
        setError("Unauthorized: Please log in again")
        setLoadingCalculation(false)
        return
      }

      // ✅ Fetch from local DB
      const [allTeacherSubjects, allStudentSubjects, allSubjects, allTeachers] = await Promise.all([
        teacherSubjectActions.getAll(),
        studentSubjectActions.getAll(),
        subjectActions.getAll(),
        teacherActions.getAll()
      ])

      const selectedTeacher = allTeachers.find(t => t.id === formData.teacherId && t.status !== '0')
      if (!selectedTeacher) {
        throw new Error('Teacher not found')
      }

      // ✅ Get teacher subjects for this teacher
      const teacherSubjects = allTeacherSubjects
        .filter(ts => ts.teacherId === formData.teacherId && ts.status !== '0')

      // ✅ Calculate payment for each subject
      const subjectsStats: SubjectStats[] = teacherSubjects.map(ts => {
        const subject = allSubjects.find(s => s.id === ts.subjectId && s.status !== '0')
        if (!subject) return null

        // ✅ Count enrolled students for this teacher-subject combination
        const enrolledStudents = allStudentSubjects.filter(ss =>
          ss.subjectId === ts.subjectId &&
          ss.teacherId === formData.teacherId &&
          ss.status !== '0'
        ).length

        let calculatedAmount = 0
        if (ts.percentage) {
          calculatedAmount = (subject.price * ts.percentage / 100) * enrolledStudents
        } else if (ts.hourlyRate) {
          calculatedAmount = ts.hourlyRate * enrolledStudents
        }

        return {
          subjectId: ts.subjectId,
          subjectName: subject.name,
          grade: subject.grade,
          price: subject.price,
          percentage: ts.percentage ?? null,
          hourlyRate: ts.hourlyRate ?? null,
          enrolledStudents,
          calculatedAmount,
        }
      }).filter(s => s !== null) as SubjectStats[]

      const totalAmount = subjectsStats.reduce((sum, s) => sum + s.calculatedAmount, 0)

      const paymentDataResult: TeacherPaymentData = {
        teacher: {
          id: selectedTeacher.id,
          name: selectedTeacher.name,
          email: selectedTeacher.email ?? null,
        },
        subjects: subjectsStats,
        totalAmount,
      }

      setPaymentData(paymentDataResult)
      
      // Auto-select all subjects by default
      setFormData(prev => ({
        ...prev,
        selectedSubjects: subjectsStats.map(s => s.subjectId)
      }))

      // ✅ Commented out online calculation
      // const { data } = await axios.get(`/api/teachers/${formData.teacherId}/payment-calculation`)
      // setPaymentData(data)
    } catch (err) {
      console.error('Failed to calculate payment:', err)
      setError(t('errorcalcPayment'))
    } finally {
      setLoadingCalculation(false)
    }
  }

  const calculateTotalAmount = () => {
    if (!paymentData) return 0
    
    return paymentData.subjects
      .filter(s => formData.selectedSubjects.includes(s.subjectId))
      .reduce((total, s) => total + s.calculatedAmount, 0)
  }

  const totalAmount = calculateTotalAmount()

  const handleSubjectToggle = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId]
    }))
  }

  const handleSelectAllSubjects = () => {
    if (!paymentData) return
    
    setFormData(prev => ({
      ...prev,
      selectedSubjects: paymentData.subjects.map(s => s.subjectId)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!user) {
        throw new Error('Unauthorized: Please log in again')
      }

      if (!formData.teacherId) {
        throw new Error('Please select a teacher')
      }

      if (formData.selectedSubjects.length === 0) {
        throw new Error('Please select at least one subject to include in payment')
      }

      if (!paymentData) {
        throw new Error('Payment data not calculated')
      }

      // ✅ Calculate total amount from selected subjects
      const selectedSubjectsData = paymentData.subjects.filter(s =>
        formData.selectedSubjects.includes(s.subjectId)
      )
      const totalAmount = selectedSubjectsData.reduce((sum, s) => sum + s.calculatedAmount, 0)

      // ✅ Create description if not provided
      const subjectDetails = selectedSubjectsData.map(s =>
        `${s.subjectName} (${s.enrolledStudents} students): $${s.calculatedAmount.toFixed(2)}`
      )
      const finalDescription = formData.description || `Payment for: ${subjectDetails.join(', ')}`

      // ✅ Create receipt in local DB
      const now = Date.now()
      const receiptId = generateObjectId()
      const receiptDate = formData.date ? new Date(formData.date).getTime() : now

      const newReceipt = {
        id: receiptId,
        receiptNumber: `RCP-${now}`,
        amount: totalAmount,
        type: ReceiptType.TEACHER_PAYMENT,
        paymentMethod: formData.paymentMethod || undefined,
        description: finalDescription,
        date: receiptDate,
        teacherId: formData.teacherId,
        managerId: user.id,
        status: 'w' as const, // Waiting for sync
        createdAt: now,
        updatedAt: now,
      }

      await receiptActions.putLocal(newReceipt)

      router.push('/manager/receipts')
      router.refresh()

      // ✅ Commented out online creation
      // await axios.post('/api/receipts/teacher-payment', {
      //   teacherId: formData.teacherId,
      //   subjectIds: formData.selectedSubjects,
      //   paymentMethod: formData.paymentMethod,
      //   description: formData.description,
      //   date: formData.date,
      // })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(t('errorgeneric'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Teacher Selection */}
            <div className="space-y-2">
              <Label htmlFor="teacherId">{t('teacherlabel')}</Label>
              {loadingTeachers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <Select
                  value={formData.teacherId}
                  onValueChange={(value) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      teacherId: value,
                      selectedSubjects: []
                    }))
                    setPaymentData(null)
                  }}
                  disabled={!!preSelectedTeacherId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('teacherplaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {paymentData && (
                <p className="text-sm text-muted-foreground">
                  {t('teacheremail')}: {paymentData.teacher.email || t('teachernoEmail')}
                </p>
              )}
            </div>

            {/* Subject Breakdown */}
            {loadingCalculation && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
           {paymentData && !loadingCalculation && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>{t('subjectsselectLabel')}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllSubjects}
                    >
                      {t('subjectsselectAll')}
                    </Button>
                  </div>

                  {paymentData.subjects.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{t('subjectsnone')}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {paymentData.subjects.map(subject => (
                        <Card
                          key={subject.subjectId}
                          className={`cursor-pointer transition-colors ${
                            formData.selectedSubjects.includes(subject.subjectId)
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-gray-400'
                          }`}
                          onClick={() => handleSubjectToggle(subject.subjectId)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={formData.selectedSubjects.includes(subject.subjectId)}
                                  onChange={() => {}}
                                  className="h-4 w-4 rounded border-gray-300 mt-1"
                                />
                                <div className="flex-1">
                                  <p className="font-semibold">{subject.subjectName}</p>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {subject.grade}
                                  </p>

                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <Badge variant="outline">
                                      {t('subjectsprice', { price: subject.price.toFixed(2) })}
                                    </Badge>
                                    <Badge variant="outline">
                                      {subject.percentage
                                        ? t('subjectspercentage', { percentage: subject.percentage })
                                        : t('subjectshourly', { hourlyRate: subject.hourlyRate || "" })}
                                    </Badge>
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {t('subjectsstudents', {
                                        count: subject.enrolledStudents,
                                      })}
                                    </Badge>
                                  </div>

                                  {subject.percentage && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {t('subjectscalculation', {
                                        price: subject.price,
                                        percentage: subject.percentage,
                                        students: subject.enrolledStudents,
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">
                                  ${subject.calculatedAmount.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {formData.selectedSubjects.length > 0 && paymentData && (
              <>
                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">{t('paymentmethod')}</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={value => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">{t('paymentmethodbank')}</SelectItem>
                        <SelectItem value="CASH">{t('paymentmethodcash')}</SelectItem>
                        <SelectItem value="CHECK">{t('paymentmethodcheck')}</SelectItem>
                        <SelectItem value="MOBILE_PAYMENT">
                          {t('paymentmethodmobile')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">{t('paymentdate')}</Label>
                    <Input
                      type="date"
                      id="date"
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('paymentdescription')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder={t('paymentdescriptionplaceholder')}
                    rows={3}
                  />
                </div>

                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-orange-600" />
                      {t('summarytitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('summaryteacher')}</span>
                      <span className="font-medium">{paymentData.teacher.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('summarysubjects')}</span>
                      <span className="font-medium">{formData.selectedSubjects.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('summarymethod')}</span>
                      <span className="font-medium">{formData.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('summarydate')}</span>
                      <span className="font-medium">
                        {new Date(formData.date).toLocaleDateString()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">{t('summarytotal')}</span>
                      <span className="text-2xl font-bold text-orange-600">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              {t('buttonscancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || formData.selectedSubjects.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('buttonscreate')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}