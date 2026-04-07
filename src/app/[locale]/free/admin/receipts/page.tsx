import AdminReceiptsTable from "@/components/inUse/adminReceiptPresenation";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <AdminReceiptsTable />
    </div>
  );
}
