'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useReceipt } from '@/hooks/use-receipt';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt, CompanyContext } from '@/lib/types';
import Link from 'next/link';

// ─── Validation Schema ──────────────────────────────────────────────────────

const LedgerFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Ledger name is required')
    .max(100, 'Ledger name must be 100 characters or fewer'),
  companyId: z.string().min(1, 'Company is required'),
  baseCurrencyCode: z.string().min(1, 'Base currency is required'),
});

export type LedgerFormValues = z.infer<typeof LedgerFormSchema>;

// ─── Currency Options ────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
] as const;

// ─── Component ──────────────────────────────────────────────────────────────

interface LedgerFormProps {
  onSubmit: (data: LedgerFormValues) => Promise<ApiResult<CommandReceipt>>;
  companies: CompanyContext[];
  defaultValues?: Partial<LedgerFormValues>;
  submitLabel?: string;
}

export function LedgerForm({
  onSubmit,
  companies,
  defaultValues,
  submitLabel = 'Create Ledger',
}: LedgerFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  const form = useForm<LedgerFormValues>({
    resolver: zodResolver(LedgerFormSchema),
    defaultValues: {
      name: '',
      companyId: '',
      baseCurrencyCode: '',
      ...defaultValues,
    },
  });

  async function handleSubmit(data: LedgerFormValues) {
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
        title="Ledger Created Successfully"
        onClose={clearReceipt}
        viewHref={routes.finance.ledgerDetail(receipt.resultRef)}
        backHref={routes.finance.ledgers}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Ledger Name <span className="text-destructive">*</span>
        </Label>
        <Input id="name" {...form.register('name')} placeholder="e.g. General Ledger" />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive" role="alert">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Company <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch('companyId')}
            onValueChange={(val) => form.setValue('companyId', val, { shouldValidate: true })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.companyId && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.companyId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Base Currency <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch('baseCurrencyCode')}
            onValueChange={(val) =>
              form.setValue('baseCurrencyCode', val, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.baseCurrencyCode && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.baseCurrencyCode.message}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div
          className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={routes.finance.ledgers}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
