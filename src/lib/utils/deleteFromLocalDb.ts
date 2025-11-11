/**
 * Delete utility for Dexie entities
 * Handles deletion based on sync status:
 * - If status is 'w' (waiting): Delete directly from localDb (never synced to server)
 * - If status is '1' (synced): Mark for deletion (status '0') to sync deletion to server
 */

import {
  userActions,
  centerActions,
  teacherActions,
  studentActions,
  subjectActions,
  receiptActions,
  scheduleActions,
} from '../dexie/dexieActions';

type EntityType = 'users' | 'centers' | 'teachers' | 'students' | 'subjects' | 'receipts' | 'schedules';

const entityActions = {
  users: userActions,
  centers: centerActions,
  teachers: teacherActions,
  students: studentActions,
  subjects: subjectActions,
  receipts: receiptActions,
  schedules: scheduleActions,
} as const;

/**
 * Delete an entity from localDb based on its status
 * @param entityType - The type of entity to delete
 * @param id - The ID of the entity to delete
 * @returns Promise<boolean> - true if deleted, false if marked for deletion
 */
export async function deleteFromLocalDb(
  entityType: EntityType,
  id: string
): Promise<{ deleted: boolean; markedForDeletion: boolean }> {
  const actions = entityActions[entityType];
  
  if (!actions) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  // Get the item to check its status
  const item = await actions.getLocal(id);
  
  if (!item) {
    console.warn(`Item ${id} not found in localDb for entity ${entityType}`);
    return { deleted: false, markedForDeletion: false };
  }

  // If status is 'w' (waiting to sync), delete directly from localDb
  // This item was never synced to server, so we can safely delete it
  if (item.status === 'w') {
    await actions.deleteLocal(id);
    console.log(`🗑️ Deleted ${entityType} ${id} directly (status 'w' - never synced)`);
    return { deleted: true, markedForDeletion: false };
  }

  // If status is '1' (synced), mark for deletion (status '0')
  // The sync worker will delete it from server, then remove it from localDb
  if (item.status === '1') {
    await actions.markForDelete(id);
    console.log(`🗑️ Marked ${entityType} ${id} for deletion (status '1' -> '0')`);
    return { deleted: false, markedForDeletion: true };
  }

  // If status is '0' (already marked for deletion), do nothing
  if (item.status === '0') {
    console.log(`ℹ️ Item ${entityType} ${id} is already marked for deletion`);
    return { deleted: false, markedForDeletion: true };
  }

  // Fallback: delete directly (shouldn't happen)
  console.warn(`Unknown status for ${entityType} ${id}: ${item.status}, deleting directly`);
  await actions.deleteLocal(id);
  return { deleted: true, markedForDeletion: false };
}

/**
 * Delete a student from localDb
 */
export async function deleteStudentFromLocalDb(id: string): Promise<{ deleted: boolean; markedForDeletion: boolean }> {
  return deleteFromLocalDb('students', id);
}

/**
 * Delete a teacher from localDb
 */
export async function deleteTeacherFromLocalDb(id: string): Promise<{ deleted: boolean; markedForDeletion: boolean }> {
  return deleteFromLocalDb('teachers', id);
}

/**
 * Delete a center from localDb
 */
export async function deleteCenterFromLocalDb(id: string): Promise<{ deleted: boolean; markedForDeletion: boolean }> {
  return deleteFromLocalDb('centers', id);
}

/**
 * Delete a subject from localDb
 */
export async function deleteSubjectFromLocalDb(id: string): Promise<{ deleted: boolean; markedForDeletion: boolean }> {
  return deleteFromLocalDb('subjects', id);
}

/**
 * Delete a receipt from localDb
 */
export async function deleteReceiptFromLocalDb(id: string): Promise<{ deleted: boolean; markedForDeletion: boolean }> {
  return deleteFromLocalDb('receipts', id);
}

/**
 * Delete a schedule from localDb
 */
export async function deleteScheduleFromLocalDb(id: string): Promise<{ deleted: boolean; markedForDeletion: boolean }> {
  return deleteFromLocalDb('schedules', id);
}

/**
 * Delete a user from localDb
 */
export async function deleteUserFromLocalDb(id: string): Promise<{ deleted: boolean; markedForDeletion: boolean }> {
  return deleteFromLocalDb('users', id);
}

