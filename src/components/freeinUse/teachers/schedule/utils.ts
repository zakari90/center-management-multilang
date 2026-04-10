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
  // Defensive check for undefined or invalid time values
  if (!startTime || !endTime || typeof startTime !== 'string' || typeof endTime !== 'string') {
    return 0
  }
  const startParts = startTime.split(':')
  const endParts = endTime.split(':')
  if (startParts.length < 2 || endParts.length < 2) {
    return 0
  }
  const [startHour, startMin] = startParts.map(Number)
  const [endHour, endMin] = endParts.map(Number)
  if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
    return 0
  }
  return (endHour * 60 + endMin - startHour * 60 - startMin) / 60
}

export const isWithinAvailability = (schedule: Schedule, availability: WeeklyScheduleSlot[]): boolean => {
  // Defensive check for missing schedule times
  if (!schedule?.startTime || !schedule?.endTime) return false
  const availableSlot = availability.find(slot => slot.day === schedule.day)
  if (!availableSlot || !availableSlot.startTime || !availableSlot.endTime) return false

  return schedule.startTime >= availableSlot.startTime && 
         schedule.endTime <= availableSlot.endTime
}

export const timeToPosition = (time: string): number => {
  // Defensive check for undefined or invalid time values
  if (!time || typeof time !== 'string') {
    return 0
  }
  const parts = time.split(':')
  if (parts.length < 2) {
    return 0
  }
  const [hours, minutes] = parts.map(Number)
  if (isNaN(hours) || isNaN(minutes)) {
    return 0
  }
  const totalMinutes = hours * 60 + minutes
  const dayStart = 360
  const dayEnd = 1200
  const position = ((totalMinutes - dayStart) / (dayEnd - dayStart)) * 100
  return Math.max(0, Math.min(100, position))
}
