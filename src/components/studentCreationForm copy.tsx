/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Teacher {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface TeacherSubject {
  id: string
  teacherId: string
  percentage: number | null
  hourlyRate: number | null
  teacher: Teacher
}

interface Subject {
  id: string
  name: string
  grade: string
  price: number
  duration: number | null
  teacherSubjects: TeacherSubject[]
}

interface EnrolledSubject {
  subjectId: string
  teacherId: string
  subjectName: string
  teacherName: string
  grade: string
  price: number
}

export default function CreateStudentForm() {
  const t = useTranslations("CreateStudentForm")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    grade: '',
  })

  // Enrollment flow state
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')
  
  // Enrolled subjects list
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>([])

  // Fetch available subjects with their teachers
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/subjects?includeTeachers=true')
        if (response.ok) {
          const data = await response.json()
          setSubjects(data)
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err)
        setError(t("errors.fetchSubjects"))
      } finally {
        setLoadingSubjects(false)
      }
    }
    fetchSubjects()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Get unique grades from subjects
  const availableGrades = [...new Set(subjects.map(s => s.grade))].sort()

  // Filter subjects by selected grade
  const subjectsForGrade = selectedGrade 
    ? subjects.filter(s => s.grade === selectedGrade)
    : []

  // Get teachers for selected subject
