import TeacherScheduleView from "@/components/teacherWithSchedule";
import TimetableManagement from "@/components/TimeTableManagement";

export default function SchedulePage() {
  return (
    <div className="container mx-auto p-6">
      <TeacherScheduleView/>
      <TimetableManagement />
    </div>
  )
}