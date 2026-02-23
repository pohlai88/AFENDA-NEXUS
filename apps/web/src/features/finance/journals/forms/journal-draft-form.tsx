"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateJournalSchema, type CreateJournal } from "@afenda/contracts";
import { JournalLinesEditor } from "../blocks/journal-lines-editor";
import { useReceipt } from "@/hooks/use-receipt";
import { ReceiptPanel } from "@/components/erp/receipt-panel";
import { routes } from "@/lib/constants";
import type { ApiResult, CommandReceipt } from "@/lib/types";
import { useState } from "react";

interface JournalDraftFormProps {
  onSubmit: (data: CreateJournal) => Promise<ApiResult<CommandReceipt>>;
  defaultLedgerId?: string;
  defaultCompanyId?: string;
}

export function JournalDraftForm({
  onSubmit,
  defaultLedgerId,
  defaultCompanyId,
}: JournalDraftFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  const form = useForm<CreateJournal>({
    resolver: zodResolver(CreateJournalSchema),
    defaultValues: {
      companyId: defaultCompanyId ?? "",
      ledgerId: defaultLedgerId ?? "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      lines: [
        { accountCode: "", debit: 0, credit: 0, currency: "USD" },
        { accountCode: "", debit: 0, credit: 0, currency: "USD" },
      ],
    },
  });

  async function handleSubmit(data: CreateJournal) {
    setSubmitting(true);
    setError(null);

    const result = await onSubmit(data);

    setSubmitting(false);

    if (result.ok) {
      showReceipt(result.value);
    } else {
      setError(result.error.message);
    }
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Journal Created Successfully"
        onClose={clearReceipt}
        viewHref={routes.finance.journalDetail(receipt.resultRef)}
        backHref={routes.finance.journals}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description <span className="text-destructive">*</span>
          </label>
          <input
            id="description"
            {...form.register("description")}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            placeholder="Journal description"
          />
          {form.formState.errors.description && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium">
            Posting Date <span className="text-destructive">*</span>
          </label>
          <input
            id="date"
            type="date"
            {...form.register("date")}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          />
          {form.formState.errors.date && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.date.message}
            </p>
          )}
        </div>
      </div>

      <JournalLinesEditor form={form} />

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <a
          href={routes.finance.journals}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create Draft"}
        </button>
      </div>
    </form>
  );
}