const teachersForSubject = selectedSubject?.teacherSubjects?.filter(ts => ts.teacher) || []
  const handleAddEnrollment = () => {
    if (!selectedSubject || !selectedTeacher) {
      setError(t("errors.selectSubjectTeacher"))
      return
    }

    // Check if already enrolled in this subject with this teacher
    const alreadyEnrolled = enrolledSubjects.some(
      es => es.subjectId === selectedSubject.id && es.teacherId === selectedTeacher
    )

    if (alreadyEnrolled) {
      setError(t("errors.alreadyEnrolled"))
      return
    }

    const teacher = teachersForSubject.find(ts => ts.teacherId === selectedTeacher)?.teacher
    
    if (!teacher) return

    setEnrolledSubjects(prev => [
      ...prev,
      {
        subjectId: selectedSubject.id,
        teacherId: selectedTeacher,
        subjectName: selectedSubject.name,
        teacherName: teacher.name,
        grade: selectedSubject.grade,
        price: selectedSubject.price
      }
    ])

    // Reset enrollment flow
    setSelectedGrade('')
    setSelectedSubject(null)
    setSelectedTeacher('')
    setError('')
  }

  const handleRemoveEnrollment = (subjectId: string, teacherId: string) => {
    setEnrolledSubjects(prev => 
      prev.filter(es => !(es.subjectId === subjectId && es.teacherId === teacherId))
    )
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!formData.name) {
        throw new Error('Student name is required')
      }

      if (enrolledSubjects.length === 0) {
        throw new Error('Please enroll the student in at least one subject')
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          enrollments: enrolledSubjects.map(es => ({
            subjectId: es.subjectId,
            teacherId: es.teacherId
          }))
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create student')
      }
    // toast("student created successfully") 
    await router.push('/manager/students')
    router.refresh()  
    } catch (err) {
      console.log(err instanceof Error ? err.message : 'Something went wrong')
      setError(t("errors.generic"))
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate total price
  const totalPrice = enrolledSubjects.reduce((total, es) => total + es.price, 0)

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("title")}</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("studentInfo.title")}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("studentInfo.fullName")} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="rachid Daman"
                />
              </div>

              <div hidden>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("studentInfo.grade")}
                </label>
                <input
                  type="text"
                  id="grade"
                  name="grade"
                  value={formData.grade || selectedGrade}
                  readOnly
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("studentInfo.grade")}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("studentInfo.email")}

                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder= {t("studentInfo.emailPlaceholder")}

                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("studentInfo.phone")}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder= {t("studentInfo.phonePlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
<div className="border-b pb-6">
  <h2 className="text-xl font-semibold text-gray-800 mb-4">
    {t("parentInfo.title")}
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-2">
        {t("parentInfo.name")}
      </label>
      <input
        type="text"
        id="parentName"
        name="parentName"
        value={formData.parentName}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={t("parentInfo.namePlaceholder")}
      />
    </div>

    <div>
      <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700 mb-2">
        {t("parentInfo.phone")}
      </label>
      <input
        type="tel"
        id="parentPhone"
        name="parentPhone"
        value={formData.parentPhone}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={t("parentInfo.phonePlaceholder")}
      />
    </div>

    <div className="md:col-span-2">
      <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 mb-2">
        {t("parentInfo.email")}
      </label>
      <input
        type="email"
        id="parentEmail"
        name="parentEmail"
        value={formData.parentEmail}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={t("parentInfo.emailPlaceholder")}
      />
    </div>
  </div>
</div>


          {/* Subject Enrollment - Step by Step */}
<div className="border-b pb-6">
  <h2 className="text-xl font-semibold text-gray-800 mb-4">
    {t("subjectEnrollment.title")}
  </h2>
  <p className="text-sm text-gray-600 mb-6">
    {t("subjectEnrollment.description")}
  </p>

  {loadingSubjects ? (
    <p className="text-gray-500 text-center py-4">{t("subjectEnrollment.loading")}</p>
  ) : subjects.length === 0 ? (
    <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-md">
      {t("subjectEnrollment.noSubjects")}
    </p>
  ) : (
    <div className="space-y-6">
      {/* Step 1: Select Grade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t("subjectEnrollment.step1")}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableGrades.map(grade => (
            <button
              key={grade}
              type="button"
              onClick={() => {
                setSelectedGrade(grade)
                setSelectedSubject(null)
                setSelectedTeacher('')
              }}
              className={`
                px-4 py-3 rounded-lg font-medium transition-all
                ${selectedGrade === grade
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Subject */}
      {selectedGrade && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t("subjectEnrollment.step2")}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subjectsForGrade.length === 0 ? (
              <p className="text-gray-500 col-span-2">
                {t("subjectEnrollment.noSubjectsForGrade")}
              </p>
            ) : (
              subjectsForGrade.map(subject => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(subject)
                    setSelectedTeacher('')
                  }}
                  disabled={subject.teacherSubjects && subject.teacherSubjects.length === 0}
                  className={`
                    p-4 rounded-lg text-left transition-all border-2
                    ${selectedSubject?.id === subject.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                    ${subject.teacherSubjects && subject.teacherSubjects.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                      {subject.duration && (
                        <p className="text-sm text-gray-500 mt-1">
                          {subject.duration} {t("subjectEnrollment.minutes")}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {subject.teacherSubjects && subject.teacherSubjects.length} {t("subjectEnrollment.teachersAvailable")}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      ${subject.price.toFixed(2)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step 3: Select Teacher */}
      {selectedSubject && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t("subjectEnrollment.step3", { subject: selectedSubject.name })}
          </label>
          {teachersForSubject && teachersForSubject.length === 0 ? (
            <p className="text-gray-500 bg-gray-50 p-4 rounded-md">
              {t("subjectEnrollment.noTeachers")}
            </p>
          ) : (
            <div className="space-y-3">
              {teachersForSubject && teachersForSubject.map(ts => (
                <div
                  key={ts.id}
                  onClick={() => setSelectedTeacher(ts.teacherId)}
                  className={`
                    p-4 rounded-lg cursor-pointer transition-all border-2
                    ${selectedTeacher === ts.teacherId
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {ts.teacher.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{ts.teacher.name}</h4>
                        <p className="text-sm text-gray-600">
                          {ts.teacher.email || ts.teacher.phone || t("subjectEnrollment.noContact")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{t("subjectEnrollment.compensation")}</p>
                      <p className="font-semibold text-gray-900">
                        {ts.percentage 
                          ? `${ts.percentage}% ($${((selectedSubject.price * ts.percentage) / 100).toFixed(2)})`
                          : `$${ts.hourlyRate}/hr`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Button */}
          {selectedTeacher && (
            <button
              type="button"
              onClick={handleAddEnrollment}
              className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
            >
              {t("subjectEnrollment.addButton")}
            </button>
          )}
        </div>
      )}
    </div>
  )}
</div>


          {/* Enrolled Subjects List */}
          {enrolledSubjects.length > 0 && (
            <div className="border-b pb-6">
<div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-semibold text-gray-800">
    {t("enrolledSubjects.title")}
  </h2>
  <div className="text-right">
    <p className="text-sm text-gray-600">{t("enrolledSubjects.totalPrice")}</p>
    <p className="text-2xl font-bold text-blue-600">${totalPrice.toFixed(2)}</p>
  </div>
</div>


              <div className="space-y-3">
                {enrolledSubjects.map((es, index) => (
                  <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{es.subjectName}</h4>
<p className="text-sm text-gray-600 mt-1">
  {t("enrolledSubjects.subjectInfo", { grade: es.grade, teacher: es.teacherName })}
</p>

                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">MAD{es.price.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEnrollment(es.subjectId, es.teacherId)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                         title={t("enrolledSubjects.removeEnrollment")}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
<div className="flex justify-end gap-4 pt-6">
  <button
    type="button"
    onClick={() => router.back()}
    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
    disabled={isLoading}
  >
    {t("actions.cancel")}
  </button>
  <button
    type="submit"
    disabled={isLoading || enrolledSubjects.length === 0}
    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    {isLoading ? t("actions.creating") : t("actions.addStudent")}
  </button>
</div>

        </form>
      </div>
    </div>
  )
}