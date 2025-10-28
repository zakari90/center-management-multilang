/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { db, CachedStudent } from '@/lib/dexie'
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
  const [isClient, setIsClient] = useState(false)

  // Check if we're on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Conditional live query - only on client
  const students = useLiveQuery(
    () => {
      if (!isClient || !db) return []
      
      return db.students
        .where('deletedAt')
        .equals(undefined as any)
        .or('deletedAt')
        .equals(null as any)
        .toArray()
        .catch((error) => {
          console.error('Failed to query students:', error)
          return []
        })
    },
    [isClient],
    [] // Default value
  )

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return

    // Check initial online status
    setIsOnline(navigator.onLine)

    // Network status listeners
    const handleOnline = () => {
      setIsOnline(true)
      if (db && syncService) {
        syncService.syncData().catch(console.error)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial sync if online and db available
    if (navigator.onLine && db && syncService) {
      syncService.syncData().catch(console.error)
    }

    // Start auto-sync if available
    if (syncService) {
      syncService.startAutoSync()
    }

    // Subscribe to sync completion
    const unsubscribe = syncService?.onSyncComplete(() => {
      updatePendingCount()
    })

    // Update pending count periodically
    const updatePendingCount = async () => {
      if (!syncService) return
      try {
        const count = await syncService.getPendingCount()
        setPendingCount(count)
      } catch (error) {
        console.error('Failed to get pending count:', error)
      }
    }

    updatePendingCount()
    const interval = setInterval(updatePendingCount, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (syncService) {
        syncService.stopAutoSync()
      }
      clearInterval(interval)
      if (unsubscribe) unsubscribe()
    }
  }, [isClient])

  const createStudent = useCallback(async (studentData: Partial<Student>) => {
    if (!db) {
      throw new Error('Database not available')
    }

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
    
    await db.students.add(newStudent)
    await syncService.queueOperation('CREATE', 'students', newStudent)

    return tempId
  }, [])

  const updateStudent = useCallback(async (id: string, studentData: Partial<Student>) => {
    if (!db) throw new Error('Database not available')

    const existing = await db.students.get(id)
    if (!existing) throw new Error('Student not found')

    const updated = {
      ...existing,
      ...studentData,
      lastModified: Date.now(),
      synced: false,
    }

    await db.students.put(updated)
    await syncService.queueOperation('UPDATE', 'students', updated, id)
  }, [])

  const deleteStudent = useCallback(async (id: string) => {
    if (!db) throw new Error('Database not available')

    await db.students.update(id, {
      deletedAt: Date.now(),
      synced: false,
    })

    await syncService.queueOperation('DELETE', 'students', {}, id)
  }, [])

  const getStudentById = useCallback(async (id: string): Promise<Student | undefined> => {
    if (!db) return undefined
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

