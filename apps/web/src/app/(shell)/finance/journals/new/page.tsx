import { PageHeader } from "@/components/erp/page-header";
import { JournalDraftForm } from "@/features/finance/journals/forms/journal-draft-form";
import { routes } from "@/lib/constants";

export const metadata = { title: "New Journal" };

export default function NewJournalPage() {
  // Server Action wrapper — validates + calls API
  async function handleCreate(_data: unknown) {
    "use server";
    // TODO: Wire auth context
    // const ctx = await getRequestContext();
    // return createJournal(ctx, data);

    // Placeholder — return error until API is wired
    return {
      ok: false as const,
      error: {
        code: "NOT_CONNECTED",
        message: "API not yet connected. Wire getRequestContext() to enable.",
        statusCode: 503,
      },
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Journal"
        description="Draft a new general ledger journal entry."
        breadcrumbs={[
          { label: "Finance" },
          { label: "Journals", href: routes.finance.journals },
          { label: "New" },
        ]}
      />

      <div className="mx-auto max-w-3xl">
        <JournalDraftForm onSubmit={handleCreate} />
      </div>
    </div>
  );
}
