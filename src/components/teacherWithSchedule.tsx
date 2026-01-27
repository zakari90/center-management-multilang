"use client";

import TeacherScheduleView from "./inUse/teacherWithSchedule";

export default function TeacherWithSchedule(props: { centerId?: string }) {
  return <TeacherScheduleView {...props} />;
}
