import CreateTeacherPaymentFormClient from "@/components/create-teacher-payment-client";

export const dynamic = 'force-dynamic';

export default function CreateTeacherPaymentPage() {
  console.log('[CreateTeacherPaymentPage] Server render', { timestamp: new Date().toISOString() });
  return <CreateTeacherPaymentFormClient />;
}