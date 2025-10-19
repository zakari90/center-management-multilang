/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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

export default function CreateTeacherForm() {
  const router = useRouter()
  const t = useTranslations('CreateTeacherForm')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  const DAYS = [
    t('monday'),
    t('tuesday'),
    t('wednesday'),
    t('thursday'),
    t('friday'),
    t('saturday'),
    t('sunday')
  ]

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(
    DAYS.map(day => ({
      day,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: false
    }))
  )

  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([])

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get('/api/subjects')
        if (response) setSubjects(response.data)
      } catch (err) {
        console.error('Failed to fetch subjects:', err)
      } finally {
        setLoadingSubjects(false)
      }
    }
    fetchSubjects()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const validSubjects = teacherSubjects.filter(ts => ts.subjectId)
      for (const ts of validSubjects) {
        if (ts.compensationType === 'percentage' && (!ts.percentage || ts.percentage <= 0 || ts.percentage > 100)) {
          throw new Error('Percentage must be between 1 and 100')
        }
        if (ts.compensationType === 'hourly' && (!ts.hourlyRate || ts.hourlyRate <= 0)) {
          throw new Error('Hourly rate must be greater than 0')
        }
      }

      const activeSchedule = weeklySchedule
        .filter(day => day.isAvailable)
        .map(({ day, startTime, endTime }) => ({ day, startTime, endTime }))

      const payload = {
        ...formData,
        weeklySchedule: activeSchedule.length > 0 ? activeSchedule : null,
        subjects: validSubjects.map(ts => ({
          subjectId: ts.subjectId,
          percentage: ts.compensationType === 'percentage' ? ts.percentage : null,
          hourlyRate: ts.compensationType === 'hourly' ? ts.hourlyRate : null
        }))
      }

      await axios.post('/api/teachers', payload)
      await router.push('/manager/teachers')
      router.refresh()
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error || 'Failed to create teacher')
      else if (err instanceof Error) setError(err.message)
      else setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('title')}</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('basicInfo')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['name', 'email', 'phone', 'address'].map((field) => (
                <div key={field}>
                  <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-2">
                    {t(field)}{field === 'name' ? <span className="text-red-500">*</span> : ''}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    id={field}
                    name={field}
                    required={field === 'name'}
                    value={(formData as any)[field]}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder={t(field)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Subjects & Compensation */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{t('subjectsCompensation')}</h2>
                <p className="text-sm text-gray-600 mt-1">{t('assignSubjects')}</p>
              </div>
              <button
                type="button"
                onClick={addSubject}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                disabled={loadingSubjects}
              >
                {t('addSubject')}
              </button>
            </div>

            {loadingSubjects ? (
              <p className="text-gray-500 text-center py-4">{t('loadingSubjects')}</p>
            ) : subjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('noSubjects')}</p>
            ) : teacherSubjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-md">{t('noSubjectsAssigned')}</p>
            ) : (
              <div className="space-y-4">
                {teacherSubjects.map((ts, index) => {
                  const selectedSubject = subjects.find(s => s.id === ts.subjectId)
                  return (
                    <div key={index} className="p-4 bg-gray-50 rounded-md space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('subject')} <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={ts.subjectId}
                            onChange={(e) => updateSubject(index, 'subjectId', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">{t('subject')}</option>
                            {subjects
                              .filter(s => !teacherSubjects.some((ts2, i) => i !== index && ts2.subjectId === s.id))
                              .map(subject => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.name} - {subject.grade} (${subject.price})
                                </option>
                              ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSubject(index)}
                          className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-md"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Compensation */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('paymentType')}
                          </label>
                          <select
                            value={ts.compensationType}
                            onChange={(e) => updateSubject(index, 'compensationType', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="percentage">{t('percentage')}</option>
                            <option value="hourly">{t('hourlyRate')}</option>
                          </select>
                        </div>

                        {ts.compensationType === 'percentage' ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t('percentage')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              step="0.1"
                              value={ts.percentage || ''}
                              onChange={(e) => updateSubject(index, 'percentage', parseFloat(e.target.value))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t('hourlyRate')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ts.hourlyRate || ''}
                              onChange={(e) => updateSubject(index, 'hourlyRate', parseFloat(e.target.value))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        {selectedSubject && (
                          <div className="flex items-end">
                            <div className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-xs text-blue-600 mb-1">{t('estimatedEarnings')}</p>
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
                })}
              </div>
            )}
          </div>

          {/* Weekly Schedule */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('weeklySchedule')}</h2>
            <p className="text-sm text-gray-600 mb-4">{t('selectAvailable')}</p>

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
                        <label className="text-sm text-gray-600">{t('from')}</label>
                        <input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">{t('to')}</label>
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

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? t('creating') : t('createTeacher')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
