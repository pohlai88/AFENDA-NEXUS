"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/erp/status-badge";
import { MoneyCell } from "@/components/erp/money-cell";
import { DateCell } from "@/components/erp/date-cell";
import { EmptyState } from "@/components/erp/empty-state";
import { routes } from "@/lib/constants";
import { FileText } from "lucide-react";
import type { JournalListItem } from "../queries/journal.queries";

interface JournalTableProps {
  data: JournalListItem[];
  total: number;
}

export function JournalTable({ data, total }: JournalTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No journals found"
        description="Create your first journal entry to get started."
        icon={FileText}
        action={
          <Link
            href={routes.finance.journalNew}
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Journal
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Document</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Debit</th>
              <th className="px-4 py-3 text-right font-medium">Credit</th>
            </tr>
          </thead>
          <tbody>
            {data.map((journal) => (
              <tr key={journal.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link
                    href={routes.finance.journalDetail(journal.id)}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {journal.documentNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {journal.description}
                </td>
                <td className="px-4 py-3">
                  <DateCell date={journal.postingDate} format="short" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={journal.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <MoneyCell amount={journal.totalDebit} currency={journal.currency} />
                </td>
                <td className="px-4 py-3 text-right">
                  <MoneyCell amount={journal.totalCredit} currency={journal.currency} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {total} journal{total !== 1 ? "s" : ""} total
      </p>
    </div>
  );
}
