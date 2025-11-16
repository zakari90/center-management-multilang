/* eslint-disable @typescript-eslint/no-explicit-any */
import Dexie, { Table } from 'dexie';

// Enums
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
}

export enum ReceiptType {
  STUDENT_PAYMENT = 'STUDENT_PAYMENT',
  TEACHER_PAYMENT = 'TEACHER_PAYMENT',
}

export type SyncStatus = '1' | 'w' | '0'; 
// '1' = synced with server
// 'w' = waiting/pending sync
// '0' = marked for deletion (soft delete, pending server sync)

// Base interface for all synced entities
export interface SyncEntity {
  id: string;
  status: SyncStatus;
  createdAt: number;
  updatedAt: number;
}

// Entity Interfaces
export interface Center extends SyncEntity {
  name: string;
  address?: string;
  phone?: string;
  classrooms: string[];
  workingDays: string[];
  managers: string[];
  adminId: string;
}

export interface User extends SyncEntity {
  email: string;
  password: string;
  name: string;
  role: Role;
}

export interface Teacher extends SyncEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  weeklySchedule?: string[] | Record<string, any>;
  managerId: string;
}

export interface Student extends SyncEntity {
  name: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  grade?: string;
  managerId: string;
}

export interface Subject extends SyncEntity {
  name: string;
  grade: string;
  price: number;
  duration?: number;
  centerId: string;
}

export interface TeacherSubject extends SyncEntity {
  percentage?: number;
  hourlyRate?: number;
  assignedAt: number;
  teacherId: string;
  subjectId: string;
}

export interface StudentSubject extends SyncEntity {
  enrolledAt: number;
  studentId: string;
  subjectId: string;
  teacherId: string;
}

export interface Receipt extends SyncEntity {
  receiptNumber: string;
  amount: number;
  type: ReceiptType;
  description?: string;
  paymentMethod?: string;
  date: number;
  studentId?: string;
  teacherId?: string;
  managerId: string;
}

export interface Schedule extends SyncEntity {
  day: string;
  startTime: string;
  endTime: string;
  roomId: string;
  teacherId: string;
  subjectId: string;
  managerId: string;
  centerId?: string;
}

export interface PushSubscription extends SyncEntity {
  endpoint: string;
  keys: Record<string, any>;
  userId?: string;
  role?: Role;
}

// Main Database Class
export class AppDatabase extends Dexie {
  centers!: Table<Center>;
  users!: Table<User>;
  teachers!: Table<Teacher>;
  students!: Table<Student>;
  subjects!: Table<Subject>;
  teacherSubjects!: Table<TeacherSubject>;
  studentSubjects!: Table<StudentSubject>;
  receipts!: Table<Receipt>;
  schedules!: Table<Schedule>;
  pushSubscriptions!: Table<PushSubscription>;

  constructor() {
    super('EducationAppDatabase');

    this.version(1).stores({
      centers: 
        'id, status, adminId, [status+updatedAt], updatedAt',
      users: 
        'id, &email, status, role, [status+updatedAt], updatedAt',
      teachers: 
        'id, status, managerId, email, [status+updatedAt], [managerId+status], updatedAt',
      students: 
        'id, status, managerId, email, grade, [status+updatedAt], [managerId+status], [managerId+grade], updatedAt',
      subjects: 
        'id, status, centerId, grade, [centerId+grade], [centerId+status], [status+updatedAt], updatedAt',
      teacherSubjects: 
        'id, status, teacherId, subjectId, [teacherId+subjectId], [teacherId+status], [subjectId+status], [status+updatedAt], updatedAt',
      studentSubjects: 
        'id, status, studentId, subjectId, teacherId, [studentId+subjectId], [studentId+teacherId], [subjectId+teacherId], [status+updatedAt], updatedAt',
      receipts: 
        'id, &receiptNumber, status, managerId, studentId, teacherId, type, date, [status+updatedAt], [managerId+date], [studentId+date], [teacherId+date], [type+date], [managerId+type], updatedAt',
      schedules: 
        'id, status, teacherId, subjectId, managerId, centerId, day, [centerId+day], [teacherId+day], [subjectId+day], [managerId+centerId], [status+updatedAt], updatedAt',
      pushSubscriptions: 
        'id, &endpoint, status, userId, role, [status+updatedAt], updatedAt',
    });
  }
}

// Export singleton instance
export const localDb = new AppDatabase();
