import Dexie, { Table } from "dexie";

export interface AttendanceSession {
  id: string;
  institution: string;
  month: string;
  year: string;
  date: number; // Added for Daily Log (timestamp of the start of the day)
  shift: "morning" | "evening"; // Added for shift tracking
  createdAt: number;
  updatedAt: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  externalId: string; // Can be studentId, teacherId, or empty for guest
  name: string; // Generic name (snapshot)
  morning: string; // Notes for morning shift
  evening: string; // Notes for evening shift
  status: string; // P, A, L, LV
  remarks: string;
  updatedAt: number;
}

export const ATTENDANCE_DB_NAME = "freeattendancedb";

export class AttendanceDatabase extends Dexie {
  sessions!: Table<AttendanceSession>;
  records!: Table<AttendanceRecord>;

  constructor() {
    super(ATTENDANCE_DB_NAME);
    this.version(2).stores({
      sessions: "id, date, shift, updatedAt",
      records: "id, sessionId, externalId, updatedAt",
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
  saveSession: async (
    session: AttendanceSession,
    records: AttendanceRecord[],
  ) => {
    return await attendanceDb.transaction(
      "rw",
      [attendanceDb.sessions, attendanceDb.records],
      async () => {
        await attendanceDb.sessions.put(session);
        // Clear existing records for this specific session ID to ensure clean updates
        await attendanceDb.records
          .where("sessionId")
          .equals(session.id)
          .delete();
        await attendanceDb.records.bulkPut(records);
      },
    );
  },

  getSession: async (id: string) => {
    const session = await attendanceDb.sessions.get(id);
    const records = await attendanceDb.records
      .where("sessionId")
      .equals(id)
      .toArray();
    return { session, records };
  },

  getDailySession: async (date: number, shift: "morning" | "evening") => {
    // Helper to find a session for a specific day and shift
    const session = await attendanceDb.sessions
      .where("date")
      .equals(date)
      .and((s) => s.shift === shift)
      .first();

    if (session) {
      const records = await attendanceDb.records
        .where("sessionId")
        .equals(session.id)
        .toArray();
      return { session, records };
    }
    return { session: null, records: [] };
  },

  getAllSessions: async () => {
    return await attendanceDb.sessions.orderBy("date").reverse().toArray();
  },

  deleteSession: async (id: string) => {
    return await attendanceDb.transaction(
      "rw",
      [attendanceDb.sessions, attendanceDb.records],
      async () => {
        await attendanceDb.sessions.delete(id);
        await attendanceDb.records.where("sessionId").equals(id).delete();
      },
    );
  },

  clearSessionRecords: async (sessionId: string) => {
    return await attendanceDb.records
      .where("sessionId")
      .equals(sessionId)
      .delete();
  },
};
