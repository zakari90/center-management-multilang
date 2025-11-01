/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/offlineApi.ts
import { localDb } from './dexie';

// Helper to add to sync queue
async function addToSyncQueue(
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  data: any,
  entityId?: string
) {
  await localDb.syncQueue.add({
    operation,
    entity,
    entityId,
    data,
    timestamp: new Date(),
    attempts: 0,
    status: 'pending'
  });
}

// Generate temporary ID for offline records
function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Student Operations
export async function addStudentOffline(studentData: any, managerId: string) {
  const tempId = generateTempId();
  const now = new Date();
  
  // Extract enrollments if present
  const { enrollments, ...studentInfo } = studentData;
  
  const newStudent = {
    id: tempId,
    ...studentInfo,
    managerId,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending' as const
  };

  await localDb.students.add(newStudent);
  
  // Save enrollments (studentSubjects) offline if provided
  if (enrollments && Array.isArray(enrollments) && enrollments.length > 0) {
    for (const enrollment of enrollments) {
      const studentSubjectData = {
        id: generateTempId(),
        studentId: tempId,
        subjectId: enrollment.subjectId,
        teacherId: enrollment.teacherId,
        enrolledAt: now,
        syncStatus: 'pending' as const
      };
      
      await localDb.studentSubjects.add(studentSubjectData);
    }
  }
  
  // Add student to sync queue (with enrollments included in data - API creates both together)
  await addToSyncQueue('CREATE', 'students', studentData, tempId);
  
  return newStudent;
}

export async function updateStudentOffline(id: string, updates: any) {
  await localDb.students.update(id, {
    ...updates,
    updatedAt: new Date(),
    syncStatus: 'pending'
  });
  
  await addToSyncQueue('UPDATE', 'students', updates, id);
}

export async function deleteStudentOffline(id: string) {
  await localDb.students.delete(id);
  await addToSyncQueue('DELETE', 'students', {}, id);
}

export async function getStudentsOffline(managerId: string) {
  return await localDb.students.where('managerId').equals(managerId).toArray();
}

// Teacher Operations
export async function addTeacherOffline(teacherData: any, managerId: string) {
  const tempId = generateTempId();
  const now = new Date();
  
  const newTeacher = {
    id: tempId,
    ...teacherData,
    managerId,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending' as const
  };

  await localDb.teachers.add(newTeacher);
  await addToSyncQueue('CREATE', 'teachers', teacherData, tempId);
  
  return newTeacher;
}

export async function updateTeacherOffline(id: string, updates: any) {
  await localDb.teachers.update(id, {
    ...updates,
    updatedAt: new Date(),
    syncStatus: 'pending'
  });
  
  await addToSyncQueue('UPDATE', 'teachers', updates, id);
}

export async function getTeachersOffline(managerId: string) {
  return await localDb.teachers.where('managerId').equals(managerId).toArray();
}

// Receipt Operations
export async function addReceiptOffline(receiptData: any, managerId: string) {
  const tempId = generateTempId();
  const now = new Date();
  
  // Generate receipt number if not provided
  const receiptNumber = receiptData.receiptNumber || `REC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  // Determine receipt type based on data
  const receiptType = receiptData.type || (receiptData.studentId ? 'STUDENT_PAYMENT' : 'TEACHER_PAYMENT');
  
  const newReceipt = {
    id: tempId,
    receiptNumber,
    amount: receiptData.amount || 0,
    type: receiptType,
    description: receiptData.description || null,
    paymentMethod: receiptData.paymentMethod || null,
    date: receiptData.date ? new Date(receiptData.date) : now,
    studentId: receiptData.studentId || null,
    teacherId: receiptData.teacherId || null,
    managerId,
    createdAt: now,
    syncStatus: 'pending' as const
  };

  await localDb.receipts.add(newReceipt);
  
  // Prepare data for sync (exclude internal fields)
  const syncData = {
    receiptNumber: newReceipt.receiptNumber,
    amount: newReceipt.amount,
    type: newReceipt.type,
    description: newReceipt.description,
    paymentMethod: newReceipt.paymentMethod,
    date: newReceipt.date,
    studentId: newReceipt.studentId,
    teacherId: newReceipt.teacherId,
    ...(receiptData.subjectIds && { subjectIds: receiptData.subjectIds })
  };
  
  await addToSyncQueue('CREATE', 'receipts', syncData, tempId);
  
  return newReceipt;
}

export async function getReceiptsOffline(managerId: string) {
  return await localDb.receipts.where('managerId').equals(managerId).toArray();
}

// Center Operations
export async function addCenterOffline(centerData: any, adminId: string) {
  const tempId = generateTempId();
  const now = new Date();
  
  const newCenter = {
    id: tempId,
    ...centerData,
    adminId,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending' as const
  };

  await localDb.centers.add(newCenter);
  await addToSyncQueue('CREATE', 'center', centerData, tempId); // endpoint is /api/center (singular)
  
  return newCenter;
}

export async function getCentersOffline(adminId: string) {
  return await localDb.centers.where('adminId').equals(adminId).toArray();
}

// Subject Operations
export async function addSubjectOffline(subjectData: any, centerId: string) {
  const tempId = generateTempId();
  const now = new Date();
  
  const newSubject = {
    id: tempId,
    ...subjectData,
    centerId,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending' as const
  };

  await localDb.subjects.add(newSubject);
  await addToSyncQueue('CREATE', 'subjects', subjectData, tempId);
  
  return newSubject;
}

export async function getSubjectsOffline(centerId: string) {
  return await localDb.subjects.where('centerId').equals(centerId).toArray();
}

// Schedule Operations
export async function addScheduleOffline(scheduleData: any, managerId: string) {
  const tempId = generateTempId();
  const now = new Date();
  
  const newSchedule = {
    id: tempId,
    ...scheduleData,
    managerId,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending' as const
  };

  await localDb.schedules.add(newSchedule);
  await addToSyncQueue('CREATE', 'schedules', scheduleData, tempId);
  
  return newSchedule;
}

export async function getSchedulesOffline(managerId: string) {
  return await localDb.schedules.where('managerId').equals(managerId).toArray();
}

// Get pending sync count
export async function getPendingSyncCount() {
  return await localDb.syncQueue.where('status').equals('pending').count();
}
