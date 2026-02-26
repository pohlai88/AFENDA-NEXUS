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
import { Switch } from '@/components/ui/switch';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import Link from 'next/link';

// ─── Validation Schema ──────────────────────────────────────────────────────

const AccountFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Account code is required')
    .max(20, 'Account code must be 20 characters or fewer'),
  name: z
    .string()
    .min(1, 'Account name is required')
    .max(100, 'Account name must be 100 characters or fewer'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], {
    required_error: 'Account type is required',
  }),
  normalBalance: z.enum(['DEBIT', 'CREDIT'], {
    required_error: 'Normal balance is required',
  }),
  isActive: z.boolean(),
});

export type AccountFormValues = z.infer<typeof AccountFormSchema>;

// ─── Component ──────────────────────────────────────────────────────────────

interface AccountFormProps {
  onSubmit: (data: AccountFormValues) => Promise<ApiResult<CommandReceipt>>;
  defaultValues?: Partial<AccountFormValues>;
  submitLabel?: string;
}

const ACCOUNT_TYPES = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' },
] as const;

const NORMAL_BALANCES = [
  { value: 'DEBIT', label: 'Debit' },
  { value: 'CREDIT', label: 'Credit' },
] as const;

export function AccountForm({
  onSubmit,
  defaultValues,
  submitLabel = 'Create Account',
}: AccountFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: {
      code: '',
      name: '',
      type: undefined,
      normalBalance: undefined,
      isActive: true,
      ...defaultValues,
    },
  });

  async function handleSubmit(data: AccountFormValues) {
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
        title="Account Created Successfully"
        onClose={clearReceipt}
        viewHref={routes.finance.accountDetail(receipt.resultRef)}
        backHref={routes.finance.accounts}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">
            Account Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="code"
            {...form.register('code')}
            placeholder="e.g. 1000"
            className="font-mono"
          />
          {form.formState.errors.code && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.code.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">
            Account Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            {...form.register('name')}
            placeholder="e.g. Cash and Cash Equivalents"
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Account Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch('type')}
            onValueChange={(val) =>
              form.setValue('type', val as AccountFormValues['type'], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.type && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.type.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Normal Balance <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch('normalBalance')}
            onValueChange={(val) =>
              form.setValue('normalBalance', val as AccountFormValues['normalBalance'], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select normal balance" />
            </SelectTrigger>
            <SelectContent>
              {NORMAL_BALANCES.map((nb) => (
                <SelectItem key={nb.value} value={nb.value}>
                  {nb.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.normalBalance && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.normalBalance.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="isActive"
          checked={form.watch('isActive')}
          onCheckedChange={(checked) => form.setValue('isActive', checked)}
        />
        <Label htmlFor="isActive">Active</Label>
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
          <Link href={routes.finance.accounts}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
