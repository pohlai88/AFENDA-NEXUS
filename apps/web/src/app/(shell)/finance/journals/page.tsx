import Link from "next/link";
import { PageHeader } from "@/components/erp/page-header";
import { JournalTable } from "@/features/finance/journals/blocks/journal-table";
import { routes } from "@/lib/constants";

export const metadata = { title: "Journals" };

export default function JournalsPage() {
  // TODO: Wire to API via getJournals() once auth context is available
  // Accept searchParams, call getRequestContext(), then getJournals(ctx, params)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journals"
        description="General ledger journal entries."
        breadcrumbs={[
          { label: "Finance", href: "/finance/journals" },
          { label: "Journals" },
        ]}
        actions={
          <Link
            href={routes.finance.journalNew}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Journal
          </Link>
        }
      />

      {/* Placeholder — replace with real data once API is wired */}
      <JournalTable data={[]} total={0} />
    </div>
  );
}
