import AllUsersTable from "@/components/freeinUse/admin/users/AllUsersTable";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <AllUsersTable />
    </div>
  );
}
