// /manager/students/page.tsx
import StudentReceiptTable from '@/components/studentReceiptTable'
import StudentsTable from '@/components/studentsPresentation'
import React from 'react'

function Page() {
  return (
    <div>
      <StudentsTable/>
      <StudentReceiptTable/>
      
      </div>
  )
}

export default Page