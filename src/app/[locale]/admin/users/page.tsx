import AllUsersTable from "@/components/admin/users/AllUsersTable";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto p-6">
      <AllUsersTable />
    </div>
  );
}
