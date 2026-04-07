/* eslint-disable @typescript-eslint/no-explicit-any */
// serverActions.ts - Central export for all server action modules

import ServerActionUsers from "./userServerAction";
import ServerActionCenters from "./centerServerAction";
import ServerActionTeachers from "./teacherServerAction";
import ServerActionStudents from "./studentServerAction";
import ServerActionSubjects from "./subjectServerAction";
import ServerActionReceipts from "./receiptServerAction";
import ServerActionSchedules from "./scheduleServerAction";
import ServerActionDeleteRequests from "./deleteRequestServerAction";
import { isFreeModeActive } from "./freeModeHelper";

// ✅ Export all server actions for easy importing
export {
  ServerActionUsers,
  ServerActionCenters,
  ServerActionTeachers,
  ServerActionStudents,
  ServerActionSubjects,
  ServerActionReceipts,
  ServerActionSchedules,
  ServerActionDeleteRequests,
};

// ✅ Convenience function to sync all entities
export async function syncAllEntities() {
  if (isFreeModeActive()) {
    return {
      users: { status: "fulfilled", value: { success: true, synced: 0 } },
      centers: { status: "fulfilled", value: { success: true, synced: 0 } },
      teachers: { status: "fulfilled", value: { success: true, synced: 0 } },
      students: { status: "fulfilled", value: { success: true, synced: 0 } },
      subjects: { status: "fulfilled", value: { success: true, synced: 0 } },
      receipts: { status: "fulfilled", value: { success: true, synced: 0 } },
      schedules: { status: "fulfilled", value: { success: true, synced: 0 } },
    };
  }
  const results = await Promise.allSettled([
    ServerActionUsers.Sync(),
    ServerActionCenters.Sync(),
    ServerActionTeachers.Sync(),
    ServerActionStudents.Sync(),
    ServerActionSubjects.Sync(),
    ServerActionReceipts.Sync(),
    ServerActionSchedules.Sync(),
  ]);

  return {
    users: results[0],
    centers: results[1],
    teachers: results[2],
    students: results[3],
    subjects: results[4],
    receipts: results[5],
    schedules: results[6],
  };
}

// ✅ Convenience function to import all entities from server
export async function importAllFromServer() {
  if (isFreeModeActive()) {
    return {
      users: { status: "fulfilled", value: { success: true, imported: 0 } },
      centers: { status: "fulfilled", value: { success: true, imported: 0 } },
      teachers: { status: "fulfilled", value: { success: true, imported: 0 } },
      students: { status: "fulfilled", value: { success: true, imported: 0 } },
      subjects: { status: "fulfilled", value: { success: true, imported: 0 } },
      receipts: { status: "fulfilled", value: { success: true, imported: 0 } },
      schedules: { status: "fulfilled", value: { success: true, imported: 0 } },
    };
  }
  const results = await Promise.allSettled([
    ServerActionUsers.ImportFromServer(),
    ServerActionCenters.ImportFromServer(),
    ServerActionTeachers.ImportFromServer(),
    ServerActionStudents.ImportFromServer(),
    ServerActionSubjects.ImportFromServer(),
    ServerActionReceipts.ImportFromServer(),
    ServerActionSchedules.ImportFromServer(),
  ]);

  return {
    users: results[0],
    centers: results[1],
    teachers: results[2],
    students: results[3],
    subjects: results[4],
    receipts: results[5],
    schedules: results[6],
  };
}

// ✅ Role-aware sync function - includes users only for admins
export async function syncAllEntitiesForRole(isAdmin: boolean) {
  const syncPromises = [
    ServerActionCenters.Sync(),
    ServerActionTeachers.Sync(),
    ServerActionStudents.Sync(),
    ServerActionSubjects.Sync(),
    ServerActionReceipts.Sync(),
    ServerActionSchedules.Sync(),
  ];

  // Only sync users if admin
  if (isAdmin) {
    syncPromises.unshift(ServerActionUsers.Sync());
  }

  const results = await Promise.allSettled(syncPromises);

  if (isAdmin) {
    return {
      users: results[0],
      centers: results[1],
      teachers: results[2],
      students: results[3],
      subjects: results[4],
      receipts: results[5],
      schedules: results[6],
    };
  } else {
    return {
      centers: results[0],
      teachers: results[1],
      students: results[2],
      subjects: results[3],
      receipts: results[4],
      schedules: results[5],
    };
  }
}

// ✅ Role-aware import function - includes users only for admins
export async function importAllFromServerForRole(isAdmin: boolean) {
  const importPromises = [
    ServerActionCenters.ImportFromServer(),
    ServerActionTeachers.ImportFromServer(),
    ServerActionStudents.ImportFromServer(),
    ServerActionSubjects.ImportFromServer(),
    ServerActionReceipts.ImportFromServer(),
    ServerActionSchedules.ImportFromServer(),
  ];

  // Only import users if admin
  if (isAdmin) {
    importPromises.unshift(ServerActionUsers.ImportFromServer());
  }

  const results = await Promise.allSettled(importPromises);

  if (isAdmin) {
    return {
      users: results[0],
      centers: results[1],
      teachers: results[2],
      students: results[3],
      subjects: results[4],
      receipts: results[5],
      schedules: results[6],
    };
  } else {
    return {
      centers: results[0],
      teachers: results[1],
      students: results[2],
      subjects: results[3],
      receipts: results[4],
      schedules: results[5],
    };
  }
}
