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
  
  const newStudent = {
    id: tempId,
    ...studentData,
    managerId,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending' as const
  };

  await localDb.students.add(newStudent);
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
  
  const newReceipt = {
    id: tempId,
    ...receiptData,
    managerId,
    createdAt: now,
    date: receiptData.date || now,
    syncStatus: 'pending' as const
  };

  await localDb.receipts.add(newReceipt);
  await addToSyncQueue('CREATE', 'receipts', receiptData, tempId);
  
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
  await addToSyncQueue('CREATE', 'centers', centerData, tempId);
  
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
