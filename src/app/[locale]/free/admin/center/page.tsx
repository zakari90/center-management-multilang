import CenterPageClient from "@/components/freeinUse/center-page-client";

export const dynamic = "force-dynamic";

export default function CenterPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <CenterPageClient />;
    </div>
  );
}
