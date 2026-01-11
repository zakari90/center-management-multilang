// /manager/students/create/page.tsx
import CreateStudentForm from "@/components/studentCreationForm"

export const dynamic = 'force-dynamic';

function Page() {
  console.log('[CreateStudentPage] Server render', { timestamp: new Date().toISOString() });
  return (
    <div>
      <CreateStudentForm/>
    
    </div>
  )
}

export default Page