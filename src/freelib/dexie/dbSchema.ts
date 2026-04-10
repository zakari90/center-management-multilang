/* eslint-disable @typescript-eslint/no-explicit-any */
import Dexie, { Table } from "dexie";

// Enums
export enum Role {
  ADMIN = "ADMIN",
}

export enum ReceiptType {
  STUDENT_PAYMENT = "STUDENT_PAYMENT",
  TEACHER_PAYMENT = "TEACHER_PAYMENT",
}

// Base interface for all entities
export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

// Entity Interfaces
export interface Center extends BaseEntity {
  name: string;
  address?: string;
  phone?: string;
  classrooms: string[];
  workingDays: string[];

  paymentStartDay?: number;
  paymentEndDay?: number;
  academicYear?: string;
  staffEntryDate?: string;
  studentEntryDate?: string;
  schoolEndDateBac?: string;
  schoolEndDateOther?: string;

  // Homepage content
  homeTitle?: string;
  homeSubtitle?: string;
  homeBadge?: string;
  homeDescription?: string;
  homeCtaText?: string;
  homePhone?: string;
  homeAddress?: string;

  // Registration settings
  publicRegistrationEnabled?: boolean;

  adminId: string;
}

export interface User extends BaseEntity {
  email: string;
  password: string;
  name: string;
  role: Role;
  // Admin notification preferences
  notifyNewUser?: boolean;
  notifyPayments?: boolean;
  notifyDeleteRequests?: boolean;
}

export interface Teacher extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  weeklySchedule?: string[] | Record<string, any>;
  overrideConflicts?: boolean;
}

export interface Student extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  grade?: string;
}

export interface Subject extends BaseEntity {
  name: string;
  grade: string;
  price: number;
  duration?: number;
  centerId: string;
}

export interface TeacherSubject extends BaseEntity {
  percentage?: number;
  hourlyRate?: number;
  assignedAt: number;
  teacherId: string;
  subjectId: string;
}

export interface StudentSubject extends BaseEntity {
  enrolledAt: number | string;
  studentId: string;
  subjectId: string;
  teacherId: string;
}

export interface Receipt extends BaseEntity {
  receiptNumber: string;
  amount: number;
  type: ReceiptType;
  description?: string;
  paymentMethod?: string;
  date: number;
  studentId?: string;
  teacherId?: string;
  adminId?: string;
}

export interface Schedule extends BaseEntity {
  day: string;
  startTime: string;
  endTime: string;
  roomId: string;
  teacherId: string;
  subjectId: string;
  centerId?: string;
  adminId?: string;
}

// Database name constant
export const DB_NAME = "freecenterdb";

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

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      centers: "id, adminId, updatedAt",
      users: "id, &email, role, updatedAt",
      teachers: "id, email, updatedAt",
      students: "id, email, grade, updatedAt",
      subjects: "id, centerId, grade, [centerId+grade], updatedAt",
      teacherSubjects: "id, teacherId, subjectId, [teacherId+subjectId], updatedAt",
      studentSubjects: "id, studentId, subjectId, teacherId, [studentId+subjectId], [studentId+teacherId], [subjectId+teacherId], updatedAt",
      receipts: "id, &receiptNumber, studentId, teacherId, adminId, type, date, [studentId+date], [teacherId+date], [type+date], updatedAt",
      schedules: "id, teacherId, subjectId, centerId, adminId, day, [centerId+day], [teacherId+day], [subjectId+day], updatedAt",
    });
  }
}

// Lazy singleton — database is NOT created until first access
let _localDb: AppDatabase | null = null;

/**
 * Get the database instance (creates it on first call).
 * Use this instead of accessing `localDb` directly when you need
 * to guarantee the database exists.
 */
export function getDb(): AppDatabase {
  if (!_localDb) {
    _localDb = new AppDatabase();
  }
  return _localDb;
}

/**
 * Check whether the IndexedDB database has been created yet,
 * WITHOUT triggering its creation.
 */
export async function isDatabaseCreated(): Promise<boolean> {
  return await Dexie.exists(DB_NAME);
}

/**
 * @deprecated Use `getDb()` instead. Kept for backward compatibility
 * but now lazily initialized.
 */
export const localDb = new Proxy({} as AppDatabase, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
