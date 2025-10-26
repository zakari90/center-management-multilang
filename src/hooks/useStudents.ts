/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

export interface Student {
  id: string
  name: string
  email: string | null
  phone: string | null
  parentName: string | null
  parentPhone: string | null
  grade: string | null
  studentSubjects: any[]
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data } = await axios.get('/api/students')
      setStudents(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch students:', err)
      setError('Failed to load students')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return {
    students,
    isLoading,
    error,
    refetch: fetchStudents,
  }
}
