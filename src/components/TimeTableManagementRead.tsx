'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
// import axios from 'axios' // ✅ Commented out - using local DB
import { Clock, Loader2, MapPin, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useCallback } from 'react'
import { 
  scheduleActions, 
  teacherActions, 
  subjectActions, 
  centerActions 
} from '@/lib/dexie/dexieActions'
import { useAuth } from '@/context/authContext'

interface Teacher {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  grade: string
}

interface ScheduleSlot {
  id: string
  day: string
  startTime: string
  endTime: string
  teacherId: string
  subjectId: string
  roomId: string
  teacher?: { id: string; name: string }
  subject?: { id: string; name: string; grade: string }
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

export default function TimetableManagement({ centerId }: { centerId?: string }) {
  const t = useTranslations('TimetableOverview')
  const { user } = useAuth() // ✅ Get current user from AuthContext
  
  const DAYS = [
    t('monday'), t('tuesday'), t('wednesday'), 
    t('thursday'), t('friday'), t('saturday')
  ]
  
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [rooms, setRooms] = useState<string[]>([])
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [viewMode, setViewMode] = useState<'all' | 'teacher' | 'room'>('all')
  const [selectedFilter, setSelectedFilter] = useState<string>('')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      if (!user) {
        setError("Unauthorized: Please log in again")
        setIsLoading(false)
        return
      }

      // ✅ Fetch from local DB
      const [allSchedules, allTeachers, allSubjects, allCenters] = await Promise.all([
        scheduleActions.getAll(),
        teacherActions.getAll(),
        subjectActions.getAll(),
        centerActions.getAll()
      ])

      // ✅ Filter by managerId and status
      const managerSchedules = allSchedules
        .filter(s => s.managerId === user.id && s.status !== '0')
        .filter(s => !centerId || s.centerId === centerId)

      const managerTeachers = allTeachers
        .filter(t => t.managerId === user.id && t.status !== '0')
        .map(t => ({
          id: t.id,
          name: t.name,
        }))

      const managerSubjects = allSubjects
        .filter(s => {
          // Filter subjects by centerId if provided, or by manager's centers
          if (centerId) {
            return s.centerId === centerId && s.status !== '0'
          }
          const managerCenters = allCenters.filter(c => 
            (c.managers || []).includes(user.id) && c.status !== '0'
          )
          return managerCenters.some(c => c.id === s.centerId) && s.status !== '0'
        })
        .map(s => ({
          id: s.id,
          name: s.name,
          grade: s.grade,
        }))

      // ✅ Build schedule slots with related data
      const schedulesWithData: ScheduleSlot[] = managerSchedules.map(schedule => {
        const teacher = managerTeachers.find(t => t.id === schedule.teacherId)
        const subject = managerSubjects.find(s => s.id === schedule.subjectId)

        return {
          id: schedule.id,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          teacherId: schedule.teacherId,
          subjectId: schedule.subjectId,
          roomId: schedule.roomId,
          teacher: teacher ? {
            id: teacher.id,
            name: teacher.name,
          } : undefined,
          subject: subject ? {
            id: subject.id,
            name: subject.name,
            grade: subject.grade,
          } : undefined,
        }
      })

      // ✅ Get rooms from center(s)
      let centerRooms: string[] = []
      if (centerId) {
        const center = allCenters.find(c => c.id === centerId && c.status !== '0')
        if (center?.classrooms) {
          centerRooms = center.classrooms
        }
      } else {
        // Get rooms from all manager's centers
        const managerCenters = allCenters.filter(c => 
          (c.managers || []).includes(user.id) && c.status !== '0'
        )
        const allRooms = new Set<string>()
        managerCenters.forEach(c => {
          if (c.classrooms) {
            c.classrooms.forEach(room => allRooms.add(room))
          }
        })
        centerRooms = Array.from(allRooms)
      }

      setTeachers(managerTeachers)
      setSubjects(managerSubjects)
      setSchedule(schedulesWithData)
      setRooms(centerRooms.length > 0 ? centerRooms : ['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5'])

      // ✅ Commented out API calls
      // const [teachersRes, subjectsRes, scheduleRes, centerRes] = await Promise.all([
      //   axios.get('/api/admin/teachers'),
      //   axios.get('/api/subjects'),
      //   axios.get(`/api/admin/schedule${centerId ? `?centerId=${centerId}` : ''}`),
      //   centerId ? axios.get(`/api/admin/centers/${centerId}`) : axios.get('/api/admin/centers')
      // ])
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError(t('errorLoadSchedule'))
    } finally {
      setIsLoading(false)
    }
  }, [user, centerId, t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredSchedule = schedule.filter(slot => {
    if (viewMode === 'teacher' && selectedFilter) {
      return slot.teacherId === selectedFilter
    }
    if (viewMode === 'room' && selectedFilter) {
      return slot.roomId === selectedFilter
    }
    return true
  })

  const getSlotsByDayAndTime = (day: string, time: string) => {
    return filteredSchedule.filter(s => s.day === day && s.startTime === time)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('viewOptions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>{t('viewMode')}</Label>
              <Select value={viewMode} onValueChange={(value: 'all' | 'teacher' | 'room') => {
                setViewMode(value)
                setSelectedFilter('')
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allSchedules')}</SelectItem>
                  <SelectItem value="teacher">{t('byTeacher')}</SelectItem>
                  <SelectItem value="room">{t('byRoom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {viewMode === 'teacher' && (
              <div className="flex-1">
                <Label>{t('selectTeacher')}</Label>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('chooseTeacher')} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {viewMode === 'room' && (
              <div className="flex-1">
                <Label>{t('selectRoom')}</Label>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('chooseRoom')} />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room} value={room}>
                        {room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('weeklySchedule')}</CardTitle>
          <CardDescription>
            {t('viewFullTimetable')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto relative">
            <div className="min-w-[1200px]">
              <div className="grid grid-cols-7 gap-2 mb-2">
                <div className="font-semibold text-sm text-muted-foreground p-2 sticky">
                  {t('time')}
                </div>
                {DAYS.map(day => (
                  <div key={day} className="font-semibold text-sm text-center p-2 bg-primary/10 rounded-md">
                    {day}
                  </div>
                ))}
              </div>

              <div className="space-y-2 sticky">
                {TIME_SLOTS.slice(0, -1).map((time, timeIndex) => (
                  <div key={time} className="grid grid-cols-7 gap-2">
                    <div className="flex items-center justify-center text-sm font-medium text-muted-foreground p-2 border rounded-md">
                      <Clock className="h-3 w-3 mr-1" />
                      {time} - {TIME_SLOTS[timeIndex + 1]}
                    </div>

                    {DAYS.map(day => {
                      const slots = getSlotsByDayAndTime(day, time)
                      const hasConflict = slots.length > 1

                      return (
                        <div
                          key={`${day}-${time}`}
                          className={cn(
                            "min-h-[100px] p-2 border-2 rounded-md",
                            slots.length === 0 && "bg-muted/30",
                            hasConflict && "border-destructive bg-destructive/10"
                          )}
                        >
                          <div className="space-y-1">
                            {slots.map((slot, idx) => {
                              const teacher = slot.teacher || teachers.find(t => t.id === slot.teacherId)
                              const subject = slot.subject || subjects.find(s => s.id === slot.subjectId)
                              
                              return (
                                <div
                                  key={slot.id || idx}
                                  className="p-2 bg-white border rounded text-xs space-y-1"
                                >
                                  <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="text-xs">
                                      {subject?.name || t('unknownSubject')}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{teacher?.name || t('unknownTeacher')}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{slot.roomId}</span>
                                  </div>
                                  {subject?.grade && (
                                    <Badge variant="secondary" className="text-xs">
                                      {t('grade')}: {subject.grade}
                                    </Badge>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}