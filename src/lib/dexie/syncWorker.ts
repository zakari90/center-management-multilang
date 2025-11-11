import axios from 'axios';
import {
  userActions,
  centerActions,
  teacherActions,
  studentActions,
  subjectActions,
  receiptActions,
  scheduleActions,
} from './dexieActions';
import { isOnline } from '../utils/network';
import { getPlainPasswordForSync, clearPlainPasswordForSync } from '../utils/saveManagerToLocalDb';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Sync all pending entities to the server
 * This function syncs all entities with status 'w' (waiting) to the server
 * and marks them as '1' (synced) after successful sync
 */
export async function syncPendingEntities() {
  if (!isOnline()) {
    console.log('Offline - skipping sync');
    return;
  }

  console.log('🔄 Starting sync of all pending entities...');

  // Sync users (admins and managers)
  await syncPendingUsers();

  // Sync centers
  await syncPendingCenters();

  // Sync teachers
  await syncPendingTeachers();

  // Sync students
  await syncPendingStudents();

  // Sync subjects
  await syncPendingSubjects();

  // Sync receipts
  await syncPendingReceipts();

  // Sync schedules
  await syncPendingSchedules();

  console.log('✅ Sync complete');
}

/**
 * Sync pending users (admins and managers)
 */
export async function syncPendingUsers() {
  const { waiting, pending } = await userActions.getSyncTargets();

  // Sync waiting items (new/updated users)
  for (const user of waiting) {
    try {
      const plainPassword = getPlainPasswordForSync(user.email);
      
      if (!plainPassword && user.status === 'w') {
        console.warn(`No plain password found for ${user.email}, skipping sync`);
        continue;
      }
      
      let syncSuccess = false;
      
      if (user.role === 'MANAGER') {
        await axios.post(`${BASE_URL}/api/manager/register`, {
          id: user.id,
          username: user.name,
          email: user.email,
          password: plainPassword || '',
        }, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        syncSuccess = true;
        console.log(`✅ Synced manager ${user.id} (${user.email})`);
      } else if (user.role === 'ADMIN') {
        await axios.post(`${BASE_URL}/api/admin/users`, {
          id: user.id,
          name: user.name,
          email: user.email,
          password: plainPassword || '',
          role: 'ADMIN',
        }, {
        headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        syncSuccess = true;
        console.log(`✅ Synced admin ${user.id} (${user.email})`);
      }
      
      if (syncSuccess) {
        clearPlainPasswordForSync(user.email);
        await userActions.markSynced(user.id);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const errorMessage = axiosError?.response?.data?.error || axiosError?.response?.data?.message || '';
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 409 || statusCode === 400) {
        if (errorMessage.includes('already exists') || errorMessage.includes('already in use')) {
          console.log(`User ${user.id} (${user.email}) already exists on server - marking as synced`);
          clearPlainPasswordForSync(user.email);
      await userActions.markSynced(user.id);
        } else {
          console.error(`Failed to sync user ${user.id}:`, axiosError?.response?.data || error);
        }
      } else {
        console.error(`Failed to sync user ${user.id}:`, axiosError?.response?.data || error);
      }
    }
  }

  // Sync pending deletions
  for (const user of pending) {
    try {
      await axios.delete(`${BASE_URL}/api/admin/users/${user.id}`, {
        withCredentials: true,
      });
      // Server deletion succeeded, delete from localDb
      await userActions.deleteLocal(user.id);
      console.log(`✅ Deleted user ${user.id} from server and localDb`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      const statusCode = axiosError?.response?.status;
      
      // If item is already deleted on server (404), delete from localDb
      if (statusCode === 404) {
        await userActions.deleteLocal(user.id);
        console.log(`✅ User ${user.id} already deleted on server, removed from localDb`);
      } else {
        console.error(`Failed to delete user ${user.id}:`, axiosError?.response?.data || error);
        // Item remains with status '0' for retry later
      }
    }
  }
}

/**
 * Sync pending centers
 */
export async function syncPendingCenters() {
  const { waiting, pending } = await centerActions.getSyncTargets();

  for (const center of waiting) {
    try {
      await axios.post(`${BASE_URL}/api/centers`, {
        id: center.id,
        name: center.name,
        address: center.address,
        phone: center.phone,
        classrooms: center.classrooms,
        workingDays: center.workingDays,
        managers: center.managers,
        adminId: center.adminId,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      
      await centerActions.markSynced(center.id);
      console.log(`✅ Synced center ${center.id} (${center.name})`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 409 || statusCode === 400) {
        const errorMessage = axiosError?.response?.data?.error || axiosError?.response?.data?.message || '';
        if (errorMessage.includes('already exists') || errorMessage.includes('already in use')) {
          console.log(`Center ${center.id} already exists on server - marking as synced`);
          await centerActions.markSynced(center.id);
        }
      } else {
        console.error(`Failed to sync center ${center.id}:`, axiosError?.response?.data || error);
      }
    }
  }

  for (const center of pending) {
    try {
      await axios.delete(`${BASE_URL}/api/centers/${center.id}`, {
        withCredentials: true,
      });
      await centerActions.deleteLocal(center.id);
      console.log(`✅ Deleted center ${center.id} from server and localDb`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 404) {
        await centerActions.deleteLocal(center.id);
        console.log(`✅ Center ${center.id} already deleted on server, removed from localDb`);
      } else {
        console.error(`Failed to delete center ${center.id}:`, axiosError?.response?.data || error);
      }
    }
  }
}

/**
 * Sync pending teachers
 */
export async function syncPendingTeachers() {
  const { waiting, pending } = await teacherActions.getSyncTargets();

  for (const teacher of waiting) {
    try {
      await axios.post(`${BASE_URL}/api/teachers`, {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        address: teacher.address,
        weeklySchedule: teacher.weeklySchedule,
        managerId: teacher.managerId,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      
      await teacherActions.markSynced(teacher.id);
      console.log(`✅ Synced teacher ${teacher.id} (${teacher.name})`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 409 || statusCode === 400) {
        const errorMessage = axiosError?.response?.data?.error || axiosError?.response?.data?.message || '';
        if (errorMessage.includes('already exists')) {
          await teacherActions.markSynced(teacher.id);
        }
      } else {
        console.error(`Failed to sync teacher ${teacher.id}:`, axiosError?.response?.data || error);
      }
    }
  }

  for (const teacher of pending) {
    try {
      await axios.delete(`${BASE_URL}/api/teachers/${teacher.id}`, {
        withCredentials: true,
      });
      await teacherActions.deleteLocal(teacher.id);
      console.log(`✅ Deleted teacher ${teacher.id} from server and localDb`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 404) {
        await teacherActions.deleteLocal(teacher.id);
        console.log(`✅ Teacher ${teacher.id} already deleted on server, removed from localDb`);
      } else {
        console.error(`Failed to delete teacher ${teacher.id}:`, axiosError?.response?.data || error);
      }
    }
  }
}

/**
 * Sync pending students
 */
export async function syncPendingStudents() {
  const { waiting, pending } = await studentActions.getSyncTargets();

  for (const student of waiting) {
    try {
      await axios.post(`${BASE_URL}/api/students`, {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        grade: student.grade,
        managerId: student.managerId,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      
      await studentActions.markSynced(student.id);
      console.log(`✅ Synced student ${student.id} (${student.name})`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 409 || statusCode === 400) {
        const errorMessage = axiosError?.response?.data?.error || axiosError?.response?.data?.message || '';
        if (errorMessage.includes('already exists')) {
          await studentActions.markSynced(student.id);
        }
      } else {
        console.error(`Failed to sync student ${student.id}:`, axiosError?.response?.data || error);
      }
    }
  }

  for (const student of pending) {
    try {
      await axios.delete(`${BASE_URL}/api/students/${student.id}`, {
        withCredentials: true,
      });
      await studentActions.deleteLocal(student.id);
      console.log(`✅ Deleted student ${student.id} from server and localDb`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 404) {
        await studentActions.deleteLocal(student.id);
        console.log(`✅ Student ${student.id} already deleted on server, removed from localDb`);
      } else {
        console.error(`Failed to delete student ${student.id}:`, axiosError?.response?.data || error);
      }
    }
  }
}

/**
 * Sync pending subjects
 */
export async function syncPendingSubjects() {
  const { waiting, pending } = await subjectActions.getSyncTargets();

  for (const subject of waiting) {
    try {
      await axios.post(`${BASE_URL}/api/subjects`, {
        id: subject.id,
        name: subject.name,
        grade: subject.grade,
        price: subject.price,
        duration: subject.duration,
        centerId: subject.centerId,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      
      await subjectActions.markSynced(subject.id);
      console.log(`✅ Synced subject ${subject.id} (${subject.name})`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 409 || statusCode === 400) {
        const errorMessage = axiosError?.response?.data?.error || axiosError?.response?.data?.message || '';
        if (errorMessage.includes('already exists')) {
          await subjectActions.markSynced(subject.id);
        }
      } else {
        console.error(`Failed to sync subject ${subject.id}:`, axiosError?.response?.data || error);
      }
    }
  }

  for (const subject of pending) {
    try {
      // API expects DELETE with body data
      await axios.delete(`${BASE_URL}/api/subjects`, {
        data: { subjectId: subject.id },
        withCredentials: true,
      });
      await subjectActions.deleteLocal(subject.id);
      console.log(`✅ Deleted subject ${subject.id} from server and localDb`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 404) {
        await subjectActions.deleteLocal(subject.id);
        console.log(`✅ Subject ${subject.id} already deleted on server, removed from localDb`);
      } else {
        console.error(`Failed to delete subject ${subject.id}:`, axiosError?.response?.data || error);
      }
    }
  }
}

/**
 * Sync pending receipts
 */
export async function syncPendingReceipts() {
  const { waiting, pending } = await receiptActions.getSyncTargets();

  for (const receipt of waiting) {
    try {
      await axios.post(`${BASE_URL}/api/receipts`, {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        amount: receipt.amount,
        type: receipt.type,
        description: receipt.description,
        paymentMethod: receipt.paymentMethod,
        date: receipt.date,
        studentId: receipt.studentId,
        teacherId: receipt.teacherId,
        managerId: receipt.managerId,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      
      await receiptActions.markSynced(receipt.id);
      console.log(`✅ Synced receipt ${receipt.id} (${receipt.receiptNumber})`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 409 || statusCode === 400) {
        const errorMessage = axiosError?.response?.data?.error || axiosError?.response?.data?.message || '';
        if (errorMessage.includes('already exists')) {
          await receiptActions.markSynced(receipt.id);
        }
      } else {
        console.error(`Failed to sync receipt ${receipt.id}:`, axiosError?.response?.data || error);
      }
    }
  }

  for (const receipt of pending) {
    try {
      await axios.delete(`${BASE_URL}/api/receipts/${receipt.id}`, {
        withCredentials: true,
      });
      await receiptActions.deleteLocal(receipt.id);
      console.log(`✅ Deleted receipt ${receipt.id} from server and localDb`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 404) {
        await receiptActions.deleteLocal(receipt.id);
        console.log(`✅ Receipt ${receipt.id} already deleted on server, removed from localDb`);
      } else {
        console.error(`Failed to delete receipt ${receipt.id}:`, axiosError?.response?.data || error);
      }
    }
  }
}

/**
 * Sync pending schedules
 */
export async function syncPendingSchedules() {
  const { waiting, pending } = await scheduleActions.getSyncTargets();

  for (const schedule of waiting) {
    try {
      await axios.post(`${BASE_URL}/api/schedules`, {
        id: schedule.id,
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        roomId: schedule.roomId,
        teacherId: schedule.teacherId,
        subjectId: schedule.subjectId,
        managerId: schedule.managerId,
        centerId: schedule.centerId,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      
      await scheduleActions.markSynced(schedule.id);
      console.log(`✅ Synced schedule ${schedule.id}`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 409 || statusCode === 400) {
        const errorMessage = axiosError?.response?.data?.error || axiosError?.response?.data?.message || '';
        if (errorMessage.includes('already exists')) {
          await scheduleActions.markSynced(schedule.id);
        }
      } else {
        console.error(`Failed to sync schedule ${schedule.id}:`, axiosError?.response?.data || error);
      }
    }
  }

  for (const schedule of pending) {
    try {
      await axios.delete(`${BASE_URL}/api/schedules/${schedule.id}`, {
        withCredentials: true,
      });
      await scheduleActions.deleteLocal(schedule.id);
      console.log(`✅ Deleted schedule ${schedule.id} from server and localDb`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      const statusCode = axiosError?.response?.status;
      
      if (statusCode === 404) {
        await scheduleActions.deleteLocal(schedule.id);
        console.log(`✅ Schedule ${schedule.id} already deleted on server, removed from localDb`);
      } else {
        console.error(`Failed to delete schedule ${schedule.id}:`, axiosError?.response?.data || error);
      }
    }
  }
}


/**
 * Pull missing items from server and save to localDb with status '1'
 * This ensures items that exist on server but not locally are synced
 * Handles multiple users by fetching data for the current user
 */
export async function pullMissingEntitiesFromServer() {
  if (!isOnline()) {
    console.log('Offline - skipping pull sync');
    return;
  }

  console.log('📥 Pulling missing entities from server...');

  try {
    // Get current user to filter data
    const { getClientUser } = await import('../clientAuth');
    const user = await getClientUser();
    
    if (!user) {
      console.log('No user found - skipping pull sync');
      return;
    }

    // Pull users (admins and managers)
    await pullMissingUsers();

    // Pull centers (for admin)
    if (user.role === 'ADMIN') {
      await pullMissingCenters();
    }

    // Pull teachers, students, subjects, receipts, schedules (for managers)
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
      const managerId = user.id;
      await pullMissingTeachers(managerId);
      await pullMissingStudents(managerId);
      await pullMissingSubjects();
      await pullMissingReceipts(managerId);
      await pullMissingSchedules(managerId);
    }

    console.log('✅ Pull sync complete');
  } catch (error) {
    console.error('❌ Pull sync failed:', error);
  }
}

/**
 * Pull missing users from server
 */
async function pullMissingUsers() {
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/users`, {
      withCredentials: true,
    });

    if (Array.isArray(response.data)) {
      for (const user of response.data) {
        const existing = await userActions.getLocal(user.id);
        if (!existing) {
          // User doesn't exist locally, add it with status '1'
          await userActions.putLocal({
            id: user.id,
            email: user.email,
            password: user.password || '',
            name: user.name,
            role: user.role,
            status: '1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          console.log(`📥 Pulled user ${user.id} (${user.email})`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to pull users:', error);
  }
}

/**
 * Pull missing centers from server
 */
async function pullMissingCenters() {
  try {
    const response = await axios.get(`${BASE_URL}/api/centers`, {
      withCredentials: true,
    });

    if (Array.isArray(response.data)) {
      for (const center of response.data) {
        const existing = await centerActions.getLocal(center.id);
        if (!existing) {
          await centerActions.putLocal({
            id: center.id,
            name: center.name,
            address: center.address,
            phone: center.phone,
            classrooms: center.classrooms || [],
            workingDays: center.workingDays || [],
            managers: center.managers || [],
            adminId: center.adminId,
            status: '1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          console.log(`📥 Pulled center ${center.id} (${center.name})`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to pull centers:', error);
  }
}

/**
 * Pull missing teachers from server
 */
async function pullMissingTeachers(managerId: string) {
  try {
    const response = await axios.get(`${BASE_URL}/api/teachers?managerId=${managerId}`, {
      withCredentials: true,
    });

    if (Array.isArray(response.data)) {
      for (const teacher of response.data) {
        const existing = await teacherActions.getLocal(teacher.id);
        if (!existing) {
          await teacherActions.putLocal({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            address: teacher.address,
            weeklySchedule: teacher.weeklySchedule,
            managerId: teacher.managerId,
            status: '1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          console.log(`📥 Pulled teacher ${teacher.id} (${teacher.name})`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to pull teachers:', error);
  }
}

/**
 * Pull missing students from server
 */
async function pullMissingStudents(managerId: string) {
  try {
    const response = await axios.get(`${BASE_URL}/api/students?managerId=${managerId}`, {
      withCredentials: true,
    });

    if (Array.isArray(response.data)) {
      for (const student of response.data) {
        const existing = await studentActions.getLocal(student.id);
        if (!existing) {
          await studentActions.putLocal({
            id: student.id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            parentName: student.parentName,
            parentPhone: student.parentPhone,
            parentEmail: student.parentEmail,
            grade: student.grade,
            managerId: student.managerId,
            status: '1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          console.log(`📥 Pulled student ${student.id} (${student.name})`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to pull students:', error);
  }
}

/**
 * Pull missing subjects from server
 */
async function pullMissingSubjects() {
  try {
    const response = await axios.get(`${BASE_URL}/api/subjects`, {
      withCredentials: true,
    });

    if (Array.isArray(response.data)) {
      for (const subject of response.data) {
        const existing = await subjectActions.getLocal(subject.id);
        if (!existing) {
          await subjectActions.putLocal({
            id: subject.id,
            name: subject.name,
            grade: subject.grade,
            price: subject.price,
            duration: subject.duration,
            centerId: subject.centerId,
            status: '1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          console.log(`📥 Pulled subject ${subject.id} (${subject.name})`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to pull subjects:', error);
  }
}

/**
 * Pull missing receipts from server
 */
async function pullMissingReceipts(managerId: string) {
  try {
    const response = await axios.get(`${BASE_URL}/api/receipts?managerId=${managerId}`, {
      withCredentials: true,
    });

    if (Array.isArray(response.data)) {
      for (const receipt of response.data) {
        const existing = await receiptActions.getLocal(receipt.id);
        if (!existing) {
          await receiptActions.putLocal({
            id: receipt.id,
            receiptNumber: receipt.receiptNumber,
            amount: receipt.amount,
            type: receipt.type,
            description: receipt.description,
            paymentMethod: receipt.paymentMethod,
            date: receipt.date,
            studentId: receipt.studentId,
            teacherId: receipt.teacherId,
            managerId: receipt.managerId,
            status: '1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          console.log(`📥 Pulled receipt ${receipt.id} (${receipt.receiptNumber})`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to pull receipts:', error);
  }
}

/**
 * Pull missing schedules from server
 */
async function pullMissingSchedules(managerId: string) {
  try {
    const response = await axios.get(`${BASE_URL}/api/schedules?managerId=${managerId}`, {
      withCredentials: true,
    });

    if (Array.isArray(response.data)) {
      for (const schedule of response.data) {
        const existing = await scheduleActions.getLocal(schedule.id);
        if (!existing) {
          await scheduleActions.putLocal({
            id: schedule.id,
            day: schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            roomId: schedule.roomId,
            teacherId: schedule.teacherId,
            subjectId: schedule.subjectId,
            managerId: schedule.managerId,
            centerId: schedule.centerId,
            status: '1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          console.log(`📥 Pulled schedule ${schedule.id}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to pull schedules:', error);
  }
}

/**
 * Full sync: Push local changes AND pull missing items from server
 */
export async function fullSync() {
  if (!isOnline()) {
    console.log('Offline - skipping full sync');
    return;
  }

  console.log('🔄 Starting full sync (push + pull)...');
  
  // First push local changes
  await syncPendingEntities();
  
  // Then pull missing items from server
  await pullMissingEntitiesFromServer();
  
  console.log('✅ Full sync complete');
}

// Auto-sync when connection is restored
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Connection restored - syncing all pending entities...');
    fullSync().catch(err => console.error('Sync failed:', err));
  });
}

