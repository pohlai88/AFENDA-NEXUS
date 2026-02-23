import { PageHeader } from "@/components/erp/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your financial operations."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Open Journals" value="—" />
        <DashboardCard title="Posted This Period" value="—" />
        <DashboardCard title="Pending Approvals" value="—" />
        <DashboardCard title="Active Period" value="—" />
      </div>

      <p className="text-sm text-muted-foreground">
        Dashboard widgets will be populated once the API is connected.
      </p>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
