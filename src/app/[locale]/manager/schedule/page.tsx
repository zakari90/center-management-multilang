import ManagerScheduleClient from "@/components/manager-schedule-client";

export const dynamic = 'force-dynamic';

export default function Page() {
  console.log('[ManagerSchedulePage] Server render', { timestamp: new Date().toISOString() });
  return <ManagerScheduleClient />;
}