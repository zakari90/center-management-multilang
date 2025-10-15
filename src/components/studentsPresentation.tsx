'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      if (!response.ok) throw new Error('Failed to fetch students')
      const data = await response.json()
    console.log(data.studentSubjects);
    
      setStudents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete student')
      
      setStudents(prev => prev.filter(s => s.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete student')
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.includes(searchTerm) ||
      student.parentName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter

    return matchesSearch && matchesGrade
  })

  // Get unique grades for filter
  const grades = ['all', ...new Set(students.map(s => s.grade).filter(Boolean))]

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600 mt-1">Manage your students and enrollments</p>
          </div>
          <Link
            href="/manager/students/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            + Add Student
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, email, phone, or parent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {grades.map(grade => (
              <option key={grade} value={grade}>
                {grade === 'all' ? 'All Grades' : grade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats */}
{/* Stats */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <p className="text-sm text-gray-600 mb-1">Total Students</p>
    <p className="text-3xl font-bold text-gray-900">{students?.length ?? 0}</p>
  </div>
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <p className="text-sm text-gray-600 mb-1">Active Enrollments</p>
    <p className="text-3xl font-bold text-green-600">
      {students?.filter(s => s.studentSubjects?.length > 0).length ?? 0}
    </p>
  </div>
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
    <p className="text-3xl font-bold text-blue-600">
      ${students?.reduce((total, s) => total + getTotalRevenue(s), 0).toFixed(2) ?? '0.00'}
    </p>
  </div>
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <p className="text-sm text-gray-600 mb-1">Avg. Subjects/Student</p>
    <p className="text-3xl font-bold text-purple-600">
      {students && students.length > 0 
        ? (students.reduce((total, s) => total + (s.studentSubjects?.length ?? 0), 0) / students.length).toFixed(1)
        : '0'}
    </p>
  </div>
</div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <p className="mt-4 text-gray-600">
              {searchTerm || gradeFilter !== 'all' ? 'No students found matching your criteria' : 'No students yet'}
            </p>
            {!searchTerm && gradeFilter === 'all' && (
              <Link
                href="/manager/students/create"
                className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Your First Student
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent/Guardian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subjects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          {student.grade && (
                            <div className="text-sm text-gray-500">{student.grade}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.email || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.parentName || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.parentPhone || student.parentEmail || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {student.studentSubjects && student.studentSubjects.length === 0 ? (
                          <span className="text-gray-400 italic">No subjects</span>
                        ) : (
                          <div className="space-y-1">
                            {student.studentSubjects && student.studentSubjects.slice(0, 2).map((ss) => (
                              <div key={ss.id}>
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {ss.subject.name}
                                </span>
                              </div>
                            ))}
                            {student.studentSubjects && student.studentSubjects.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{student.studentSubjects.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${getTotalRevenue(student).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/manager/students/${student.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/manager/students/${student.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        {deleteConfirm === student.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="text-red-600 hover:text-red-900 font-medium text-xs"
                              title="Confirm delete"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-600 hover:text-gray-900 font-medium text-xs"
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(student.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {filteredStudents.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      )}
    </div>
  )
}