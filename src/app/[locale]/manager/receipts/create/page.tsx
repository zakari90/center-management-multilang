import CreateStudentPaymentForm from "@/components/studentPaymentForm2"

export const dynamic = 'force-dynamic';

function Page() {
  console.log('[CreateReceiptPage] Server render', { timestamp: new Date().toISOString() });
  return (
    <>
    <CreateStudentPaymentForm/>
    </>
  )
}

export default Page