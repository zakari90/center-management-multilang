export interface WeeklyScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

export interface Teacher {
  id: string
  name: string
  email?: string
  phone?: string
  weeklySchedule?: WeeklyScheduleSlot[] | string
}

export interface Schedule {
  id: string
  day: string
  startTime: string
  endTime: string
  roomId: string
  teacher: { 
    id: string
    name: string
    email?: string
    weeklySchedule?: WeeklyScheduleSlot[] | string
  }
  subject: { id: string; name: string; grade: string }
  teacherId: string
  subjectId: string
}

export interface TeacherWithSchedule extends Teacher {
  weeklySchedule: WeeklyScheduleSlot[]
  schedules: Schedule[]
  totalHours: number
  subjectsCount: number
  availableHours: number
  utilizationRate: number
  conflicts: Schedule[]
}
