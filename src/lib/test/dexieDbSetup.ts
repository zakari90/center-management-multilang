import Dexie from 'dexie';
import {
  Center, User, Teacher, Student, Subject, TeacherSubject, StudentSubject, Receipt, Schedule, PushSubscription
} from './dexieModels';

export class AppDexie extends Dexie {
  centers!: Dexie.Table<Center, string>;
  users!: Dexie.Table<User, string>;
  teachers!: Dexie.Table<Teacher, string>;
  students!: Dexie.Table<Student, string>;
  subjects!: Dexie.Table<Subject, string>;
  teacherSubjects!: Dexie.Table<TeacherSubject, string>;
  studentSubjects!: Dexie.Table<StudentSubject, string>;
  receipts!: Dexie.Table<Receipt, string>;
  schedules!: Dexie.Table<Schedule, string>;
  pushSubscriptions!: Dexie.Table<PushSubscription, string>;

  constructor() {
    super('AppDatabase');
    this.version(1).stores({
      centers: 'id, status, updatedAt',
      users: 'id, email, role, status, updatedAt',
      teachers: 'id, managerId, status, updatedAt',
      students: 'id, managerId, status, updatedAt',
      subjects: 'id, centerId, status, updatedAt',
      teacherSubjects: 'id, teacherId, subjectId, status, assignedAt',
      studentSubjects: 'id, studentId, subjectId, teacherId, status, enrolledAt',
      receipts: 'id, managerId, studentId, teacherId, receiptNumber, status',
      schedules: 'id, managerId, teacherId, subjectId, centerId, status, updatedAt',
      pushSubscriptions: 'id, endpoint, userId, role, status',
    });
  }
}

export const appDb = new AppDexie();
