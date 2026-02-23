import { PageHeader } from "@/components/erp/page-header";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Tenant and company configuration."
        breadcrumbs={[{ label: "Settings" }]}
      />

      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Settings will be available once tenant management is implemented.
      </div>
    </div>
  );
}
