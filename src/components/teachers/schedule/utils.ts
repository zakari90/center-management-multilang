import { WeeklyScheduleSlot, Schedule } from './types'

export const parseWeeklySchedule = (schedule: WeeklyScheduleSlot[] | string | Record<string, unknown> | undefined): WeeklyScheduleSlot[] => {
  if (!schedule) return []
  if (Array.isArray(schedule)) return schedule
  if (typeof schedule === 'string') {
    try {
      return JSON.parse(schedule)
    } catch {
      return []
    }
  }
  return []
}

export const calculateHoursDifference = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  return (endHour * 60 + endMin - startHour * 60 - startMin) / 60
}

export const isWithinAvailability = (schedule: Schedule, availability: WeeklyScheduleSlot[]): boolean => {
  const availableSlot = availability.find(slot => slot.day === schedule.day)
  if (!availableSlot) return false

  return schedule.startTime >= availableSlot.startTime && 
         schedule.endTime <= availableSlot.endTime
}

export const timeToPosition = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes
  const dayStart = 360
  const dayEnd = 1200
  const position = ((totalMinutes - dayStart) / (dayEnd - dayStart)) * 100
  return Math.max(0, Math.min(100, position))
}
