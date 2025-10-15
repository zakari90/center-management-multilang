'use client'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'
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
  weeklySchedule?: WeeklyScheduleSlot[] | string // Can be JSON string or parsed array
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

// Parse weeklySchedule from JSON if needed
const parseWeeklySchedule = (schedule: any): WeeklyScheduleSlot[] => {
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

// Calculate hours difference between two times
const calculateHoursDifference = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  return (endHour * 60 + endMin - startHour * 60 - startMin) / 60
}

// Check if a scheduled class fits within teacher's availability
const isWithinAvailability = (schedule: Schedule, availability: WeeklyScheduleSlot[]): boolean => {
  const availableSlot = availability.find(slot => slot.day === schedule.day)
  if (!availableSlot) return false

  return schedule.startTime >= availableSlot.startTime && 
         schedule.endTime <= availableSlot.endTime
}

// Convert time to position percentage for timeline view (6 AM to 8 PM range)
const timeToPosition = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes
  const dayStart = 360 // 6 AM
  const dayEnd = 1200 // 8 PM
  const position = ((totalMinutes - dayStart) / (dayEnd - dayStart)) * 100
  return Math.max(0, Math.min(100, position)) // Clamp between 0-100
}

// Export teacher schedule to text file
const exportTeacherSchedule = (teacher: TeacherWithSchedule) => {
  let text = `Schedule for ${teacher.name}\n`
  text += `${'='.repeat(50)}\n\n`
  text += `Email: ${teacher.email || 'N/A'}\n`
  text += `Phone: ${teacher.phone || 'N/A'}\n`
  text += `Available Hours/Week: ${teacher.availableHours.toFixed(1)}h\n`
  text += `Scheduled Hours/Week: ${teacher.totalHours.toFixed(1)}h\n`
  text += `Utilization: ${teacher.utilizationRate}%\n\n`

  // Availability section
  text += `AVAILABILITY:\n`
  text += `${'-'.repeat(50)}\n`
  if (teacher.weeklySchedule.length > 0) {
    teacher.weeklySchedule.forEach(slot => {
      text += `  ${slot.day.padEnd(12)} ${slot.startTime} - ${slot.endTime}\n`
    })
  } else {
    text += `  No availability set\n`
  }
  text += '\n'

  // Conflicts section
  if (teacher.conflicts.length > 0) {
    text += `⚠️  SCHEDULING CONFLICTS (${teacher.conflicts.length}):\n`
    text += `${'-'.repeat(50)}\n`
    teacher.conflicts.forEach(conflict => {
      const availability = teacher.weeklySchedule.find(s => s.day === conflict.day)
      text += `  ⚠️  ${conflict.day} ${conflict.startTime}-${conflict.endTime}: ${conflict.subject.name} (${conflict.subject.grade})\n`
      if (availability) {
        text += `      Available: ${availability.startTime}-${availability.endTime}\n`
      } else {
        text += `      Not available on ${conflict.day}\n`
      }
    })
    text += '\n'
  }

  // Scheduled classes section
  text += `SCHEDULED CLASSES:\n`
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
          text += `  ${status} ${schedule.startTime}-${schedule.endTime}: ${schedule.subject.name} (${schedule.subject.grade}) - Room: ${schedule.roomId}\n`
        })
    }
  })

  // Create and download file
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


// ==================== MAIN COMPONENT ====================

