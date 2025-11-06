/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/dexieModels.ts


// '1': synced
// 'w': waiting to sync
// '0': pending delete


export type SyncStatus = '1' | 'w' | '0';

export interface Center {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  classrooms: string[];
  workingDays: string[];
  managers: string[];
  adminId: string;
  createdAt: string;
  updatedAt: string;
  status: SyncStatus;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'MANAGER';
  createdAt: string;
  updatedAt: string;
  status: SyncStatus;
}

export interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  weeklySchedule?: any;
  createdAt: string;
  updatedAt: string;
  managerId: string;
  status: SyncStatus;
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  grade?: string;
  createdAt: string;
  updatedAt: string;
  managerId: string;
  status: SyncStatus;
}

export interface Subject {
  id: string;
  name: string;
  grade: string;
  price: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  centerId: string;
  status: SyncStatus;
}

export interface TeacherSubject {
  id: string;
  percentage?: number;
  hourlyRate?: number;
  assignedAt: string;
  teacherId: string;
  subjectId: string;
  status: SyncStatus;
}

export interface StudentSubject {
  id: string;
  enrolledAt: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  status: SyncStatus;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  amount: number;
  type: 'STUDENT_PAYMENT' | 'TEACHER_PAYMENT';
  description?: string;
  paymentMethod?: string;
  date: string;
  createdAt: string;
  studentId?: string;
  teacherId?: string;
  managerId: string;
  status: SyncStatus;
}

export interface Schedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  roomId: string;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
  subjectId: string;
  managerId: string;
  centerId?: string;
  status: SyncStatus;
}

export interface PushSubscription {
  id: string;
  endpoint: string;
  keys: any;
  userId?: string;
  createdAt: string;
  role?: 'ADMIN' | 'MANAGER';
  status: SyncStatus;
}

export class SyncDexie extends Dexie {
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
    super("SyncDb");
    this.version(1).stores({
      centers: "id,status",
      users: "id,email,role,status",
      teachers: "id,email,managerId,status",
      students: "id,email,managerId,status",
      subjects: "id,centerId,status",
      teacherSubjects: "id,teacherId,subjectId,status",
      studentSubjects: "id,studentId,subjectId,teacherId,status",
      receipts: "id,managerId,studentId,teacherId,receiptNumber,status",
      schedules: "id,managerId,teacherId,subjectId,centerId,status",
      pushSubscriptions: "id,endpoint,userId,role,status"
    });
  }
}

export const syncDb = new SyncDexie();

// --- GENERIC ACTIONS GENERATOR ---
function generateDexieActions<T>(table: Table<T, string>) {
  return {
    putLocal: async (item: T) => { await table.put(item); },
    getAll: async () => table.toArray(),
    deleteLocal: async (id: string) => { await table.delete(id); },
    markForDelete: async (id: string) => { await table.update(id, { status: '0' }); },
    markSynced: async (id: string) => { await table.update(id, { status: '1' }); },
    getSyncTargets: async () => ({
      waiting: await table.where('status').equals('w').toArray(),
      pending: await table.where('status').equals('0').toArray(),
    }),
  };
}

export const userActions = generateDexieActions(syncDb.users);
export const centerActions = generateDexieActions(syncDb.centers);