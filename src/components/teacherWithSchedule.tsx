'use client'

import TeacherScheduleView from '@/components/teachers/schedule/TeacherScheduleView'

export default function TeacherWithSchedule(props: { centerId?: string }) {
  return <TeacherScheduleView {...props} />
}