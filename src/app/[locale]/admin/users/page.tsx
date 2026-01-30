import AllUsersTable from "@/components/all-users-table";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  console.log("[AdminUsersPage] Server render", {
    timestamp: new Date().toISOString(),
  });
  return (
    <div className="container mx-auto p-6">
      <AllUsersTable />
    </div>
  );
}
