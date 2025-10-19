/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import axios from 'axios'
import { Clock, Loader2, MapPin, User } from 'lucide-react'
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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [teachersRes, subjectsRes, scheduleRes, centerRes] = await Promise.all([
        axios.get('/api/admin/teachers'),
        axios.get('/api/subjects'),
        axios.get(`/api/admin/schedule${centerId ? `?centerId=${centerId}` : ''}`),
        centerId ? axios.get(`/api/admin/centers/${centerId}`) : axios.get('/api/admin/centers')
      ])
      
      console.log("*******************************")
      console.log("Teachers:", teachersRes.data)
      console.log("Subjects:", subjectsRes.data)
      console.log("Schedule:", scheduleRes.data)
      console.log("*******************************")
      
      setTeachers(teachersRes.data)
      setSubjects(subjectsRes.data)
      setSchedule(scheduleRes.data)
      
      if (centerRes?.data?.classrooms) {
        setRooms(centerRes.data.classrooms)
      } else if (centerRes?.data?.[0]?.classrooms) {
        setRooms(centerRes.data[0].classrooms)
      } else {
        setRooms(['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5'])
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError(t('errorLoadSchedule'))
    } finally {
      setIsLoading(false)
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

      <Card>
        <CardHeader>
          <CardTitle>{t('weeklySchedule')}</CardTitle>
          <CardDescription>
            {t('viewFullTimetable')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              <div className="grid grid-cols-7 gap-2 mb-2">
                <div className="font-semibold text-sm text-muted-foreground p-2">
                  {t('time')}
                </div>
                {DAYS.map(day => (
                  <div key={day} className="font-semibold text-sm text-center p-2 bg-primary/10 rounded-md">
                    {day}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
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