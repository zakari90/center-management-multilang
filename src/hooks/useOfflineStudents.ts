/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { db, CachedStudent } from '@/lib/db-client'
import { syncService } from '@/lib/sync-service'
import { useLiveQuery } from 'dexie-react-hooks'

interface StudentSubject {
  id: string
  subject: {
    id: string
    name: string
    grade: string
    price: number
  }
  teacher: {
    id: string
    name: string
  }
}

export interface Student extends CachedStudent {
  studentSubjects: StudentSubject[]
}

export function useOfflineStudents() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Live query - automatically updates when IndexedDB changes
  const students = useLiveQuery(
    () => db.students
      .where('deletedAt')
      .equals(undefined as any)
      .or('deletedAt')
      .equals(null as any)
      .toArray(),
    []
  )

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    // Network status listeners
    const handleOnline = () => {
      setIsOnline(true)
      syncService.syncData()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial sync if online
    if (navigator.onLine) {
      syncService.syncData()
    }

    // Start auto-sync
    syncService.startAutoSync()

    // Subscribe to sync completion
    const unsubscribe = syncService.onSyncComplete(() => {
      updatePendingCount()
    })

    // Update pending count periodically
    const updatePendingCount = async () => {
      const count = await syncService.getPendingCount()
      setPendingCount(count)
    }

    updatePendingCount()
    const interval = setInterval(updatePendingCount, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      syncService.stopAutoSync()
      clearInterval(interval)
      unsubscribe()
    }
  }, [])

  const createStudent = useCallback(async (studentData: Partial<Student>) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newStudent: CachedStudent = {
      id: tempId,
      name: studentData.name || '',
      email: studentData.email || null,
      phone: studentData.phone || null,
      parentName: studentData.parentName || null,
      parentPhone: studentData.parentPhone || null,
      grade: studentData.grade || null,
      studentSubjects: studentData.studentSubjects || [],
      lastModified: Date.now(),
      synced: false,
    }
    
    // Save to IndexedDB immediately
    await db.students.add(newStudent)

    // Queue for sync
    await syncService.queueOperation('CREATE', 'students', newStudent)

    return tempId
  }, [])

  const updateStudent = useCallback(async (id: string, studentData: Partial<Student>) => {
    // Get existing student
    const existing = await db.students.get(id)
    if (!existing) throw new Error('Student not found')

    const updated = {
      ...existing,
      ...studentData,
      lastModified: Date.now(),
      synced: false,
    }

    // Update IndexedDB
    await db.students.put(updated)

    // Queue for sync
    await syncService.queueOperation('UPDATE', 'students', updated, id)
  }, [])

  const deleteStudent = useCallback(async (id: string) => {
    // Soft delete - mark as deleted
    await db.students.update(id, {
      deletedAt: Date.now(),
      synced: false,
    })

    // Queue for sync
    await syncService.queueOperation('DELETE', 'students', {}, id)
  }, [])

  const getStudentById = useCallback(async (id: string): Promise<Student | undefined> => {
    return await db.students.get(id) as Student | undefined
  }, [])

  const forceSync = useCallback(async () => {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline')
    }

    setIsSyncing(true)
    try {
      await syncService.syncData()
      const count = await syncService.getPendingCount()
      setPendingCount(count)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  return {
    students: (students || []) as Student[],
    isOnline,
    isSyncing,
    pendingCount,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    forceSync,
  }
}
