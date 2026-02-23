import { PageHeader } from "@/components/erp/page-header";
import { routes } from "@/lib/constants";

export const metadata = { title: "Journal Detail" };

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // TODO: Wire to API via getJournal() once auth context is available
  // const ctx = await getRequestContext();
  // const result = await getJournal(ctx, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Journal ${id.slice(0, 8)}…`}
        breadcrumbs={[
          { label: "Finance" },
          { label: "Journals", href: routes.finance.journals },
          { label: "Detail" },
        ]}
      />

      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Journal detail view will render here once the API is connected.
        <br />
        <span className="font-mono text-xs">ID: {id}</span>
      </div>
    </div>
  );
}
