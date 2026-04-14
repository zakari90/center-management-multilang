import Dexie, { Table } from "dexie";

export interface AttendanceSession {
  id: string;
  institution: string;
  month: string;
  year: string;
  createdAt: number;
  updatedAt: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string; // From freecenterdb
  studentName: string; // Snapshot for history
  rollNumber: string;
  department: string;
  status: string; // P, A, L, LV etc.
  remarks: string;
  updatedAt: number;
}

export const ATTENDANCE_DB_NAME = "freeattendancedb";

export class AttendanceDatabase extends Dexie {
  sessions!: Table<AttendanceSession>;
  records!: Table<AttendanceRecord>;

  constructor() {
    super(ATTENDANCE_DB_NAME);
    this.version(1).stores({
      sessions: "id, institution, month, year, updatedAt",
      records: "id, sessionId, studentId, updatedAt",
    });
  }
}

// Lazy singleton
let _attendanceDb: AttendanceDatabase | null = null;

export function getAttendanceDb(): AttendanceDatabase {
  if (!_attendanceDb) {
    _attendanceDb = new AttendanceDatabase();
  }
  return _attendanceDb;
}

export const attendanceDb = new Proxy({} as AttendanceDatabase, {
  get(_target, prop, receiver) {
    return Reflect.get(getAttendanceDb(), prop, receiver);
  },
});

// Helper actions
export const attendanceActions = {
  saveSession: async (session: AttendanceSession, records: AttendanceRecord[]) => {
    return await attendanceDb.transaction("rw", [attendanceDb.sessions, attendanceDb.records], async () => {
      await attendanceDb.sessions.put(session);
      // Clear existing records for this session if updating
      await attendanceDb.records.where("sessionId").equals(session.id).delete();
      await attendanceDb.records.bulkPut(records);
    });
  },
  
  getSession: async (id: string) => {
    const session = await attendanceDb.sessions.get(id);
    const records = await attendanceDb.records.where("sessionId").equals(id).toArray();
    return { session, records };
  },

  getAllSessions: async () => {
    return await attendanceDb.sessions.orderBy("updatedAt").reverse().toArray();
  },

  deleteSession: async (id: string) => {
    return await attendanceDb.transaction("rw", [attendanceDb.sessions, attendanceDb.records], async () => {
      await attendanceDb.sessions.delete(id);
      await attendanceDb.records.where("sessionId").equals(id).delete();
    });
  }
};
