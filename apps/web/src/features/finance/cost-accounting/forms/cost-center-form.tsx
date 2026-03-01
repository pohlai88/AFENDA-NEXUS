'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateCostCenterInputSchema, type CreateCostCenterInput } from '@afenda/contracts';
import { useReceipt } from '@/hooks/use-receipt';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import Link from 'next/link';

interface CostCenterFormProps {
  onSubmit: (data: CreateCostCenterInput) => Promise<ApiResult<CommandReceipt>>;
}

const typeOptions = [
  { value: 'production', label: 'Production' },
  { value: 'service', label: 'Service' },
  { value: 'administration', label: 'Administration' },
  { value: 'selling', label: 'Selling' },
] as const;

export function CostCenterForm({ onSubmit }: CostCenterFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<CreateCostCenterInput>({
    resolver: zodResolver(CreateCostCenterInputSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      type: 'production',
      parentId: undefined,
      managerId: undefined,
      budgetAmount: 0,
      currency: 'USD',
    },
  });

  async function handleSubmit(data: CreateCostCenterInput) {
    setSubmitting(true);
    setError(null);

    const result = await onSubmit(data);

    setSubmitting(false);

    if (result.ok) {
      showReceipt(result.value);
      idempotencyKeyRef.current = crypto.randomUUID();
    } else {
      setError(result.error.message);
    }
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Cost Center Created"
        onClose={clearReceipt}
        viewHref={routes.finance.costCenterDetail(receipt.resultRef)}
        backHref={routes.finance.costCenters}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {error && (
        <div role="alert" className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">Code *</Label>
          <Input
            id="code"
            placeholder="e.g. CC-PROD-01"
            {...form.register('code')}
          />
          {form.formState.errors.code && (
            <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="e.g. Production Line A"
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select
          value={form.watch('type')}
          onValueChange={(val) =>
            form.setValue('type', val as CreateCostCenterInput['type'], { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.type && (
          <p className="text-xs text-destructive">{form.formState.errors.type.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Purpose and scope of this cost center"
          rows={3}
          {...form.register('description')}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Budget Amount */}
        <div className="space-y-2">
          <Label htmlFor="budgetAmount">Budget Amount</Label>
          <Input
            id="budgetAmount"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            {...form.register('budgetAmount', { valueAsNumber: true })}
          />
          {form.formState.errors.budgetAmount && (
            <p className="text-xs text-destructive">{form.formState.errors.budgetAmount.message}</p>
          )}
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Input
            id="currency"
            placeholder="USD"
            maxLength={3}
            {...form.register('currency')}
          />
          {form.formState.errors.currency && (
            <p className="text-xs text-destructive">{form.formState.errors.currency.message}</p>
          )}
        </div>
      </div>

      {/* Parent ID (optional) */}
      <div className="space-y-2">
        <Label htmlFor="parentId">Parent Cost Center ID (optional)</Label>
        <Input
          id="parentId"
          placeholder="Select parent cost center"
          {...form.register('parentId')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t pt-6">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Cost Center'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={routes.finance.costCenters}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
