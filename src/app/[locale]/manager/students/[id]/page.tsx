// app/students/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import EnrolledSubjectsCard from '@/components/inUse/enrolledSubjectsCard'

interface StudentSubject {
  id: string
  subject: {
    id: string
    name: string
    grade: string
    price: number
    duration: number | null
  }
  enrolledAt: string
}

interface Receipt {
  id: string
  receiptNumber: string
  amount: number
  date: string
  paymentMethod: string | null
  description: string | null
}

interface Student {
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
  receipts: Receipt[]
}

export default function StudentDetailPage() {
  const params = useParams()
  const [student, setStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStudent()
  }, [params.id])

  const fetchStudent = async () => {
    try {
      const response = await axios.get(`/api/students/${params.id}`)
      if (!response.data) throw new Error('Failed to fetch student')
      setStudent(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || 'Student not found'}</p>
        </div>
      </div>
    )
  }

  const totalRevenue = student.studentSubjects.reduce((total, ss) => total + ss.subject.price, 0)
  const totalPaid = student.receipts.reduce((total, receipt) => total + receipt.amount, 0)

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-600 mt-1">
              Student since {new Date(student.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Link
            href={`/manager/students/${student.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Student
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Enrolled Subjects</p>
          <p className="text-3xl font-bold text-blue-600">{student.studentSubjects.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Paid</p>
          <p className="text-3xl font-bold text-purple-600">${totalPaid.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900">{student.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-gray-900">{student.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Grade/Level</p>
                <p className="text-gray-900">{student.grade || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Parent/Guardian</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-gray-900">{student.parentName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-gray-900">{student.parentPhone || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900">{student.parentEmail || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Enrolled Subjects */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrolled Subjects</h2>
            {student.studentSubjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No subjects enrolled yet</p>
            ) : (
              <div className="space-y-3">
                {student.studentSubjects.map((ss) => (
                  <div key={ss.id} className="p-4 bg-gray-50 rounded-md flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{ss.subject.name}</h3>
                      <p className="text-sm text-gray-600">
                        {ss.subject.grade}
                        {ss.subject.duration && ` • ${ss.subject.duration} minutes`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Enrolled on {new Date(ss.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">${ss.subject.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Payment History */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
            {student.receipts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {student.receipts.map((receipt) => (
                  <div key={receipt.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          ${receipt.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {receipt.receiptNumber}
                        </p>
                      </div>
                      {receipt.paymentMethod && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {receipt.paymentMethod}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(receipt.date).toLocaleDateString()}
                    </p>
                    {receipt.description && (
                      <p className="text-xs text-gray-500 mt-1">{receipt.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <Link
              href={`/receipts/create?studentId=${student.id}`}
              className="mt-4 w-full block text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Payment
            </Link>
          </div>
        </div>
      </div>
      {/* <EnrolledSubjectsCard studentId={student.id} /> */}
 
    </div>
  )
}