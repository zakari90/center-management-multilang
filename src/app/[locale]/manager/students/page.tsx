"use client"

// /manager/students/page.tsx
import StudentReceiptTable from '@/components/studentReceiptTable'
import StudentsTable from '@/components/studentsPresentation'

function Page() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <StudentsTable/>
      <StudentReceiptTable/>
    </div>
  )
}

export default Page