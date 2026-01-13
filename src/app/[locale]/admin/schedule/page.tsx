import TeacherScheduleView from "@/components/inUse/teacherWithSchedule"
import TimetableManagement from "@/components/inUse/TimeTableManagement"

export const dynamic = 'force-dynamic';

export default function SchedulePage() {
  console.log('[AdminSchedulePage] Server render', { timestamp: new Date().toISOString() });
  return (
    <div className="container mx-auto p-4 space-y-4">
      <TeacherScheduleView/>
      <TimetableManagement />
    </div>
  )
}