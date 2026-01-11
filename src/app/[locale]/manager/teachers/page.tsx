import ManagerTeachersClient from "@/components/manager-teachers-client";

export const dynamic = 'force-dynamic';

export default function Page() {
  console.log('[ManagerTeachersPage] Server render', { timestamp: new Date().toISOString() });
  return <ManagerTeachersClient />;
}
