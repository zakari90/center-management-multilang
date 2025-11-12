/* eslint-disable @typescript-eslint/no-explicit-any */
import Dexie, { Table } from 'dexie';

export enum ReceiptType {
  STUDENT_PAYMENT = 'STUDENT_PAYMENT',
  TEACHER_PAYMENT = 'TEACHER_PAYMENT',
}

// Base interface for all synced entities
export interface SyncEntity {
  id: string;
  status: '1' | 'w' | '0'; // '1' = synced, 'w' = waiting, '0' = marked for deletion
  createdAt: number;
  updatedAt: number;
}

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
  role: string;
}

export interface Teacher extends SyncEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  weeklySchedule?: Record<string, any>;
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
  role?: string;
}

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
      centers: 'id, status, adminId, updatedAt',
      users: 'id, status, email, role, updatedAt',
      teachers: 'id, status, managerId, email, updatedAt',
      students: 'id, status, managerId, email, updatedAt',
      subjects: 'id, status, centerId, updatedAt',
      teacherSubjects: 'id, status, teacherId, subjectId, updatedAt',
      studentSubjects: 'id, status, studentId, subjectId, teacherId, updatedAt',
      receipts: 'id, status, receiptNumber, managerId, studentId, teacherId, date, updatedAt',
      schedules: 'id, status, teacherId, subjectId, managerId, centerId, day, updatedAt',
      pushSubscriptions: 'id, status, endpoint, userId, updatedAt',
    });
  }
}

export const localDb = new AppDatabase();