export default function TeacherScheduleView({ centerId }: { centerId?: string }) {
  const [teachers, setTeachers] = useState<TeacherWithSchedule[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid')

  useEffect(() => {
    fetchTeacherSchedules()
  }, [centerId])

  const fetchTeacherSchedules = async () => {
    try {
      const [teachersRes, schedulesRes] = await Promise.all([
        axios.get('/api/admin/teachers'),
        axios.get(`/api/admin/schedule${centerId ? `?centerId=${centerId}` : ''}`)
      ])
console.log("*****************************************1");
console.log(teachersRes.data)
console.log(schedulesRes)
console.log("*****************************************2");

      const teachersData: Teacher[] = teachersRes.data
      const schedulesData: Schedule[] = schedulesRes.data

      // Process teachers with schedules and stats
      const teachersWithSchedules: TeacherWithSchedule[] = teachersData.map((teacher) => {
        const teacherSchedules = schedulesData.filter(
          (s) => s.teacherId === teacher.id
        )

        // Parse weeklySchedule
        const weeklySchedule = parseWeeklySchedule(teacher.weeklySchedule)

        // Calculate total available hours
        const availableHours = weeklySchedule.reduce((acc, slot) => {
          return acc + calculateHoursDifference(slot.startTime, slot.endTime)
        }, 0)

        // Calculate total scheduled hours
        const totalHours = teacherSchedules.reduce((acc, schedule) => {
          return acc + calculateHoursDifference(schedule.startTime, schedule.endTime)
        }, 0)

        // Calculate utilization rate
        const utilizationRate = availableHours > 0 
          ? Math.round((totalHours / availableHours) * 100) 
          : 0

        // Count unique subjects
        const uniqueSubjects = new Set(teacherSchedules.map((s) => s.subjectId))

        // Find conflicts
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
      
      // Auto-select first teacher
      if (teachersWithSchedules.length > 0) {
        setSelectedTeacherId(teachersWithSchedules[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch teacher schedules:', err)
      setError('Failed to load teacher schedules')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Teacher Schedules</h2>
          <p className="text-muted-foreground">View availability and assigned classes</p>
        </div>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid View</SelectItem>
              <SelectItem value="list">List View</SelectItem>
              <SelectItem value="timeline">Timeline</SelectItem>
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
            <h3 className="text-lg font-semibold mb-2">No Teachers Found</h3>
            <p className="text-muted-foreground">Add teachers to start managing schedules</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
          {/* Teacher Selection Tabs */}
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
                    {teacher.totalHours.toFixed(1)}h/{teacher.availableHours.toFixed(1)}h • {teacher.utilizationRate}%
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Teacher Schedule Content */}
          {teachers.map(teacher => (
            <TabsContent key={teacher.id} value={teacher.id} className="space-y-4 mt-4">
              <TeacherInfoCard teacher={teacher} onExport={() => exportTeacherSchedule(teacher)} />
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

function TeacherInfoCard({ 
  teacher, 
  onExport 
}: { 
  teacher: TeacherWithSchedule
  onExport: () => void 
}) {
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
          {/* Replace this with the new ExportButton */}
          <ExportButton teacher={teacher} onExport={onExport} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {teacher.availableHours.toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {teacher.totalHours.toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">Scheduled</div>
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
            <div className="text-xs text-muted-foreground">Utilization</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {teacher.schedules.length}
            </div>
            <div className="text-xs text-muted-foreground">Classes</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {teacher.subjectsCount}
            </div>
            <div className="text-xs text-muted-foreground">Subjects</div>
          </div>
        </div>

        {/* Conflicts Alert */}
        {teacher.conflicts.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">
                {teacher.conflicts.length} class(es) scheduled outside available hours:
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
                          {' - Room: '}{conflict.roomId}
                        </div>
                        {availability ? (
                          <span className="text-xs block text-muted-foreground mt-0.5">
                            ✓ Available: {availability.startTime}-{availability.endTime}
                          </span>
                        ) : (
                          <span className="text-xs block text-muted-foreground mt-0.5">
                            ✗ Not available on {conflict.day}
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Available Hours
        </CardTitle>
        <CardDescription>
          When this teacher is available to teach
        </CardDescription>
      </CardHeader>
      <CardContent>
        {teacher.weeklySchedule.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {teacher.weeklySchedule.map((slot, idx) => (
              <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-semibold text-sm text-blue-900">{slot.day}</div>
                <div className="text-sm text-blue-700 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {slot.startTime} - {slot.endTime}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No availability set for this teacher</p>
            <p className="text-xs mt-1">Add available hours to prevent scheduling conflicts</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== GRID SCHEDULE VIEW ====================

function GridScheduleView({ teacher }: { teacher: TeacherWithSchedule }) {
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
              {/* Scheduled Classes */}
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
                  Available but no classes scheduled
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
                      Available: {dayAvailability.startTime}-{dayAvailability.endTime}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {daySchedules.length} {daySchedules.length === 1 ? 'class' : 'classes'}
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
                          ? "hover:bg-green-50 border-green-200" 
                          : "hover:bg-red-50 border-red-200 bg-red-50"
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
            <h3 className="text-lg font-semibold mb-2">No Classes Scheduled</h3>
            <p className="text-muted-foreground">This teacher has no scheduled classes yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==================== TIMELINE SCHEDULE VIEW ====================

function TimelineScheduleView({ teacher }: { teacher: TeacherWithSchedule }) {
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
        <CardTitle>Weekly Timeline</CardTitle>
        <CardDescription>Visual representation of availability and scheduled classes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                    {schedules.length} {schedules.length === 1 ? 'class' : 'classes'}
                  </Badge>
                )}
              </div>
              
              {/* Timeline visualization */}
              <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden border">
                {/* Availability background bars */}
                {availability.map((slot, idx) => {
                  const start = timeToPosition(slot.startTime)
                  const width = timeToPosition(slot.endTime) - start
                  
                  return (
                    <div
                      key={`avail-${idx}`}
                      className="absolute h-full bg-green-200/50 border-l-2 border-r-2 border-green-400"
                      style={{ left: `${start}%`, width: `${width}%` }}
                      title={`Available: ${slot.startTime} - ${slot.endTime}`}
                    >
                      <div className="text-xs p-1 text-green-800 font-medium truncate">
                        Available
                      </div>
                    </div>
                  )
                })}
                
                {/* Scheduled classes overlay */}
                {schedules.map((schedule, idx) => {
                  const start = timeToPosition(schedule.startTime)
                  const width = timeToPosition(schedule.endTime) - start
                  const isConflict = !isWithinAvailability(schedule, availability)
                  
                  // Stagger multiple classes at different vertical positions
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
                      title={`${schedule.subject.name} (${schedule.subject.grade})\n${schedule.startTime} - ${schedule.endTime}\nRoom: ${schedule.roomId}${isConflict ? '\n⚠️ Outside availability!' : ''}`}
                    >
                      <div className="text-xs p-1 text-white font-medium truncate flex items-center gap-1">
                        {isConflict && <AlertCircle className="h-3 w-3 flex-shrink-0" />}
                        <span className="truncate">{schedule.subject.name}</span>
                      </div>
                    </div>
                  )
                })}

                {/* Gray overlay for unavailable times */}
                {availability.length > 0 && (
                  <>
                    {/* Before first availability */}
                    {availability[0] && timeToPosition(availability[0].startTime) > 0 && (
                      <div
                        className="absolute h-full bg-gray-300/40 pointer-events-none"
                        style={{ 
                          left: 0, 
                          width: `${timeToPosition(availability[0].startTime)}%` 
                        }}
                      />
                    )}
                    {/* After last availability */}
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
              
              {/* Time labels */}
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>6 AM</span>
                <span>9 AM</span>
                <span>12 PM</span>
                <span>3 PM</span>
                <span>6 PM</span>
                <span>8 PM</span>
              </div>

              {/* Detailed schedule list for this day */}
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

        {/* Legend */}
        <div className="border-t pt-4 mt-4">
          <div className="text-sm font-medium mb-2">Legend:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-green-200/50 border border-green-400 rounded"></div>
              <span>Available Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-blue-500 border-2 border-blue-700 rounded"></div>
              <span>Scheduled Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-red-500 border-2 border-red-700 rounded"></div>
              <span>Conflict</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-gray-300/40 rounded"></div>
              <span>Unavailable</span>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {teacher.schedules.length === 0 && teacher.weeklySchedule.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No availability or schedules configured</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


import * as XLSX from 'xlsx'

// ==================== EXCEL EXPORT FUNCTION ====================

const exportTeacherScheduleToExcel = (teacher: TeacherWithSchedule) => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new()

  // ========== Sheet 1: Teacher Info ==========
  const infoData = [
    ['Teacher Schedule Report'],
    [''],
    ['Teacher Name:', teacher.name],
    ['Email:', teacher.email || 'N/A'],
    ['Phone:', teacher.phone || 'N/A'],
    [''],
    ['Statistics'],
    ['Available Hours/Week:', `${teacher.availableHours.toFixed(1)}h`],
    ['Scheduled Hours/Week:', `${teacher.totalHours.toFixed(1)}h`],
    ['Utilization Rate:', `${teacher.utilizationRate}%`],
    ['Total Classes:', teacher.schedules.length],
    ['Subjects Teaching:', teacher.subjectsCount],
    ['Scheduling Conflicts:', teacher.conflicts.length],
  ]

  const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
  
  // Style the header
  infoSheet['!cols'] = [{ wch: 25 }, { wch: 30 }]
  
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Teacher Info')

  // ========== Sheet 2: Availability ==========
  const availabilityData = [
    ['Day', 'Start Time', 'End Time', 'Duration (hours)']
  ]

  teacher.weeklySchedule.forEach(slot => {
    const duration = calculateHoursDifference(slot.startTime, slot.endTime)
    availabilityData.push([
      slot.day,
      slot.startTime,
      slot.endTime,
      duration.toFixed(1)
    ])
  })

  // Add total
  availabilityData.push([])
  availabilityData.push(['Total Available Hours:', '', '', teacher.availableHours.toFixed(1)])

  const availabilitySheet = XLSX.utils.aoa_to_sheet(availabilityData)
  availabilitySheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }]
  
  XLSX.utils.book_append_sheet(workbook, availabilitySheet, 'Availability')

  // ========== Sheet 3: Scheduled Classes ==========
  const schedulesData = [
    ['Day', 'Start Time', 'End Time', 'Subject', 'Grade', 'Room', 'Duration (h)', 'Status']
  ]

  // Sort schedules by day and time
  const sortedSchedules = [...teacher.schedules].sort((a, b) => {
    const dayCompare = DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
    if (dayCompare !== 0) return dayCompare
    return a.startTime.localeCompare(b.startTime)
  })

  sortedSchedules.forEach(schedule => {
    const duration = calculateHoursDifference(schedule.startTime, schedule.endTime)
    const withinAvailability = isWithinAvailability(schedule, teacher.weeklySchedule)
    const status = withinAvailability ? '✓ OK' : '⚠ CONFLICT'

    schedulesData.push([
      schedule.day,
      schedule.startTime,
      schedule.endTime,
      schedule.subject.name,
      schedule.subject.grade,
      schedule.roomId,
      duration.toFixed(1),
      status
    ])
  })

  // Add summary
  schedulesData.push([])
  schedulesData.push(['Total Scheduled Hours:', '', '', '', '', '', teacher.totalHours.toFixed(1), ''])

  const schedulesSheet = XLSX.utils.aoa_to_sheet(schedulesData)
  schedulesSheet['!cols'] = [
    { wch: 12 }, 
    { wch: 12 }, 
    { wch: 12 }, 
    { wch: 20 }, 
    { wch: 10 }, 
    { wch: 12 }, 
    { wch: 12 }, 
    { wch: 12 }
  ]
  
  XLSX.utils.book_append_sheet(workbook, schedulesSheet, 'Scheduled Classes')

  // ========== Sheet 4: Conflicts (if any) ==========
  if (teacher.conflicts.length > 0) {
    const conflictsData = [
      ['Day', 'Scheduled Time', 'Subject', 'Grade', 'Room', 'Available Time', 'Issue']
    ]

    teacher.conflicts.forEach(conflict => {
      const availability = teacher.weeklySchedule.find(s => s.day === conflict.day)
      const issue = availability 
        ? `Outside available hours (${availability.startTime}-${availability.endTime})`
        : `Not available on ${conflict.day}`

      conflictsData.push([
        conflict.day,
        `${conflict.startTime} - ${conflict.endTime}`,
        conflict.subject.name,
        conflict.subject.grade,
        conflict.roomId,
        availability ? `${availability.startTime} - ${availability.endTime}` : 'N/A',
        issue
      ])
    })

    const conflictsSheet = XLSX.utils.aoa_to_sheet(conflictsData)
    conflictsSheet['!cols'] = [
      { wch: 12 }, 
      { wch: 18 }, 
      { wch: 20 }, 
      { wch: 10 }, 
      { wch: 12 }, 
      { wch: 18 }, 
      { wch: 40 }
    ]
    
    XLSX.utils.book_append_sheet(workbook, conflictsSheet, 'Conflicts')
  }

  // ========== Sheet 5: Weekly Overview ==========
  const weeklyData = [['Time', ...DAYS]]

  // Create time slots for the overview
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ]

  timeSlots.forEach(time => {
    const row = [time]
    
    DAYS.forEach(day => {
      const schedule = teacher.schedules.find(
        s => s.day === day && s.startTime <= time && s.endTime > time
      )
      
      if (schedule) {
        row.push(`${schedule.subject.name} (${schedule.roomId})`)
      } else {
        const isAvailable = teacher.weeklySchedule.some(
          slot => slot.day === day && slot.startTime <= time && slot.endTime > time
        )
        row.push(isAvailable ? 'Available' : '-')
      }
    })
    
    weeklyData.push(row)
  })

  const weeklySheet = XLSX.utils.aoa_to_sheet(weeklyData)
  weeklySheet['!cols'] = [
    { wch: 8 }, 
    { wch: 18 }, 
    { wch: 18 }, 
    { wch: 18 }, 
    { wch: 18 }, 
    { wch: 18 }, 
    { wch: 18 }, 
    { wch: 18 }
  ]
  
  XLSX.utils.book_append_sheet(workbook, weeklySheet, 'Weekly Overview')

  // ========== Generate and download file ==========
  const fileName = `${teacher.name.replace(/\s+/g, '_')}_schedule_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

// ==================== EXPORT OPTIONS COMPONENT ====================

function ExportButton({ teacher, onExport }: { teacher: TeacherWithSchedule; onExport: () => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20 overflow-hidden">
            <button
              onClick={() => {
                exportTeacherScheduleToExcel(teacher)
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </button>
            <button
              onClick={() => {
                onExport()
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export to Text
            </button>
          </div>
        </>
      )}
    </div>
  )
}