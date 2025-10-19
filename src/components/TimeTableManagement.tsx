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
import axios from 'axios'
import { Clock, Loader2, MapPin, Trash2, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

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
  const t = useTranslations('TimetableManagement')
  
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [rooms, setRooms] = useState<string[]>([])
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

  const daysOfWeek = [
    { key: 'monday', label: t('monday') },
    { key: 'tuesday', label: t('tuesday') },
    { key: 'wednesday', label: t('wednesday') },
    { key: 'thursday', label: t('thursday') },
    { key: 'friday', label: t('friday') },
    { key: 'saturday', label: t('saturday') },
    { key: 'sunday', label: t('sunday') }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [teachersRes, subjectsRes, scheduleRes, centerRes] = await Promise.all([
        axios.get('/api/admin/teachers'),
        axios.get('/api/subjects'),
        axios.get(`/api/admin/schedule${centerId ? `?centerId=${centerId}` : ''}`),
        centerId ? axios.get(`/api/admin/centers/${centerId}`) : Promise.resolve(null)
      ])
      
      setTeachers(teachersRes.data)
      setSubjects(subjectsRes.data)
      setSchedule(scheduleRes.data)
      
      if (centerRes?.data?.classrooms) {
        setRooms(centerRes.data.classrooms)
      } else {
        setRooms(['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5'])
      }
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

    setIsSaving(true)
    try {
      const { data } = await axios.post('/api/admin/schedule', {
        day: selectedSlot.day,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        teacherId: newEntry.teacherId,
        subjectId: newEntry.subjectId,
        roomId: newEntry.roomId,
        centerId, 
      })

      setSchedule(prev => [...prev, data])
      setIsDialogOpen(false)
      setNewEntry({ teacherId: '', subjectId: '', roomId: '' })
      setError('')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || t('errorAddSchedule'))
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await axios.delete(`/api/admin/schedule/${scheduleId}`)
      setSchedule(prev => prev.filter(s => s.id !== scheduleId))
    } catch (err) {
      console.log(err);
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
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>{t('viewMode')}</Label>
              <Select value={viewMode} onValueChange={(value: any) => {
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

      {/* Timetable Grid */}
      <Card>
        <CardHeader>
          <CardTitle>{t('weeklySchedule')}</CardTitle>
          <CardDescription>
            {t('weeklyScheduleDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="font-semibold text-sm text-muted-foreground p-2">
                  {t('time')}
                </div>
                {daysOfWeek.map(day => (
                  <div key={day.key} className="font-semibold text-sm text-center p-2 bg-primary/10 rounded-md">
                    {day.label}
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                {TIME_SLOTS.slice(0, -1).map((time, timeIndex) => (
                  <div key={time} className="grid grid-cols-8 gap-2">
                    {/* Time Label */}
                    <div className="flex items-center justify-center text-sm font-medium text-muted-foreground p-2 border rounded-md">
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