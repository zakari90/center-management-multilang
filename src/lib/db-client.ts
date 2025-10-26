/* eslint-disable @typescript-eslint/no-explicit-any */
import Dexie, { Table } from 'dexie'

// Sync Queue Interface
export interface SyncQueue {
  id?: number
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  collection: string
  data: any
  timestamp: number
  synced: boolean
  serverId?: string
  error?: string
}

// Cached Data Interfaces
export interface CachedStudent {
  id: string
  name: string
  email: string | null
  phone: string | null
  parentName: string | null
  parentPhone: string | null
  grade: string | null
  studentSubjects: any[]
  lastModified: number
  synced: boolean
  deletedAt?: number
}

export interface CachedTeacher {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  weeklySchedule: string[]
  lastModified: number
  synced: boolean
  deletedAt?: number
}

export interface CachedReceipt {
  id: string
  receiptNumber: string
  amount: number
  type: string
  studentId?: string
  teacherId?: string
  date: string
  description?: string
  paymentMethod?: string
  lastModified: number
  synced: boolean
  deletedAt?: number
}

export interface CachedSubject {
  id: string
  name: string
  grade: string
  price: number
  duration?: number
  centerId: string
  lastModified: number
  synced: boolean
  deletedAt?: number
}

// Database Class
export class EducationCenterDB extends Dexie {
  students!: Table<CachedStudent, string>
  teachers!: Table<CachedTeacher, string>
  receipts!: Table<CachedReceipt, string>
  subjects!: Table<CachedSubject, string>
  syncQueue!: Table<SyncQueue, number>

  constructor() {
    super('EducationCenterDB')
    
    this.version(1).stores({
      students: 'id, name, email, phone, synced, lastModified, deletedAt',
      teachers: 'id, name, email, phone, synced, lastModified, deletedAt',
      receipts: 'id, receiptNumber, studentId, teacherId, synced, lastModified, deletedAt',
      subjects: 'id, name, grade, centerId, synced, lastModified, deletedAt',
      syncQueue: '++id, collection, synced, timestamp'
    })

    // Error handling
    this.on('versionchange', () => {
      console.warn('Database version changed, reloading...')
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    })
  }
}

// ✅ CRITICAL FIX: Only initialize on client side
let dbInstance: EducationCenterDB | null = null

export const getDB = (): EducationCenterDB | null => {
  // Return null on server
  if (typeof window === 'undefined') {
    return null
  }

  // Initialize on first call (client-side only)
  if (!dbInstance) {
    try {
      dbInstance = new EducationCenterDB()
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
      return null
    }
  }

  return dbInstance
}

// For backward compatibility - but this will be null on server
export const db = getDB()
