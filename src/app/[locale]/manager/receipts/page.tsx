import ReceiptsTable from "@/components/receiptPresenationui"

export const dynamic = 'force-dynamic';

function Page() {
  console.log('[ManagerReceiptsPage] Server render', { timestamp: new Date().toISOString() });
  return (
    <div>
      <ReceiptsTable/>
      </div>
  )
}

export default Page