"use client"

import TeacherScheduleView from "@/components/inUse/teacherWithSchedule"
import TimetableManagement from "@/components/inUse/TimeTableManagement"

export default function SchedulePage() {
  return (
    <div className="container mx-auto p-6">
      <TeacherScheduleView/>
      <TimetableManagement />
    </div>
  )
}