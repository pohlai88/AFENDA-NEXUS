import { PageHeader } from "@/components/erp/page-header";
import { EmptyState } from "@/components/erp/empty-state";
import { Calendar } from "lucide-react";

export const metadata = { title: "Fiscal Periods" };

export default function PeriodsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fiscal Periods"
        description="Manage fiscal year periods — open, close, and lock."
        breadcrumbs={[
          { label: "Finance" },
          { label: "Periods" },
        ]}
      />

      <EmptyState
        title="No periods loaded"
        description="Connect the API to view and manage fiscal periods."
        icon={Calendar}
      />
    </div>
  );
}
