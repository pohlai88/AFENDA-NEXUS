import { PageHeader } from "@/components/erp/page-header";
import { EmptyState } from "@/components/erp/empty-state";
import { List } from "lucide-react";

export const metadata = { title: "Chart of Accounts" };

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="Manage your general ledger account structure."
        breadcrumbs={[
          { label: "Finance" },
          { label: "Accounts" },
        ]}
      />

      <EmptyState
        title="No accounts loaded"
        description="Connect the API to view and manage your chart of accounts."
        icon={List}
      />
    </div>
  );
}
