/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Clock, Loader2, MapPin, Trash2, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useLocalizedConstants } from './useLocalizedConstants'
import { scheduleActions, teacherActions, subjectActions, centerActions } from '@/lib/dexie/_dexieActions'
import { generateObjectId } from '@/lib/utils/generateObjectId'
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
  id?: string
  day: string
  startTime: string
  endTime: string
  teacherId: string
  subjectId: string
  roomId: string
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

export default function TimetableManagement({ centerId }: { centerId?: string }) {
  // Translate using the 'TimetableManagement' namespace
  const t = useTranslations('TimetableManagement')
  const { daysOfWeek, availableClassrooms } = useLocalizedConstants()
  const { user } = useAuth() // ✅ Get current user from AuthContext

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [rooms, setRooms] = useState<string[]>(availableClassrooms)
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string
    startTime: string
    endTime: string
  } | null>(null)

  const [newEntry, setNewEntry] = useState({
    teacherId: '',
    subjectId: '',
    roomId: '',
  })

  const [viewMode, setViewMode] = useState<'all' | 'teacher' | 'room'>('all')
  const [selectedFilter, setSelectedFilter] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // ✅ Fetch from local DB
      const [allTeachers, allSubjects, allSchedules, allCenters] = await Promise.all([
        teacherActions.getAll(),
        subjectActions.getAll(),
        scheduleActions.getAll(),
        centerActions.getAll()
      ])

      // ✅ Filter teachers and subjects by status (not deleted)
      const activeTeachers = allTeachers
        .filter(t => t.status !== '0')
        .map(t => ({ id: t.id, name: t.name }))
      
      const activeSubjects = allSubjects
        .filter(s => s.status !== '0')
        .map(s => ({ id: s.id, name: s.name, grade: s.grade }))

      // ✅ Filter schedules by centerId if provided, and managerId
      let filteredSchedules = allSchedules.filter(s => s.status !== '0')
      if (centerId) {
        filteredSchedules = filteredSchedules.filter(s => s.centerId === centerId)
      }
      if (user) {
        filteredSchedules = filteredSchedules.filter(s => s.managerId === user.id)
      }

      // ✅ Transform schedules to match ScheduleSlot interface
      const scheduleSlots: ScheduleSlot[] = filteredSchedules.map(s => ({
        id: s.id,
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        teacherId: s.teacherId,
        subjectId: s.subjectId,
        roomId: s.roomId,
      }))

      setTeachers(activeTeachers)
      setSubjects(activeSubjects)
      setSchedule(scheduleSlots)

      // ✅ Get rooms from center if centerId provided
      if (centerId) {
        const center = allCenters.find(c => c.id === centerId)
        if (center?.classrooms?.length) {
          setRooms(center.classrooms)
        } else {
          setRooms(availableClassrooms)
        }
      } else {
        setRooms(availableClassrooms)
      }

      // ✅ Commented out online fetch
      // const [teachersRes, subjectsRes, scheduleRes, centerRes] = await Promise.all([
      //   axios.get('/api/admin/teachers'),
      //   axios.get('/api/subjects'),
      //   axios.get(`/api/admin/schedule${centerId ? `?centerId=${centerId}` : ''}`),
      //   centerId ? axios.get(`/api/admin/centers/${centerId}`) : Promise.resolve(null)
      // ])
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError(t('errorLoadData'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSlotClick = (day: string, startTime: string) => {
    const endTimeIndex = TIME_SLOTS.indexOf(startTime) + 1
    const endTime = TIME_SLOTS[endTimeIndex] || '18:00'

    setSelectedSlot({ day, startTime, endTime })
    setNewEntry({ teacherId: '', subjectId: '', roomId: '' })
    setIsDialogOpen(true)
  }

  const handleAddSchedule = async () => {
    if (!selectedSlot || !newEntry.teacherId || !newEntry.subjectId || !newEntry.roomId) {
      setError(t('errorFillAllFields'))
      return
    }

    if (!user) {
      setError('Unauthorized: Please log in again')
      return
    }

    setIsSaving(true)
    try {
      // ✅ Check for conflicts in local DB
      const allSchedules = await scheduleActions.getAll()
      const activeSchedules = allSchedules.filter(s => s.status !== '0')

      // Check teacher conflict
      const teacherConflict = activeSchedules.find(s => 
        s.teacherId === newEntry.teacherId &&
        s.day === selectedSlot.day &&
        s.startTime === selectedSlot.startTime
      )

      if (teacherConflict) {
        setError('Teacher already has a class at this time')
        setIsSaving(false)
        return
      }

      // Check room conflict
      const roomConflict = activeSchedules.find(s => 
        s.roomId === newEntry.roomId &&
        s.day === selectedSlot.day &&
        s.startTime === selectedSlot.startTime &&
        (centerId ? s.centerId === centerId : true)
      )

      if (roomConflict) {
        setError('Room is already booked at this time')
        setIsSaving(false)
        return
      }

      // ✅ Create schedule in local DB
      const now = Date.now()
      const scheduleId = generateObjectId()
      const newSchedule = {
        id: scheduleId,
        day: selectedSlot.day,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        teacherId: newEntry.teacherId,
        subjectId: newEntry.subjectId,
        roomId: newEntry.roomId,
        managerId: user.id,
        centerId: centerId || undefined,
        status: 'w' as const, // Waiting for sync
        createdAt: now,
        updatedAt: now,
      }

      await scheduleActions.putLocal(newSchedule)

      // ✅ Update local state
      const scheduleSlot: ScheduleSlot = {
        id: scheduleId,
        day: selectedSlot.day,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        teacherId: newEntry.teacherId,
        subjectId: newEntry.subjectId,
        roomId: newEntry.roomId,
      }

      setSchedule(prev => [...prev, scheduleSlot])
      setIsDialogOpen(false)
      setNewEntry({ teacherId: '', subjectId: '', roomId: '' })
      setError('')

      // ✅ Commented out online creation
      // const { data } = await axios.post('/api/admin/schedule', {
      //   day: selectedSlot.day,
      //   startTime: selectedSlot.startTime,
      //   endTime: selectedSlot.endTime,
      //   teacherId: newEntry.teacherId,
      //   subjectId: newEntry.subjectId,
      //   roomId: newEntry.roomId,
      //   centerId,
      // })
    } catch (err) {
      console.error('Failed to add schedule:', err)
      setError(t('errorAddSchedule'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      // ✅ Soft delete in local DB
      await scheduleActions.markForDelete(scheduleId)
      
      // ✅ Update local state
      setSchedule(prev => prev.filter(s => s.id !== scheduleId))

      // ✅ Commented out online delete
      // await axios.delete(`/api/admin/schedule/${scheduleId}`)
    } catch (err) {
      console.error('Failed to delete schedule:', err)
      setError(t('errorDeleteSchedule'))
    }
  }

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
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('viewOptions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <Label>{t('viewMode')}</Label>
              <Select
                value={viewMode}
                onValueChange={(value: any) => {
                  setViewMode(value)
                  setSelectedFilter('')
                }}
              >
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
              <div className="flex-1 min-w-[150px]">
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
              <div className="flex-1 min-w-[150px]">
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

      {/* Timetable Grid */}
      <Card>
        <CardHeader>
          <CardTitle>{t('weeklySchedule')}</CardTitle>
          <CardDescription>{t('weeklyScheduleDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto relative">
            <div className="min-w-[1200px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-2 ">
                <div className="font-semibold text-sm text-muted-foreground p-2 border rounded-md sticky left-0 bg-background z-10">
                  {t('time')}
                </div>
                {daysOfWeek.map(day => (
                  <div
                    key={day.key}
                    className="font-semibold text-sm text-center p-2 bg-primary/10 rounded-md sticky top-0 z-20"
                  >
                    {day.label}
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              <div className="space-y-2 sticky">
                {TIME_SLOTS.slice(0, -1).map((time, timeIndex) => (
                  <div key={time} className="grid grid-cols-8 gap-2">
                    {/* Time Label - fixed on left */}
                    <div className="flex items-center justify-center text-sm font-medium text-muted-foreground p-2 border rounded-md sticky left-0 bg-background z-10">
                      <Clock className="h-3 w-3 mr-1" />
                      {time} - {TIME_SLOTS[timeIndex + 1]}
                    </div>

                    {/* Day Columns */}
                    {daysOfWeek.map(day => {
                      const slots = getSlotsByDayAndTime(day.label, time)
                      const hasConflict = slots.length > 1

                      return (
                        <div
                          key={`${day.key}-${time}`}
                          onClick={() => handleSlotClick(day.label, time)}
                          className={cn(
                            "min-h-[100px] p-2 border-2 rounded-md cursor-pointer transition-all",
                            "hover:border-primary hover:bg-primary/5",
                            slots.length === 0 && "bg-muted/30",
                            hasConflict && "border-destructive bg-destructive/10"
                          )}
                        >
                          <div className="space-y-1">
                            {slots.map((slot, idx) => {
                              const teacher = teachers.find(t => t.id === slot.teacherId)
                              const subject = subjects.find(s => s.id === slot.subjectId)

                              return (
                                <div
                                  key={slot.id || idx}
                                  className="p-2 bg-white border rounded text-xs space-y-1 group relative"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="text-xs">
                                      {subject?.name}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                      onClick={() => slot.id && handleDeleteSchedule(slot.id)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{teacher?.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{slot.roomId}</span>
                                  </div>
                                  {subject?.grade && (
                                    <Badge variant="secondary" className="text-xs">
                                      {subject.grade}
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

      {/* Add Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addClassSchedule')}</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  {selectedSlot.day}, {selectedSlot.startTime} - {selectedSlot.endTime}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('teacher')} {t('required')}</Label>
              <Select
                value={newEntry.teacherId}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, teacherId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTeacherPlaceholder')} />
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

            <div className="space-y-2">
              <Label>{t('subject')} {t('required')}</Label>
              <Select
                value={newEntry.subjectId}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, subjectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectSubjectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('room')} {t('required')}</Label>
              <Select
                value={newEntry.roomId}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, roomId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectRoomPlaceholder')} />
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              {t('cancel')}
            </Button>
            <Button onClick={handleAddSchedule} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('addToSchedule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
