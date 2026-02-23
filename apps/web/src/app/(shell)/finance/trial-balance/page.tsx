import { PageHeader } from "@/components/erp/page-header";
import { EmptyState } from "@/components/erp/empty-state";
import { Scale } from "lucide-react";

export const metadata = { title: "Trial Balance" };

export default function TrialBalancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Trial Balance"
        description="Account balances for the selected period."
        breadcrumbs={[
          { label: "Finance" },
          { label: "Trial Balance" },
        ]}
      />

      <EmptyState
        title="No data available"
        description="Connect the API and select a ledger and period to view the trial balance."
        icon={Scale}
      />
    </div>
  );
}
