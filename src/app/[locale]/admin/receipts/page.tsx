import AdminReceiptsTable from "@/components/inUse/adminReceiptPresenation";
import StudentsTable from "@/components/studentsPresentation";
import TeachersTable from "@/components/teachersPresentation";

export const dynamic = "force-dynamic";

export default function Page() {
  console.log("[AdminReceiptsPage] Server render", {
    timestamp: new Date().toISOString(),
  });
  return (
    <div>
      <AdminReceiptsTable />
      <StudentsTable />
      <TeachersTable />
    </div>
  );
}
