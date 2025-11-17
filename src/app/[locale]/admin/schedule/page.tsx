"use client"

import TeacherScheduleView from "@/components/teacherWithSchedule"
import TimetableManagement from "@/components/TimeTableManagement"

export default function SchedulePage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <TeacherScheduleView />
      <TimetableManagement />
    </div>
  )
}