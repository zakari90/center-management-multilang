import TeachersTable from "@/components/teachersPresentation";

export const dynamic = 'force-dynamic';

export default function Page() {
  console.log('[ManagerTeachersPage] Server render', { timestamp: new Date().toISOString() });
  return <TeachersTable/> ;
}
