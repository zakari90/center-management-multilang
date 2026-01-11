import CreateTeacherForm from "@/components/createTeacherForm"

export const dynamic = 'force-dynamic';

function Page() {
  console.log('[CreateTeacherPage] Server render', { timestamp: new Date().toISOString() });
  return (
    <>
    <CreateTeacherForm/>
    </>
  )
}

export default Page