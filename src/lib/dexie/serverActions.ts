/* eslint-disable @typescript-eslint/no-explicit-any */
// serverActions.ts - Central export for all server action modules

import ServerActionUsers from "./userServerAction";
import ServerActionCenters from "./centerServerAction";
import ServerActionTeachers from "./teacherServerAction";
import ServerActionStudents from "./studentServerAction";
import ServerActionSubjects from "./subjectServerAction";
import ServerActionReceipts from "./receiptServerAction";
import ServerActionSchedules from "./scheduleServerAction";

// ✅ Export all server actions for easy importing
export {
  ServerActionUsers,
  ServerActionCenters,
  ServerActionTeachers,
  ServerActionStudents,
  ServerActionSubjects,
  ServerActionReceipts,
  ServerActionSchedules,
};

// ✅ Convenience function to sync all entities
export async function syncAllEntities() {
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

