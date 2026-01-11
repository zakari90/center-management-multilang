import AdminReceiptsTable from '@/components/inUse/adminReceiptPresenation'

export const dynamic = 'force-dynamic';

export default function Page() {
  console.log('[AdminReceiptsPage] Server render', { timestamp: new Date().toISOString() });
  return (
    <div>      
      <AdminReceiptsTable/>
    </div>
  )
}