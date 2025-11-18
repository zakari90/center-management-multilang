'use client'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
// import axios from 'axios' // ✅ Commented out - using local DB instead
import { teacherActions, scheduleActions, subjectActions, centerActions } from '@/lib/dexie/dexieActions'
import { useAuth } from '@/context/authContext'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Loader2, 
  Clock, 
  MapPin, 
  BookOpen, 
  User,
  Calendar,
  Download,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import ExcelJS from 'exceljs'

// ==================== TYPES & INTERFACES ====================

interface WeeklyScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

interface Teacher {
  id: string
  name: string
  email?: string
  phone?: string
  weeklySchedule?: WeeklyScheduleSlot[] | string
}

interface Schedule {
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

interface TeacherWithSchedule extends Teacher {
  weeklySchedule: WeeklyScheduleSlot[]
  schedules: Schedule[]
  totalHours: number
  subjectsCount: number
  availableHours: number
  utilizationRate: number
  conflicts: Schedule[]
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// ==================== HELPER FUNCTIONS ====================

const parseWeeklySchedule = (schedule: WeeklyScheduleSlot[] | string | Record<string, unknown> | undefined): WeeklyScheduleSlot[] => {
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

const calculateHoursDifference = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  return (endHour * 60 + endMin - startHour * 60 - startMin) / 60
}

const isWithinAvailability = (schedule: Schedule, availability: WeeklyScheduleSlot[]): boolean => {
  const availableSlot = availability.find(slot => slot.day === schedule.day)
  if (!availableSlot) return false

  return schedule.startTime >= availableSlot.startTime && 
         schedule.endTime <= availableSlot.endTime
}

const timeToPosition = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes
  const dayStart = 360
  const dayEnd = 1200
  const position = ((totalMinutes - dayStart) / (dayEnd - dayStart)) * 100
  return Math.max(0, Math.min(100, position))
}

// Export functions with translations
const exportTeacherSchedule = (teacher: TeacherWithSchedule, t: ReturnType<typeof useTranslations<'TeacherScheduleView'>>) => {
  let text = `${t('title')} - ${teacher.name}\n`
  text += `${'='.repeat(50)}\n\n`
  text += `Email: ${teacher.email || 'N/A'}\n`
  text += `${t('phone')}: ${teacher.phone || 'N/A'}\n`
  text += `${t('available')} ${t('hours')}/Week: ${teacher.availableHours.toFixed(1)}${t('hours')}\n`
  text += `${t('scheduled')} ${t('hours')}/Week: ${teacher.totalHours.toFixed(1)}${t('hours')}\n`
  text += `${t('utilization')}: ${teacher.utilizationRate}%\n\n`

  text += `${t('availableHours').toUpperCase()}:\n`
  text += `${'-'.repeat(50)}\n`
  if (teacher.weeklySchedule.length > 0) {
    teacher.weeklySchedule.forEach(slot => {
      text += `  ${slot.day.padEnd(12)} ${slot.startTime} - ${slot.endTime}\n`
    })
  } else {
    text += `  ${t('noAvailability')}\n`
  }
  text += '\n'

  if (teacher.conflicts.length > 0) {
    text += `⚠️  ${t('conflictsAlert').toUpperCase()} (${teacher.conflicts.length}):\n`
    text += `${'-'.repeat(50)}\n`
    teacher.conflicts.forEach(conflict => {
      const availability = teacher.weeklySchedule.find(s => s.day === conflict.day)
      text += `  ⚠️  ${conflict.day} ${conflict.startTime}-${conflict.endTime}: ${conflict.subject.name} (${conflict.subject.grade})\n`
      if (availability) {
        text += `      ${t('available')}: ${availability.startTime}-${availability.endTime}\n`
      } else {
        text += `      ${t('notAvailableOn')} ${conflict.day}\n`
      }
    })
    text += '\n'
  }

  text += `${t('classes').toUpperCase()}:\n`
  text += `${'-'.repeat(50)}\n`
  const schedulesByDay = teacher.schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day]) acc[schedule.day] = []
    acc[schedule.day].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  DAYS.forEach(day => {
    const daySchedules = schedulesByDay[day] || []
    if (daySchedules.length > 0) {
      text += `\n${day}:\n`
      daySchedules
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .forEach(schedule => {
          const withinAvailability = isWithinAvailability(schedule, teacher.weeklySchedule)
          const status = withinAvailability ? '✓' : '⚠'
          text += `  ${status} ${schedule.startTime}-${schedule.endTime}: ${schedule.subject.name} (${schedule.subject.grade}) - ${t('room')}: ${schedule.roomId}\n`
        })
    }
  })

  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${teacher.name.replace(/\s+/g, '_')}_schedule.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const exportTeacherScheduleToExcel = async (teacher: TeacherWithSchedule, t: ReturnType<typeof useTranslations<'TeacherScheduleView'>>) => {
  const workbook = new ExcelJS.Workbook()

  // ==================== Sheet 1: Teacher Info ====================
  const infoSheet = workbook.addWorksheet('Teacher Info')
  
  infoSheet.columns = [
    { header: 'Field', key: 'field', width: 25 },
    { header: 'Value', key: 'value', width: 30 }
  ]

  // Add header style
  infoSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  infoSheet.getRow(1).fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FF4472C4' } }

  const infoData = [
    { field: t('title'), value: teacher.name },
    { field: 'Email', value: teacher.email || 'N/A' },
    { field: t('phone'), value: teacher.phone || 'N/A' },
    { field: '', value: '' },
    { field: 'Statistics', value: '' },
    { field: `${t('available')} ${t('hours')}/Week`, value: `${teacher.availableHours.toFixed(1)} ${t('hours')}` },
    { field: `${t('scheduled')} ${t('hours')}/Week`, value: `${teacher.totalHours.toFixed(1)} ${t('hours')}` },
    { field: t('utilization'), value: `${teacher.utilizationRate}%` },
    { field: t('classes'), value: teacher.schedules.length },
    { field: t('subjects'), value: teacher.subjectsCount },
    { field: t('conflict'), value: teacher.conflicts.length },
  ]

  infoSheet.addRows(infoData)

  // ==================== Sheet 2: Availability ====================
  const availabilitySheet = workbook.addWorksheet(t('availableHours'))
  
  availabilitySheet.columns = [
    { header: 'Day', key: 'day', width: 15 },
    { header: 'Start Time', key: 'startTime', width: 12 },
    { header: 'End Time', key: 'endTime', width: 12 },
    { header: `Duration (${t('hours')})`, key: 'duration', width: 15 }
  ]

  availabilitySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  availabilitySheet.getRow(1).fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FF4472C4' } }

  const availabilityData = teacher.weeklySchedule.map(slot => ({
    day: slot.day,
    startTime: slot.startTime,
    endTime: slot.endTime,
    duration: calculateHoursDifference(slot.startTime, slot.endTime).toFixed(1)
  }))

  availabilitySheet.addRows(availabilityData)

  // Add total row
  availabilitySheet.addRow({})
  const totalRow = availabilitySheet.addRow({
    day: `Total ${t('available')} ${t('hours')}:`,
    duration: teacher.availableHours.toFixed(1)
  })
  totalRow.font = { bold: true }
  totalRow.fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }

  // ==================== Sheet 3: Scheduled Classes ====================
  const schedulesSheet = workbook.addWorksheet(t('classes'))
  
  schedulesSheet.columns = [
    { header: 'Day', key: 'day', width: 12 },
    { header: 'Start Time', key: 'startTime', width: 12 },
    { header: 'End Time', key: 'endTime', width: 12 },
    { header: 'Subject', key: 'subject', width: 20 },
    { header: 'Grade', key: 'grade', width: 10 },
    { header: t('room'), key: 'room', width: 12 },
    { header: `Duration (${t('hours')})`, key: 'duration', width: 12 },
    { header: 'Status', key: 'status', width: 12 }
  ]

  schedulesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  schedulesSheet.getRow(1).fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FF4472C4' } }

  const sortedSchedules = [...teacher.schedules].sort((a, b) => {
    const dayCompare = DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
    if (dayCompare !== 0) return dayCompare
    return a.startTime.localeCompare(b.startTime)
  })

  const schedulesData = sortedSchedules.map(schedule => {
    const duration = calculateHoursDifference(schedule.startTime, schedule.endTime)
    const withinAvailability = isWithinAvailability(schedule, teacher.weeklySchedule)
    const status = withinAvailability ? '✓ OK' : `⚠ ${t('conflict')}`

    return {
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      subject: schedule.subject.name,
      grade: schedule.subject.grade,
      room: schedule.roomId,
      duration: duration.toFixed(1),
      status
    }
  })

  schedulesSheet.addRows(schedulesData)

  // Add total row
  schedulesSheet.addRow({})
  const schedulesTotalRow = schedulesSheet.addRow({
    day: `Total ${t('scheduled')} ${t('hours')}:`,
    duration: teacher.totalHours.toFixed(1)
  })
  schedulesTotalRow.font = { bold: true }
  schedulesTotalRow.fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }

  // Color code status column
  schedulesSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const statusCell = row.getCell('status')
      if (statusCell.value?.toString().includes('OK')) {
        statusCell.fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }
        statusCell.font = { color: { argb: 'FF006100' } }
      } else if (statusCell.value?.toString().includes('⚠')) {
        statusCell.fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
        statusCell.font = { color: { argb: 'FF9C6500' } }
      }
    }
  })

  // ==================== Sheet 4: Conflicts ====================
  if (teacher.conflicts.length > 0) {
    const conflictsSheet = workbook.addWorksheet(t('conflict'))
    
    conflictsSheet.columns = [
      { header: 'Day', key: 'day', width: 12 },
      { header: 'Scheduled Time', key: 'scheduledTime', width: 18 },
      { header: 'Subject', key: 'subject', width: 20 },
      { header: 'Grade', key: 'grade', width: 10 },
      { header: t('room'), key: 'room', width: 12 },
      { header: `${t('available')} Time`, key: 'availableTime', width: 18 },
      { header: 'Issue', key: 'issue', width: 40 }
    ]

    conflictsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    conflictsSheet.getRow(1).fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FFC00000' } }

    const conflictsData = teacher.conflicts.map(conflict => {
      const availability = teacher.weeklySchedule.find(s => s.day === conflict.day)
      const issue = availability 
        ? `${t('outsideAvailableHours')} (${availability.startTime}-${availability.endTime})`
        : `${t('notAvailableOn')} ${conflict.day}`

      return {
        day: conflict.day,
        scheduledTime: `${conflict.startTime} - ${conflict.endTime}`,
        subject: conflict.subject.name,
        grade: conflict.subject.grade,
        room: conflict.roomId,
        availableTime: availability ? `${availability.startTime} - ${availability.endTime}` : 'N/A',
        issue
      }
    })

    conflictsSheet.addRows(conflictsData)

    // Highlight conflict rows
    conflictsSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } }
      }
    })
  }

  // ==================== Sheet 5: Weekly Overview ====================
  const weeklySheet = workbook.addWorksheet(t('weeklyTimeline'))
  
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ]

  weeklySheet.columns = [
    { header: 'Time', key: 'time', width: 8 },
    ...DAYS.map(day => ({ header: day, key: day, width: 18 }))
  ]

  weeklySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  weeklySheet.getRow(1).fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FF4472C4' } }

  timeSlots.forEach(time => {
    const row: Record<string, string> = { time }
    
    DAYS.forEach(day => {
      const schedule = teacher.schedules.find(
        s => s.day === day && s.startTime <= time && s.endTime > time
      )
      
      if (schedule) {
        row[day] = `${schedule.subject.name} (${schedule.roomId})`
      } else {
        const isAvailable = teacher.weeklySchedule.some(
          slot => slot.day === day && slot.startTime <= time && slot.endTime > time
        )
        row[day] = isAvailable ? t('available') : '-'
      }
    })
    
    weeklySheet.addRow(row)
  })

  // Color code weekly overview
  weeklySheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      DAYS.forEach(day => {
        const cell = row.getCell(day)
        if (cell.value === t('available')) {
          cell.fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }
        } else if (cell.value && cell.value !== '-') {
          cell.fill = { type: 'pattern' as const, pattern: 'solid', fgColor: { argb: 'FFDFE9F3' } }
        }
      })
    }
  })

  // Save file
  const fileName = `${teacher.name.replace(/\s+/g, '_')}_schedule_${new Date().toISOString().split('T')[0]}.xlsx`
  await workbook.xlsx.writeFile(fileName)
}

