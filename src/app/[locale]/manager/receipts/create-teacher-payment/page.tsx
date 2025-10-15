'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedTeacherId = searchParams.get('teacherId')
  
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
  }, [])

  useEffect(() => {
    if (formData.teacherId) {
      calculateTeacherPayment()
    }
  }, [formData.teacherId])

  const fetchTeachers = async () => {
    try {
      const { data } = await axios.get('/api/teachers')
      setTeachers(data)
    } catch (err) {
      console.error('Failed to fetch teachers:', err)
      setError('Failed to load teachers')
    } finally {
      setLoadingTeachers(false)
    }
  }

  const calculateTeacherPayment = async () => {
    setLoadingCalculation(true)
    try {
      const { data } = await axios.get(`/api/teachers/${formData.teacherId}/payment-calculation`)
      setPaymentData(data)
      
      // Auto-select all subjects by default
      setFormData(prev => ({
        ...prev,
        selectedSubjects: data.subjects.map((s: SubjectStats) => s.subjectId)
      }))
    } catch (err) {
      console.error('Failed to calculate payment:', err)
      setError('Failed to calculate teacher payment')
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
      if (!formData.teacherId) {
        throw new Error('Please select a teacher')
      }

      if (formData.selectedSubjects.length === 0) {
        throw new Error('Please select at least one subject to include in payment')
      }

      await axios.post('/api/receipts/teacher-payment', {
        teacherId: formData.teacherId,
        subjectIds: formData.selectedSubjects,
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        date: formData.date,
      })

      router.push('/receipts')
      router.refresh()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to create receipt')
      } else {
        setError('Something went wrong')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Teacher Payment Receipt</CardTitle>
          <CardDescription>
            Payment calculated based on subject price × percentage × enrolled students
          </CardDescription>
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
              <Label htmlFor="teacherId">Teacher *</Label>
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
                    <SelectValue placeholder="Select a teacher" />
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
                  Email: {paymentData.teacher.email || 'N/A'}
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
                    <Label>Select Subjects to Include in Payment *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllSubjects}
                    >
                      Select All
                    </Button>
                  </div>

                  {paymentData.subjects.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This teacher is not assigned to any subjects yet.
                      </AlertDescription>
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
                                      Price: ${subject.price.toFixed(2)}
                                    </Badge>
                                    <Badge variant="outline">
                                      {subject.percentage 
                                        ? `${subject.percentage}% commission`
                                        : `$${subject.hourlyRate}/hr`
                                      }
                                    </Badge>
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {subject.enrolledStudents} students
                                    </Badge>
                                  </div>

                                  {subject.percentage && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Calculation: ${subject.price} × {subject.percentage}% × {subject.enrolledStudents} students
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

            {/* Payment Details */}
            {formData.selectedSubjects.length > 0 && paymentData && (
              <>
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, paymentMethod: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="CHECK">Check</SelectItem>
                        <SelectItem value="MOBILE_PAYMENT">Mobile Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Payment Date *</Label>
                    <Input
                      type="date"
                      id="date"
                      value={formData.date}
                      onChange={(e) => 
                        setFormData(prev => ({ ...prev, date: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description/Notes</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Monthly salary, bonus, etc."
                    rows={3}
                  />
                </div>

                {/* Payment Summary */}
                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-orange-600" />
                      Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Teacher:</span>
                      <span className="font-medium">{paymentData.teacher.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subjects:</span>
                      <span className="font-medium">{formData.selectedSubjects.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-medium">{formData.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {new Date(formData.date).toLocaleDateString()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount:</span>
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || formData.selectedSubjects.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Payment
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}