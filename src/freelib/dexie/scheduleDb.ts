import Dexie, { Table } from "dexie";

export interface TimeTableEntry {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  name: string; // Generic Name (replaces subject/teacher)
  roomId: string; // Room (as text)
  centerId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AttendanceSession {
  id: string;
  institution: string;
  month: string;
  year: string;
  date: number;
  shift: "morning" | "evening";
  name: string;
  scheduleId?: string; // Links this session to a specific timetable entry
  createdAt: number;
  updatedAt: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  externalId: string;
  name: string;
  morning: string;
  evening: string;
  status: string;
  remarks: string;
  updatedAt: number;
}

export interface RegisterMember {
  id: string;
  scheduleId: string;
  externalId: string;
  name: string;
  updatedAt: number;
}

export const SCHEDULE_DB_NAME = "freeSchedule";

export class ScheduleDatabase extends Dexie {
  timetables!: Table<TimeTableEntry>;
  sessions!: Table<AttendanceSession>;
  records!: Table<AttendanceRecord>;
  registerMembers!: Table<RegisterMember>;

  constructor() {
    super(SCHEDULE_DB_NAME);
    this.version(1).stores({
      timetables: "id, day, startTime, endTime, centerId",
    });
    this.version(2).stores({
      sessions: "id, date, shift, updatedAt",
      records: "id, sessionId, externalId, updatedAt",
    });
    this.version(3).stores({
      sessions: "id, date, shift, scheduleId, updatedAt",
      records: "id, sessionId, externalId, updatedAt",
      registerMembers: "id, scheduleId, externalId",
    });
    // Add 'title' to searchable fields or indices if needed,
    // but typically id and day are enough for filtering in this app.
  }
}

// Lazy singleton
let _scheduleDb: ScheduleDatabase | null = null;

export function getScheduleDb(): ScheduleDatabase {
  if (!_scheduleDb) {
    _scheduleDb = new ScheduleDatabase();
  }
  return _scheduleDb;
}

export const scheduleDb = new Proxy({} as ScheduleDatabase, {
  get(_target, prop, receiver) {
    return Reflect.get(getScheduleDb(), prop, receiver);
  },
});

export const timeTableActions = {
  save: async (entry: TimeTableEntry) => {
    return await scheduleDb.timetables.put(entry);
  },
  getAll: async () => {
    return await scheduleDb.timetables.toArray();
  },
  delete: async (id: string) => {
    return await scheduleDb.timetables.delete(id);
  },
};

export const attendanceActions = {
  saveSession: async (
    session: AttendanceSession,
    records: AttendanceRecord[],
  ) => {
    return await scheduleDb.transaction(
      "rw",
      [scheduleDb.sessions, scheduleDb.records],
      async () => {
        await scheduleDb.sessions.put(session);
        await scheduleDb.records.where("sessionId").equals(session.id).delete();
        await scheduleDb.records.bulkPut(records);
      },
    );
  },

  getSession: async (id: string) => {
    const session = await scheduleDb.sessions.get(id);
    const records = await scheduleDb.records
      .where("sessionId")
      .equals(id)
      .toArray();
    return { session, records };
  },

  getDailySession: async (
    date: number,
    shift: "morning" | "evening",
    name?: string,
    scheduleId?: string,
  ) => {
    let query = scheduleDb.sessions
      .where("date")
      .equals(date)
      .and((s) => s.shift === shift);

    if (scheduleId) {
      query = query.and((s) => s.scheduleId === scheduleId);
    } else if (name) {
      query = query.and((s) => s.name === name);
    }

    const session = await query.first();

    if (session) {
      const records = await scheduleDb.records
        .where("sessionId")
        .equals(session.id)
        .toArray();
      return { session, records };
    }
    return { session: null, records: [] };
  },

  getAllSessions: async () => {
    return await scheduleDb.sessions.orderBy("date").reverse().toArray();
  },

  deleteSession: async (id: string) => {
    return await scheduleDb.transaction(
      "rw",
      [scheduleDb.sessions, scheduleDb.records],
      async () => {
        await scheduleDb.sessions.delete(id);
        await scheduleDb.records.where("sessionId").equals(id).delete();
      },
    );
  },

  clearSessionRecords: async (sessionId: string) => {
    return await scheduleDb.records
      .where("sessionId")
      .equals(sessionId)
      .delete();
  },

  /**
   * Find the most recent session with the given register name
   * and return its roster (records). Used to pre-populate a new
   * daily session with the persistent names linked to a register.
   */
  getLatestRosterByName: async (registerName: string) => {
    if (!registerName) return [];

    const sessions = await scheduleDb.sessions
      .orderBy("date")
      .reverse()
      .filter((s) => s.name === registerName)
      .limit(1)
      .toArray();

    if (sessions.length === 0) return [];

    const records = await scheduleDb.records
      .where("sessionId")
      .equals(sessions[0].id)
      .toArray();

    return records;
  },

  // Permanent Roster Management
  saveRegisterMembers: async (
    scheduleId: string,
    members: RegisterMember[],
  ) => {
    return await scheduleDb.transaction(
      "rw",
      scheduleDb.registerMembers,
      async () => {
        // Clear old and replace to keep it perfectly synced with the latest edits
        await scheduleDb.registerMembers
          .where("scheduleId")
          .equals(scheduleId)
          .delete();
        await scheduleDb.registerMembers.bulkPut(members);
      },
    );
  },

  getRegisterMembers: async (scheduleId: string) => {
    if (!scheduleId) return [];
    return await scheduleDb.registerMembers
      .where("scheduleId")
      .equals(scheduleId)
      .toArray();
  },

  /**
   * Get the full attendance history for one member inside a specific register.
   * Returns sessions ordered newest-first, each with the person's record (or null).
   */
  getMemberHistory: async (
    scheduleId: string,
    memberName: string,
    externalId?: string,
  ): Promise<
    { session: AttendanceSession; record: AttendanceRecord | null }[]
  > => {
    if (!scheduleId) return [];

    // All saved sessions for this register
    const sessions = await scheduleDb.sessions
      .where("scheduleId")
      .equals(scheduleId)
      .sortBy("date");

    const results: {
      session: AttendanceSession;
      record: AttendanceRecord | null;
    }[] = [];

    for (const session of sessions) {
      // Find the matching record by externalId first, fall back to name
      let record: AttendanceRecord | null = null;
      if (externalId) {
        record =
          (await scheduleDb.records
            .where("sessionId")
            .equals(session.id)
            .and((r) => r.externalId === externalId)
            .first()) ?? null;
      }
      if (!record) {
        record =
          (await scheduleDb.records
            .where("sessionId")
            .equals(session.id)
            .and((r) => r.name === memberName)
            .first()) ?? null;
      }
      results.push({ session, record });
    }

    // newest first
    return results.reverse();
  },

  /**
   * Fetch monthly attendance data for a register.
   * @param monthIndex - 1-based month number (1=Jan … 12=Dec). Locale-independent.
   * @param year - 4-digit year string e.g. "2026"
   */
  getMonthlyData: async (
    scheduleId: string,
    monthIndex: number,
    year: string,
  ) => {
    if (!scheduleId) return { members: [], sessions: [], recordsBySession: {} };

    const yearNum = parseInt(year);

    // 1. Get all permanent members for this register
    const members = await scheduleDb.registerMembers
      .where("scheduleId")
      .equals(scheduleId)
      .toArray();

    // 2. Get all sessions for this register in this month/year.
    //    Filter by date timestamp — locale-independent, works even if the
    //    stored `session.month` string is in a different language.
    const sessions = await scheduleDb.sessions
      .where("scheduleId")
      .equals(scheduleId)
      .filter((s) => {
        const d = new Date(s.date);
        return d.getMonth() + 1 === monthIndex && d.getFullYear() === yearNum;
      })
      .sortBy("date");

    const sessionIds = sessions.map((s) => s.id);

    // 3. Get all records for these sessions
    const records = await scheduleDb.records
      .where("sessionId")
      .anyOf(sessionIds)
      .toArray();

    // Group records by sessionId for easy lookup
    const recordsBySession: Record<string, AttendanceRecord[]> = {};
    records.forEach((r) => {
      if (!recordsBySession[r.sessionId]) recordsBySession[r.sessionId] = [];
      recordsBySession[r.sessionId].push(r);
    });

    // 4. If no permanent members, aggregate from records
    let finalMembers = members;
    if (members.length === 0 && records.length > 0) {
      const uniqueNames = Array.from(new Set(records.map((r) => r.name)));
      finalMembers = uniqueNames.map((name) => ({
        id: `temp-${name}`,
        scheduleId: scheduleId,
        externalId: records.find((r) => r.name === name)?.externalId || "",
        name: name,
        updatedAt: Date.now(),
      }));
    }

    return { members: finalMembers, sessions, recordsBySession };
  },
};
