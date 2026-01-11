import ManagerStudentsClient from "@/components/manager-students-client";

export const dynamic = 'force-dynamic';

export default function Page() {
  console.log('[ManagerStudentsPage] Server render', { timestamp: new Date().toISOString() });
  return <ManagerStudentsClient />;
}