// ==================== MAIN COMPONENT ====================

export default function TeacherScheduleView() {
  const t = useTranslations('TeacherScheduleView')
  const { user } = useAuth()
  
  const [teachers, setTeachers] = useState<TeacherWithSchedule[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid')

  const fetchTeacherSchedules = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      if (!user) {
        setIsLoading(false)
        return
      }

      const isAdmin = user.role?.toUpperCase() === 'ADMIN'

      // ✅ Fetch from local DB (all entities in parallel)
      const [allTeachers, allSchedules, allSubjects, allCenters] = await Promise.all([
        teacherActions.getAll(),
        scheduleActions.getAll(),
        subjectActions.getAll(),
        centerActions.getAll()
      ])

      // ✅ Filter active entities (exclude deleted)
      let activeTeachers = allTeachers.filter(t => t.status !== '0')
      
      // ✅ For admin, filter teachers by their center's managers
      if (isAdmin && user.id) {
        const adminCenters = allCenters.filter(c => 
          c.adminId === user.id && c.status !== '0'
        )
        const adminManagerIds = adminCenters.flatMap(c => c.managers || [])
        activeTeachers = activeTeachers.filter(t => 
          adminManagerIds.includes(t.managerId)
        )
      } else if (user.id) {
        // For manager, filter by managerId
        activeTeachers = activeTeachers.filter(t => t.managerId === user.id)
      }
      
      const activeSchedules = allSchedules.filter(s => s.status !== '0')
      const activeSubjects = allSubjects.filter(s => s.status !== '0')
      
      console.log("🔍 TeacherScheduleView Debug:", {
        isAdmin,
        userId: user.id,
        totalTeachers: allTeachers.length,
        activeTeachers: activeTeachers.length,
        adminCenters: isAdmin ? allCenters.filter(c => c.adminId === user.id && c.status !== '0').map(c => ({ id: c.id, name: c.name, managers: c.managers })) : [],
        teachers: activeTeachers.map(t => ({ id: t.id, name: t.name, managerId: t.managerId }))
      })

      // ✅ Build schedules with related data (teacher and subject)
      const schedulesWithData: Schedule[] = activeSchedules.map(schedule => {
        const teacher = activeTeachers.find(t => t.id === schedule.teacherId)
        const subject = activeSubjects.find(s => s.id === schedule.subjectId)

        // ✅ Convert weeklySchedule to proper type
        const teacherWeeklySchedule = teacher?.weeklySchedule
          ? (typeof teacher.weeklySchedule === 'string' 
              ? teacher.weeklySchedule 
              : Array.isArray(teacher.weeklySchedule)
              ? teacher.weeklySchedule as WeeklyScheduleSlot[]
              : undefined)
          : undefined

        return {
          id: schedule.id,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          roomId: schedule.roomId,
          teacherId: schedule.teacherId,
          subjectId: schedule.subjectId,
          teacher: teacher ? {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            weeklySchedule: teacherWeeklySchedule
          } : {
            id: schedule.teacherId,
            name: 'Unknown Teacher',
            weeklySchedule: undefined
          },
          subject: subject ? {
            id: subject.id,
            name: subject.name,
            grade: subject.grade
          } : {
            id: schedule.subjectId,
            name: 'Unknown Subject',
            grade: 'N/A'
          }
        }
      })

      // ✅ Build teachers data (matching API structure)
      const teachersData: Teacher[] = activeTeachers.map(teacher => {
        // ✅ Convert weeklySchedule to proper type
        const weeklySchedule = teacher.weeklySchedule
          ? (typeof teacher.weeklySchedule === 'string'
              ? teacher.weeklySchedule
              : Array.isArray(teacher.weeklySchedule)
              ? teacher.weeklySchedule as WeeklyScheduleSlot[]
              : undefined)
          : undefined

        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          weeklySchedule
        }
      })

      // ✅ Build teachers with schedules and calculations
      const teachersWithSchedules: TeacherWithSchedule[] = teachersData.map((teacher) => {
        const teacherSchedules = schedulesWithData.filter(
          (s) => s.teacherId === teacher.id
        )

        const weeklySchedule = parseWeeklySchedule(teacher.weeklySchedule)

        const availableHours = weeklySchedule.reduce((acc, slot) => {
          return acc + calculateHoursDifference(slot.startTime, slot.endTime)
        }, 0)

        const totalHours = teacherSchedules.reduce((acc, schedule) => {
          return acc + calculateHoursDifference(schedule.startTime, schedule.endTime)
        }, 0)

        const utilizationRate = availableHours > 0 
          ? Math.round((totalHours / availableHours) * 100) 
          : 0

        const uniqueSubjects = new Set(teacherSchedules.map((s) => s.subjectId))

        const conflicts = teacherSchedules.filter(
          schedule => !isWithinAvailability(schedule, weeklySchedule)
        )

        return {
          ...teacher,
          weeklySchedule,
          schedules: teacherSchedules,
          totalHours,
          availableHours,
          utilizationRate,
          subjectsCount: uniqueSubjects.size,
          conflicts
        }
      })

      setTeachers(teachersWithSchedules)
      
      if (teachersWithSchedules.length > 0) {
        setSelectedTeacherId(teachersWithSchedules[0].id)
      }

      // ✅ Commented out API calls
      // const [teachersRes, schedulesRes] = await Promise.all([
      //   axios.get('/api/admin/teachers'),
      //   axios.get(`/api/admin/schedule`)
      // ])
      // const teachersData: Teacher[] = teachersRes.data
      // const schedulesData: Schedule[] = schedulesRes.data
    } catch (err) {
      console.error('Failed to fetch teacher schedules from local DB:', err)
      setError(t('errorLoadSchedules'))
    } finally {
      setIsLoading(false)
    }
  }, [t, user])

  useEffect(() => {
    fetchTeacherSchedules()
  }, [fetchTeacherSchedules])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(value: 'grid' | 'list' | 'timeline') => setViewMode(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">{t('gridView')}</SelectItem>
              <SelectItem value="list">{t('listView')}</SelectItem>
              <SelectItem value="timeline">{t('timeline')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {teachers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noTeachersFound')}</h3>
            <p className="text-muted-foreground">{t('noTeachersDescription')}</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
          <div className="border rounded-lg p-2 bg-muted/30 overflow-x-auto">
            <TabsList className="w-full justify-start flex-nowrap h-auto gap-2">
              {teachers.map(teacher => (
                <TabsTrigger 
                  key={teacher.id} 
                  value={teacher.id}
                  className="flex flex-col items-start px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{teacher.name}</span>
                    {teacher.conflicts.length > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                        {teacher.conflicts.length}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs opacity-80">
                    {teacher.totalHours.toFixed(1)}{t('hours')}/{teacher.availableHours.toFixed(1)}{t('hours')} • {teacher.utilizationRate}%
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {teachers.map(teacher => (
            <TabsContent key={teacher.id} value={teacher.id} className="space-y-4 mt-4">
              <TeacherInfoCard teacher={teacher} />
              <AvailabilityCard teacher={teacher} />
              
              {viewMode === 'grid' && <GridScheduleView teacher={teacher} />}
              {viewMode === 'list' && <ListScheduleView teacher={teacher} />}
              {viewMode === 'timeline' && <TimelineScheduleView teacher={teacher} />}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

// ==================== TEACHER INFO CARD ====================

function TeacherInfoCard({ teacher }: { teacher: TeacherWithSchedule }) {
  const t = useTranslations('TeacherScheduleView')
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {teacher.name}
            </CardTitle>
            <CardDescription className="mt-2 space-y-1">
              {teacher.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>{teacher.email}</span>
                </div>
              )}
              {teacher.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{teacher.phone}</span>
                </div>
              )}
            </CardDescription>
          </div>
          <ExportButton teacher={teacher} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {teacher.availableHours.toFixed(1)}{t('hours')}
            </div>
            <div className="text-xs text-muted-foreground">{t('available')}</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {teacher.totalHours.toFixed(1)}{t('hours')}
            </div>
            <div className="text-xs text-muted-foreground">{t('scheduled')}</div>
          </div>
          <div className={cn(
            "text-center p-4 rounded-lg",
            teacher.utilizationRate >= 80 ? "bg-red-50" : 
            teacher.utilizationRate >= 60 ? "bg-yellow-50" : "bg-green-50"
          )}>
            <div className={cn(
              "text-2xl font-bold",
              teacher.utilizationRate >= 80 ? "text-red-600" : 
              teacher.utilizationRate >= 60 ? "text-yellow-600" : "text-green-600"
            )}>
              {teacher.utilizationRate}%
              </div>
            <div className="text-xs text-muted-foreground">{t('utilization')}</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {teacher.schedules.length}
            </div>
            <div className="text-xs text-muted-foreground">{t('classes')}</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {teacher.subjectsCount}
            </div>
            <div className="text-xs text-muted-foreground">{t('subjects')}</div>
          </div>
        </div>

        {teacher.conflicts.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">
                {teacher.conflicts.length} {t('conflictsAlert')}
              </div>
              <ul className="space-y-2 text-sm">
                {teacher.conflicts.map(conflict => {
                  const availability = teacher.weeklySchedule.find(
                    slot => slot.day === conflict.day
                  )
                  return (
                    <li key={conflict.id} className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <div>
                        <div>
                          <span className="font-medium">{conflict.day}</span>
                          {' '}{conflict.startTime}-{conflict.endTime}
                          {' - '}{conflict.subject.name} ({conflict.subject.grade})
                          {' - '}{t('room')}: {conflict.roomId}
                        </div>
                        {availability ? (
                          <span className="text-xs block text-muted-foreground mt-0.5">
                            ✓ {t('available')}: {availability.startTime}-{availability.endTime}
                          </span>
                        ) : (
                          <span className="text-xs block text-muted-foreground mt-0.5">
                            ✗ {t('notAvailableOn')} {conflict.day}
                          </span>
                          )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== AVAILABILITY CARD ====================

function AvailabilityCard({ teacher }: { teacher: TeacherWithSchedule }) {
  const t = useTranslations('TeacherScheduleView')
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          {t('availableHours')}
        </CardTitle>
        <CardDescription>
          {t('availableHoursDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {teacher.weeklySchedule.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {teacher.weeklySchedule.map((slot, idx) => (
              <div key={idx} className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="font-semibold text-sm text-primary">{slot.day}</div>
                <div className="text-sm text-primary/80 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {slot.startTime} - {slot.endTime}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('noAvailability')}</p>
            <p className="text-xs mt-1">{t('noAvailabilityDescription')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== GRID SCHEDULE VIEW ====================

function GridScheduleView({ teacher }: { teacher: TeacherWithSchedule }) {
  const t = useTranslations('TeacherScheduleView')
  
  const schedulesByDay = teacher.schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day]) acc[schedule.day] = []
    acc[schedule.day].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  const availabilityByDay = teacher.weeklySchedule.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = []
    acc[slot.day].push(slot)
    return acc
  }, {} as Record<string, WeeklyScheduleSlot[]>)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {DAYS.map(day => {
        const daySchedules = (schedulesByDay[day] || []).sort((a, b) => 
          a.startTime.localeCompare(b.startTime)
        )
        const dayAvailability = availabilityByDay[day] || []
        
        const hasContent = daySchedules.length > 0 || dayAvailability.length > 0

        if (!hasContent) return null

        return (
          <Card key={day}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {day}
                </div>
                {daySchedules.length > 0 && (
                  <Badge variant="secondary">
                    {daySchedules.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {daySchedules.length > 0 ? (
                <div className="space-y-2">
                  {daySchedules.map(schedule => {
                    const withinAvailability = isWithinAvailability(schedule, teacher.weeklySchedule)
                    
                    return (
                      <div
                        key={schedule.id}
                        className={cn(
                          "p-3 rounded-md border space-y-2 transition-colors",
                          withinAvailability 
                            ? "bg-green-50 border-green-200 hover:bg-green-100" 
                            : "bg-red-50 border-red-200 hover:bg-red-100"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="h-3 w-3" />
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                          {withinAvailability ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-3 w-3" />
                          <span className="font-medium">{schedule.subject.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {schedule.subject.grade}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{schedule.roomId}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : dayAvailability.length > 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  {t('availableButNoClasses')}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ==================== LIST SCHEDULE VIEW ====================

function ListScheduleView({ teacher }: { teacher: TeacherWithSchedule }) {
  const t = useTranslations('TeacherScheduleView')
  
  const schedulesByDay = teacher.schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day]) acc[schedule.day] = []
    acc[schedule.day].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  return (
    <div className="space-y-4">
      {DAYS.map(day => {
        const daySchedules = (schedulesByDay[day] || []).sort((a, b) => 
          a.startTime.localeCompare(b.startTime)
        )

        if (daySchedules.length === 0) return null

        const dayAvailability = teacher.weeklySchedule.find(s => s.day === day)

        return (
          <Card key={day}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {day}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {dayAvailability && (
                    <Badge variant="outline" className="text-xs">
                      {t('available')}: {dayAvailability.startTime}-{dayAvailability.endTime}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {daySchedules.length} {daySchedules.length === 1 ? t('class') : t('classesPlural')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {daySchedules.map(schedule => {
                  const withinAvailability = isWithinAvailability(schedule, teacher.weeklySchedule)
                  
                  return (
                    <div
                      key={schedule.id}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-lg transition-colors",
                        withinAvailability 
                          ? "hover:bg-secondary/10 border-secondary/20" 
                          : "hover:bg-destructive/10 border-destructive/20 bg-destructive/10"
                      )}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-1">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{schedule.subject.name}</span>
                          <Badge variant="outline">{schedule.subject.grade}</Badge>
                        </div>

                        <div className="flex items-center gap-2 min-w-[120px]">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{schedule.roomId}</span>
                        </div>
                      </div>

                      <div>
                        {withinAvailability ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {teacher.schedules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noClassesScheduled')}</h3>
            <p className="text-muted-foreground">{t('noClassesDescription')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==================== TIMELINE SCHEDULE VIEW ====================

function TimelineScheduleView({ teacher }: { teacher: TeacherWithSchedule }) {
  const t = useTranslations('TeacherScheduleView')
  
  const schedulesByDay = teacher.schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day]) acc[schedule.day] = []
    acc[schedule.day].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  const availabilityByDay = teacher.weeklySchedule.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = []
    acc[slot.day].push(slot)
    return acc
  }, {} as Record<string, WeeklyScheduleSlot[]>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('weeklyTimeline')}</CardTitle>
        <CardDescription>{t('weeklyTimelineDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 overflow-x-auto">
        {DAYS.map(day => {
          const availability = availabilityByDay[day] || []
          const schedules = schedulesByDay[day] || []
          
          const hasContent = availability.length > 0 || schedules.length > 0
          if (!hasContent) return null

          return (
            <div key={day} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {day}
                </div>
                {schedules.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {schedules.length} {schedules.length === 1 ? t('class') : t('classesPlural')}
                  </Badge>
                )}
              </div>
              
              <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden border">
                {availability.map((slot, idx) => {
                  const start = timeToPosition(slot.startTime)
                  const width = timeToPosition(slot.endTime) - start
                  
                  return (
                    <div
                      key={`avail-${idx}`}
                      className="absolute h-full bg-green-200/50 border-l-2 border-r-2 border-green-400"
                      style={{ left: `${start}%`, width: `${width}%` }}
                      title={`${t('available')}: ${slot.startTime} - ${slot.endTime}`}
                    >
                      <div className="text-xs p-1 text-green-800 font-medium truncate">
                        {t('available')}
                      </div>
                    </div>
                  )
                })}
                
                {schedules.map((schedule, idx) => {
                  const start = timeToPosition(schedule.startTime)
                  const width = timeToPosition(schedule.endTime) - start
                  const isConflict = !isWithinAvailability(schedule, availability)
                  
                  const topOffset = (idx % 2) * 6 + 2
                  
                  return (
                    <div
                      key={schedule.id}
                      className={cn(
                        "absolute h-10 rounded border-2 shadow-sm transition-all hover:shadow-md cursor-pointer",
                        isConflict 
                          ? "bg-red-500 border-red-700 hover:bg-red-600" 
                          : "bg-blue-500 border-blue-700 hover:bg-blue-600"
                      )}
                      style={{ 
                        left: `${start}%`, 
                        width: `${Math.max(width, 5)}%`,
                        top: `${topOffset}px`
                      }}
                      title={`${schedule.subject.name} (${schedule.subject.grade})\n${schedule.startTime} - ${schedule.endTime}\n${t('room')}: ${schedule.roomId}${isConflict ? `\n⚠️ ${t('outsideAvailableHours')}` : ''}`}
                    >
                      <div className="text-xs p-1 text-white font-medium truncate flex items-center gap-1">
                        {isConflict && <AlertCircle className="h-3 w-3 flex-shrink-0" />}
                        <span className="truncate">{schedule.subject.name}</span>
                      </div>
                    </div>
                  )
                })}

                {availability.length > 0 && (
                  <>
                    {availability[0] && timeToPosition(availability[0].startTime) > 0 && (
                      <div
                        className="absolute h-full bg-gray-300/40 pointer-events-none"
                        style={{ 
                          left: 0, 
                          width: `${timeToPosition(availability[0].startTime)}%` 
                        }}
                      />
                    )}
                    {availability[availability.length - 1] && 
                     timeToPosition(availability[availability.length - 1].endTime) < 100 && (
                      <div
                        className="absolute h-full bg-gray-300/40 pointer-events-none"
                        style={{ 
                          left: `${timeToPosition(availability[availability.length - 1].endTime)}%`,
                          width: `${100 - timeToPosition(availability[availability.length - 1].endTime)}%`
                        }}
                      />
                    )}
                  </>
                )}
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>6 AM</span>
                <span>9 AM</span>
                <span>12 PM</span>
                <span>3 PM</span>
                <span>6 PM</span>
                <span>8 PM</span>
              </div>

              {schedules.length > 0 && (
                <div className="mt-2 space-y-1">
                  {schedules
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map(schedule => {
                      const isConflict = !isWithinAvailability(schedule, availability)
                      return (
                        <div 
                          key={schedule.id}
                          className={cn(
                            "text-xs p-2 rounded flex items-center justify-between",
                            isConflict ? "bg-red-50 text-red-900" : "bg-blue-50 text-blue-900"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isConflict ? (
                              <AlertCircle className="h-3 w-3 text-red-600" />
                            ) : (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            )}
                            <span className="font-medium">
                              {schedule.startTime}-{schedule.endTime}
                            </span>
                            <span>{schedule.subject.name}</span>
                            <Badge variant="outline" className="text-xs h-4">
                              {schedule.subject.grade}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground">{schedule.roomId}</span>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}

        <div className="border-t pt-4 mt-4">
          <div className="text-sm font-medium mb-2">{t('legend')}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-green-200/50 border border-green-400 rounded"></div>
              <span>{t('availableTime')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-blue-500 border-2 border-blue-700 rounded"></div>
              <span>{t('scheduledClass')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-red-500 border-2 border-red-700 rounded"></div>
              <span>{t('conflict')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-gray-300/40 rounded"></div>
              <span>{t('unavailable')}</span>
            </div>
          </div>
        </div>

        {teacher.schedules.length === 0 && teacher.weeklySchedule.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{t('noAvailabilityOrSchedules')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== EXPORT OPTIONS COMPONENT ====================

function ExportButton({ teacher }: { teacher: TeacherWithSchedule }) {
  const t = useTranslations('TeacherScheduleView')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Download className="h-4 w-4 mr-2" />
        {t('export')}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border z-20 overflow-hidden">
            <button
              onClick={() => {
                exportTeacherScheduleToExcel(teacher, t)
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t('exportToExcel')}
            </button>
            <button
              onClick={() => {
                exportTeacherSchedule(teacher, t)
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {t('exportToText')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}