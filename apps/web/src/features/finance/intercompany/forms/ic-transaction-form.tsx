'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createIcTransactionAction } from '@/features/finance/intercompany/actions/ic.actions';
import type { CommandReceipt } from '@/lib/types';
import Link from 'next/link';
import { routes } from '@/lib/constants';

export function IcTransactionCreateForm({
  agreements,
}: {
  agreements: Array<{ id: string; sellerCompanyName: string; buyerCompanyName: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    const agreementId = formData.get('agreementId') as string;
    const sourceLedgerId = formData.get('sourceLedgerId') as string;
    const mirrorLedgerId = formData.get('mirrorLedgerId') as string;
    const fiscalPeriodId = formData.get('fiscalPeriodId') as string;
    const description = formData.get('description') as string;
    const postingDate = formData.get('postingDate') as string;
    const currency = formData.get('currency') as string;

    // Parse source lines from comma-separated fields
    const sourceAccountId = formData.get('sourceAccountId') as string;
    const sourceDebit = formData.get('sourceDebit') as string;
    const sourceCredit = formData.get('sourceCredit') as string;
    const mirrorAccountId = formData.get('mirrorAccountId') as string;
    const mirrorDebit = formData.get('mirrorDebit') as string;
    const mirrorCredit = formData.get('mirrorCredit') as string;

    startTransition(async () => {
      setError(null);
      const result = await createIcTransactionAction({
        agreementId,
        sourceLedgerId,
        mirrorLedgerId,
        fiscalPeriodId,
        description,
        postingDate,
        currency,
        sourceLines: [
          { accountId: sourceAccountId, debit: sourceDebit || '0', credit: sourceCredit || '0' },
        ],
        mirrorLines: [
          { accountId: mirrorAccountId, debit: mirrorDebit || '0', credit: mirrorCredit || '0' },
        ],
      });

      if (result.ok) {
        setReceipt(result.value);
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  if (receipt) {
    return (
      <div className="space-y-4">
        <ReceiptPanel
          receipt={receipt}
          title="IC transaction created"
          onClose={() => setReceipt(null)}
        />
        <Button asChild variant="outline">
          <Link href={routes.finance.icTransactions}>Back to IC Transactions</Link>
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      {error && (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Agreement & Period */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="agreementId">IC Agreement</Label>
          <select
            id="agreementId"
            name="agreementId"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select agreement…</option>
            {agreements.map((a) => (
              <option key={a.id} value={a.id}>
                {a.sellerCompanyName} → {a.buyerCompanyName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fiscalPeriodId">Fiscal Period ID</Label>
          <Input id="fiscalPeriodId" name="fiscalPeriodId" required placeholder="UUID" />
        </div>
      </div>

      {/* Ledger IDs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sourceLedgerId">Source Ledger ID</Label>
          <Input id="sourceLedgerId" name="sourceLedgerId" required placeholder="UUID" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mirrorLedgerId">Mirror Ledger ID</Label>
          <Input id="mirrorLedgerId" name="mirrorLedgerId" required placeholder="UUID" />
        </div>
      </div>

      {/* Description, date, currency */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" required maxLength={500} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postingDate">Posting Date</Label>
          <Input id="postingDate" name="postingDate" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            required
            maxLength={3}
            className="uppercase"
            placeholder="USD"
          />
        </div>
      </div>

      {/* Source line (simplified — single line for MVP) */}
      <fieldset className="rounded-md border p-4 space-y-3">
        <legend className="text-sm font-semibold px-1">Source Journal Line</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="sourceAccountId">Account ID</Label>
            <Input id="sourceAccountId" name="sourceAccountId" required placeholder="UUID" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sourceDebit">Debit</Label>
            <Input
              id="sourceDebit"
              name="sourceDebit"
              type="text"
              inputMode="numeric"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sourceCredit">Credit</Label>
            <Input
              id="sourceCredit"
              name="sourceCredit"
              type="text"
              inputMode="numeric"
              placeholder="0"
            />
          </div>
        </div>
      </fieldset>

      {/* Mirror line (simplified — single line for MVP) */}
      <fieldset className="rounded-md border p-4 space-y-3">
        <legend className="text-sm font-semibold px-1">Mirror Journal Line</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="mirrorAccountId">Account ID</Label>
            <Input id="mirrorAccountId" name="mirrorAccountId" required placeholder="UUID" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mirrorDebit">Debit</Label>
            <Input
              id="mirrorDebit"
              name="mirrorDebit"
              type="text"
              inputMode="numeric"
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mirrorCredit">Credit</Label>
            <Input
              id="mirrorCredit"
              name="mirrorCredit"
              type="text"
              inputMode="numeric"
              placeholder="0"
            />
          </div>
        </div>
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create IC Transaction'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={routes.finance.icTransactions}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
