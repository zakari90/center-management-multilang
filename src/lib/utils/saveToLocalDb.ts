/**
 * Utility functions to save entities to localDb (Dexie)
 * All entities are saved with status 'w' (waiting for sync)
 * After successful sync, status will be changed to '1' (synced)
 */

import {
  centerActions,
  teacherActions,
  studentActions,
  subjectActions,
  receiptActions,
  scheduleActions,
} from '@/lib/dexie/dexieActions';
import {
  Center,
  Teacher,
  Student,
  Subject,
  Receipt,
  Schedule,
  ReceiptType,
} from '@/lib/dexie/dbSchema';
import { generateObjectId } from './generateObjectId';

/**
 * Save center to localDb
 */
export async function saveCenterToLocalDb(
  centerData: {
    id?: string;
    name: string;
    address?: string;
    phone?: string;
    classrooms?: string[];
    workingDays?: string[];
    managers?: string[];
    adminId: string;
  }
): Promise<Center> {
  const now = Date.now();
  const centerToSave: Center = {
    id: centerData.id || generateObjectId(),
    status: 'w' as const,
    createdAt: now,
    updatedAt: now,
    name: centerData.name,
    address: centerData.address,
    phone: centerData.phone,
    classrooms: centerData.classrooms || [],
    workingDays: centerData.workingDays || [],
    managers: centerData.managers || [],
    adminId: centerData.adminId,
  };

  await centerActions.putLocal(centerToSave);
  return centerToSave;
}

/**
 * Save teacher to localDb
 */
export async function saveTeacherToLocalDb(
  teacherData: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    weeklySchedule?: Record<string, unknown>;
    managerId: string;
  }
): Promise<Teacher> {
  const now = Date.now();
  const teacherToSave: Teacher = {
    id: teacherData.id || generateObjectId(),
    status: 'w' as const,
    createdAt: now,
    updatedAt: now,
    name: teacherData.name,
    email: teacherData.email,
    phone: teacherData.phone,
    address: teacherData.address,
    weeklySchedule: teacherData.weeklySchedule,
    managerId: teacherData.managerId,
  };

  await teacherActions.putLocal(teacherToSave);
  return teacherToSave;
}

/**
 * Save student to localDb
 */
export async function saveStudentToLocalDb(
  studentData: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    grade?: string;
    managerId: string;
  }
): Promise<Student> {
  const now = Date.now();
  const studentToSave: Student = {
    id: studentData.id || generateObjectId(),
    status: 'w' as const,
    createdAt: now,
    updatedAt: now,
    name: studentData.name,
    email: studentData.email,
    phone: studentData.phone,
    parentName: studentData.parentName,
    parentPhone: studentData.parentPhone,
    parentEmail: studentData.parentEmail,
    grade: studentData.grade,
    managerId: studentData.managerId,
  };

  await studentActions.putLocal(studentToSave);
  return studentToSave;
}

/**
 * Save subject to localDb
 */
export async function saveSubjectToLocalDb(
  subjectData: {
    id?: string;
    name: string;
    grade: string;
    price: number;
    duration?: number;
    centerId: string;
  }
): Promise<Subject> {
  const now = Date.now();
  const subjectToSave: Subject = {
    id: subjectData.id || generateObjectId(),
    status: 'w' as const,
    createdAt: now,
    updatedAt: now,
    name: subjectData.name,
    grade: subjectData.grade,
    price: subjectData.price,
    duration: subjectData.duration,
    centerId: subjectData.centerId,
  };

  await subjectActions.putLocal(subjectToSave);
  return subjectToSave;
}

/**
 * Save receipt to localDb
 */
export async function saveReceiptToLocalDb(
  receiptData: {
    id?: string;
    receiptNumber: string;
    amount: number;
    type: ReceiptType;
    description?: string;
    paymentMethod?: string;
    date: number | string | Date;
    studentId?: string;
    teacherId?: string;
    managerId: string;
  }
): Promise<Receipt> {
  const now = Date.now();
  const dateValue = typeof receiptData.date === 'number' 
    ? receiptData.date 
    : typeof receiptData.date === 'string'
    ? new Date(receiptData.date).getTime()
    : receiptData.date.getTime();

  const receiptToSave: Receipt = {
    id: receiptData.id || generateObjectId(),
    status: 'w' as const,
    createdAt: now,
    updatedAt: now,
    receiptNumber: receiptData.receiptNumber,
    amount: receiptData.amount,
    type: receiptData.type,
    description: receiptData.description,
    paymentMethod: receiptData.paymentMethod,
    date: dateValue,
    studentId: receiptData.studentId,
    teacherId: receiptData.teacherId,
    managerId: receiptData.managerId,
  };

  await receiptActions.putLocal(receiptToSave);
  return receiptToSave;
}

/**
 * Save schedule to localDb
 */
export async function saveScheduleToLocalDb(
  scheduleData: {
    id?: string;
    day: string;
    startTime: string;
    endTime: string;
    roomId: string;
    teacherId: string;
    subjectId: string;
    managerId: string;
    centerId?: string;
  }
): Promise<Schedule> {
  const now = Date.now();
  const scheduleToSave: Schedule = {
    id: scheduleData.id || generateObjectId(),
    status: 'w' as const,
    createdAt: now,
    updatedAt: now,
    day: scheduleData.day,
    startTime: scheduleData.startTime,
    endTime: scheduleData.endTime,
    roomId: scheduleData.roomId,
    teacherId: scheduleData.teacherId,
    subjectId: scheduleData.subjectId,
    managerId: scheduleData.managerId,
    centerId: scheduleData.centerId,
  };

  await scheduleActions.putLocal(scheduleToSave);
  return scheduleToSave;
}

