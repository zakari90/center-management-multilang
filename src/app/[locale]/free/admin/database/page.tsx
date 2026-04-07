import { AllTablesViewer } from "@/components/all-tables-viewer";

export default function DatabaseViewerPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <AllTablesViewer isFree={true} />
    </div>
  );
}
