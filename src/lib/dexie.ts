/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/dexie.ts
import Dexie, { Table } from 'dexie'

// ENUMS to match Prisma schema
export type Role = "ADMIN" | "MANAGER"
export type ReceiptType = "STUDENT_PAYMENT" | "TEACHER_PAYMENT"

// Core interfaces matching Prisma, all _ids as type string
export interface LocalCenter {
  id?: string // MongoDB ObjectId as string
  name: string
  address?: string
  phone?: string
  classrooms: string[]
  workingDays: string[]
  managers: string[] // relation array as array of string ObjectIds
  adminId: string    // relation
  createdAt: Date
  updatedAt: Date
  syncStatus?: 'pending' | 'synced' | 'failed'
}

export interface LocalUser {
  id?: string // MongoDB ObjectId as string (matches Prisma User.id)
  email: string
  password: string // hash, must match Prisma (do NOT omit!)
  name: string
  role: Role
  createdAt: Date
  updatedAt: Date
  syncStatus?: 'pending' | 'synced' | 'failed'
}

export interface LocalTeacher {
  id?: string
  name: string
  email?: string
  phone?: string
  address?: string
  weeklySchedule?: any // Prisma is Json
  createdAt: Date
  updatedAt: Date
  managerId: string     // relation
  syncStatus?: 'pending' | 'synced' | 'failed'
}

export interface LocalStudent {
  id?: string
  name: string
  email?: string
  phone?: string
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  grade?: string
  createdAt: Date
  updatedAt: Date
  managerId: string     // relation
  syncStatus?: 'pending' | 'synced' | 'failed'
}

export interface LocalSubject {
  id?: string
  name: string
  grade: string
  price: number
  duration?: number
  createdAt: Date
  updatedAt: Date
  centerId: string         // relation
  syncStatus?: 'pending' | 'synced' | 'failed'
}

export interface LocalTeacherSubject {
  id?: string
  percentage?: number
  hourlyRate?: number
  assignedAt: Date
  teacherId: string
  subjectId: string
  syncStatus?: 'pending' | 'synced' | 'failed'
}

export interface LocalStudentSubject {
  id?: string
  enrolledAt: Date
  studentId: string
  subjectId: string
  teacherId: string
  syncStatus?: 'pending' | 'synced' | 'failed'
}

export interface LocalReceipt {
  id?: string
  receiptNumber: string
  amount: number
  type: ReceiptType    // enum
  description?: string
  paymentMethod?: string
  date: Date
  createdAt: Date
  studentId?: string   // nullable relation
  teacherId?: string
  managerId: string
  syncStatus?: 'pending' | 'synced' | 'failed'
}

export interface LocalSchedule {
  id?: string
  day: string
  startTime: string
  endTime: string
  roomId: string
  createdAt: Date
  updatedAt: Date
  teacherId: string
  subjectId: string
  managerId: string
  centerId?: string // optional for nullable
  syncStatus?: 'pending' | 'synced' | 'failed'
}

// Sync queue remains unchanged
export interface SyncQueue {
  id?: number
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: string // collection/table name
  entityId?: string
  data: any
  timestamp: Date
  attempts: number
  status: 'pending' | 'syncing' | 'failed'
  error?: string
}

class CenterManagementDB extends Dexie {
  centers!: Table<LocalCenter>
  users!: Table<LocalUser>
  teachers!: Table<LocalTeacher>
  students!: Table<LocalStudent>
  subjects!: Table<LocalSubject>
  schedules!: Table<LocalSchedule>
  receipts!: Table<LocalReceipt>
  teacherSubjects!: Table<LocalTeacherSubject>
  studentSubjects!: Table<LocalStudentSubject>
  syncQueue!: Table<SyncQueue>

  constructor() {
    super('CenterManagementDB')
    this.version(1).stores({
      centers: 'id, name, adminId, syncStatus',
      users: 'id, email, role, syncStatus',
      teachers: 'id, name, email, managerId, syncStatus',
      students: 'id, name, email, managerId, grade, syncStatus',
      subjects: 'id, name, grade, centerId, syncStatus',
      schedules: 'id, teacherId, subjectId, managerId, centerId, syncStatus',
      receipts: 'id, receiptNumber, type, studentId, teacherId, managerId, date, syncStatus',
      teacherSubjects: 'id, subjectId, teacherId, syncStatus',
      studentSubjects: 'id, studentId, subjectId, teacherId, syncStatus',
      syncQueue: '++id, entity, status, timestamp, attempts'
    })
  }
}

// Use this singleton instance everywhere:
export const localDb = new CenterManagementDB()
