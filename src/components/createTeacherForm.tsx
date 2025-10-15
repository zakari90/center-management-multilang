'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DaySchedule {
  day: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface Subject {
  id: string
  name: string
  grade: string
  price: number
}

interface TeacherSubject {
  subjectId: string
  percentage?: number
  hourlyRate?: number
  compensationType: 'percentage' | 'hourly'
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function CreateTeacherForm() {
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
    address: '',
  })

  // Weekly schedule state
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(
    DAYS.map(day => ({
      day,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: false
    }))
  )

  // Teacher subjects state
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([])

  // Fetch available subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get('/api/subjects')
        if (response) {
          setSubjects(response.data)
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err)
      } finally {
        setLoadingSubjects(false)
      }
    }
    fetchSubjects()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleScheduleChange = (index: number, field: keyof DaySchedule, value: string | boolean) => {
    setWeeklySchedule(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addSubject = () => {
    setTeacherSubjects(prev => [
      ...prev,
      { subjectId: '', compensationType: 'percentage', percentage: 0, hourlyRate: 0 }
    ])
  }

  const removeSubject = (index: number) => {
    setTeacherSubjects(prev => prev.filter((_, i) => i !== index))
  }

  const updateSubject = (index: number, field: keyof TeacherSubject, value: any) => {
    setTeacherSubjects(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError('')

  try {
    // Validate subjects
    const validSubjects = teacherSubjects.filter(ts => ts.subjectId)

    for (const ts of validSubjects) {
      if (ts.compensationType === 'percentage' && (!ts.percentage || ts.percentage <= 0 || ts.percentage > 100)) {
        throw new Error('Percentage must be between 1 and 100')
      }
      if (ts.compensationType === 'hourly' && (!ts.hourlyRate || ts.hourlyRate <= 0)) {
        throw new Error('Hourly rate must be greater than 0')
      }
    }

    // Filter only available days for the schedule
    const activeSchedule = weeklySchedule
      .filter(day => day.isAvailable)
      .map(({ day, startTime, endTime }) => ({ day, startTime, endTime }))

    const payload = {
      ...formData,
      weeklySchedule: activeSchedule.length > 0 ? activeSchedule : null,
      subjects: validSubjects.map(ts => ({
        subjectId: ts.subjectId,
        percentage: ts.compensationType === 'percentage' ? ts.percentage : null,
        hourlyRate: ts.compensationType === 'hourly' ? ts.hourlyRate : null,
      })),
    }

    await axios.post('/api/teachers', payload)

    await router.push('/manager/teachers')
    router.refresh()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      setError(err.response?.data?.error || 'Failed to create teacher')
    } else if (err instanceof Error) {
      setError(err.message)
    } else {
      setError('Something went wrong')
    }
  } finally {
    setIsLoading(false)
  }
}


  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Teacher</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="teacher@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main St, City"
                />
              </div>
            </div>
          </div>

          {/* Subjects & Compensation */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Subjects & Compensation</h2>
                <p className="text-sm text-gray-600 mt-1">Assign subjects and set payment terms</p>
              </div>
              <button
                type="button"
                onClick={addSubject}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                disabled={loadingSubjects}
              >
                + Add Subject
              </button>
            </div>

            {loadingSubjects ? (
              <p className="text-gray-500 text-center py-4">Loading subjects...</p>
            ) : subjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No subjects available. Create subjects first.</p>
            ) : (
              <div className="space-y-4">
                {teacherSubjects.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-md">
                    No subjects assigned yet.
                  </p>
                ) : (
                  teacherSubjects.map((ts, index) => {
                    const selectedSubject = subjects.find(s => s.id === ts.subjectId)
                    return (
                      <div key={index} className="p-4 bg-gray-50 rounded-md space-y-4">
                        <div className="flex items-start gap-4">
                          {/* Subject Selection */}
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Subject <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={ts.subjectId}
                              onChange={(e) => updateSubject(index, 'subjectId', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="">Select a subject</option>
                              {subjects
                                .filter(s => !teacherSubjects.some((ts2, i) => i !== index && ts2.subjectId === s.id))
                                .map(subject => (
                                  <option key={subject.id} value={subject.id}>
                                    {subject.name} - {subject.grade} (${subject.price})
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeSubject(index)}
                            className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-md"
                            title="Remove subject"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Compensation Type */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Type
                            </label>
                            <select
                              value={ts.compensationType}
                              onChange={(e) => updateSubject(index, 'compensationType', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="hourly">Hourly Rate</option>
                            </select>
                          </div>

                          {ts.compensationType === 'percentage' ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Percentage (%) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                step="0.1"
                                value={ts.percentage || ''}
                                onChange={(e) => updateSubject(index, 'percentage', parseFloat(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                placeholder="50"
                                required
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hourly Rate ($) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={ts.hourlyRate || ''}
                                onChange={(e) => updateSubject(index, 'hourlyRate', parseFloat(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                placeholder="25.00"
                                required
                              />
                            </div>
                          )}

                          {/* Calculated Amount Display */}
                          {selectedSubject && (
                            <div className="flex items-end">
                              <div className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-xs text-blue-600 mb-1">Estimated Earnings</p>
                                <p className="text-lg font-semibold text-blue-900">
                                  {ts.compensationType === 'percentage' && ts.percentage
                                    ? `$${((selectedSubject.price * ts.percentage) / 100).toFixed(2)}`
                                    : ts.hourlyRate
                                    ? `$${ts.hourlyRate.toFixed(2)}/hr`
                                    : '$0.00'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Weekly Schedule */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Schedule</h2>
            <p className="text-sm text-gray-600 mb-4">Select available days and set working hours</p>

            <div className="space-y-3">
              {weeklySchedule.map((schedule, index) => (
                <div key={schedule.day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center min-w-[140px]">
                    <input
                      type="checkbox"
                      id={`day-${schedule.day}`}
                      checked={schedule.isAvailable}
                      onChange={(e) => handleScheduleChange(index, 'isAvailable', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor={`day-${schedule.day}`} className="ml-3 text-sm font-medium text-gray-700">
                      {schedule.day}
                    </label>
                  </div>

                  {schedule.isAvailable && (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">From:</label>
                        <input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">To:</label>
                        <input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}