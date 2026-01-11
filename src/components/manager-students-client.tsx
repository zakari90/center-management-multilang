"use client"

import StudentReceiptTable from '@/components/studentReceiptTable'
import StudentsTable from '@/components/studentsPresentation'

export default function ManagerStudentsClient() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <StudentsTable/>
      <StudentReceiptTable/>
    </div>
  )
}
