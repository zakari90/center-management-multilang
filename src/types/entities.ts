/**
 * Entity type definitions based on Prisma schema
 *
 * These types represent the domain entities in the application
 * and match the Prisma schema structure.
 */

import type {
  EntityStatus,
  CompensationType,
  PaymentMethod,
  ParsedScheduleEntry,
} from "./common";

// ==================== ENUMS ====================

export type Role = "ADMIN" | "MANAGER";

export type ReceiptType = "STUDENT_PAYMENT" | "TEACHER_PAYMENT";

// ==================== BASE ENTITY ====================

/**
 * Base properties for all entities
 */
export interface BaseEntity {
  id: string;
  createdAt: number | string;
  updatedAt: number | string;
}

/**
 * Base properties for offline-first entities
 */
export interface OfflineEntity extends BaseEntity {
  status: EntityStatus;
}

// ==================== USER ====================

export interface User extends BaseEntity {
  email: string;
  password: string;
  name: string;
  role: Role;
}

// ==================== CENTER ====================

export interface Center extends BaseEntity {
  name: string;
  address?: string;
  phone?: string;
  classrooms: string[];
  workingDays: string[];
  workingMonths: string[];
  workingYears: string[];
  managers: string[];
  adminId: string;
}

// ==================== TEACHER ====================

export interface Teacher extends OfflineEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  weeklySchedule?: string[] | ParsedScheduleEntry[];
  managerId: string;
}

export interface TeacherWithSubjects extends Teacher {
  teacherSubjects: TeacherSubject[];
}

// ==================== STUDENT ====================

export interface Student extends OfflineEntity {
  name: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  grade?: string;
  managerId: string;
}

export interface StudentWithSubjects extends Student {
  studentSubjects: StudentSubject[];
}

// ==================== SUBJECT ====================

export interface Subject extends OfflineEntity {
  name: string;
  grade: string;
  price: number;
  duration?: number;
  centerId: string;
}

// ==================== TEACHER SUBJECT ====================

export interface TeacherSubject extends OfflineEntity {
  teacherId: string;
  subjectId: string;
  percentage?: number;
  hourlyRate?: number;
  assignedAt: number | string;
}

export interface TeacherSubjectWithDetails extends TeacherSubject {
  subject: {
    id: string;
    name: string;
    grade: string;
    price: number;
  };
}

// ==================== STUDENT SUBJECT ====================

export interface StudentSubject extends OfflineEntity {
  studentId: string;
  subjectId: string;
  teacherId: string;
  enrolledAt: number | string;
}

export interface StudentSubjectWithDetails extends StudentSubject {
  subject: {
    id: string;
    name: string;
    grade: string;
    price: number;
  };
  teacher?: {
    id: string;
    name: string;
  };
}

// ==================== RECEIPT ====================

export interface Receipt extends OfflineEntity {
  receiptNumber: string;
  amount: number;
  type: ReceiptType;
  description?: string;
  paymentMethod?: PaymentMethod;
  date: number | string;
  studentId?: string;
  teacherId?: string;
  managerId: string;
}

export interface ReceiptWithDetails extends Receipt {
  student?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    name: string;
  };
}

// ==================== SCHEDULE ====================

export interface Schedule extends OfflineEntity {
  day: string;
  startTime: string;
  endTime: string;
  roomId: string;
  teacherId: string;
  subjectId: string;
  managerId: string;
  centerId?: string;
}

export interface ScheduleWithDetails extends Schedule {
  teacher: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
    grade: string;
  };
}

// ==================== ACTIVITY LOG ====================

export interface ActivityLog extends BaseEntity {
  type:
    | "student"
    | "teacher"
    | "enrollment"
    | "payment"
    | "center_created"
    | "manager_added"
    | "student_enrolled"
    | "payment_received";
  title: string;
  description: string;
  date: string;
  link?: string;
  amount?: number;
}

// ==================== PUSH SUBSCRIPTION ====================

export interface PushSubscription extends BaseEntity {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  role?: Role;
}
