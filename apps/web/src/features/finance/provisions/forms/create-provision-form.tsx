'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProvisionInputSchema, type CreateProvisionInput } from '@afenda/contracts';
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

interface CreateProvisionFormProps {
  onSubmit: (data: CreateProvisionInput) => Promise<ApiResult<CommandReceipt>>;
}

const typeOptions = [
  { value: 'warranty', label: 'Warranty' },
  { value: 'restructuring', label: 'Restructuring' },
  { value: 'legal', label: 'Legal' },
  { value: 'decommissioning', label: 'Decommissioning' },
  { value: 'onerous_contract', label: 'Onerous Contract' },
  { value: 'other', label: 'Other' },
] as const;

export function CreateProvisionForm({ onSubmit }: CreateProvisionFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<CreateProvisionInput>({
    resolver: zodResolver(CreateProvisionInputSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'warranty',
      initialAmount: 0,
      currency: 'USD',
      glAccountId: '',
      costCenterId: undefined,
      discountRate: undefined,
    },
  });

  async function handleSubmit(data: CreateProvisionInput) {
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
        title="Provision Created"
        onClose={clearReceipt}
        viewHref={routes.finance.provisionDetail(receipt.resultRef)}
        backHref={routes.finance.provisions}
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
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" placeholder="e.g. Product Warranty Reserve" {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={form.watch('type')}
            onValueChange={(v) => form.setValue('type', v as CreateProvisionInput['type'], { shouldValidate: true })}
          >
            <SelectTrigger id="type">
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
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe the provision and its basis..."
          rows={3}
          {...form.register('description')}
        />
        {form.formState.errors.description && (
          <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {/* Initial Amount */}
        <div className="space-y-2">
          <Label htmlFor="initialAmount">Initial Amount *</Label>
          <Input
            id="initialAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 500000"
            {...form.register('initialAmount', { valueAsNumber: true })}
          />
          {form.formState.errors.initialAmount && (
            <p className="text-xs text-destructive">{form.formState.errors.initialAmount.message}</p>
          )}
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Input id="currency" placeholder="USD" maxLength={3} {...form.register('currency')} />
          {form.formState.errors.currency && (
            <p className="text-xs text-destructive">{form.formState.errors.currency.message}</p>
          )}
        </div>

        {/* Discount Rate */}
        <div className="space-y-2">
          <Label htmlFor="discountRate">Discount Rate (%)</Label>
          <Input
            id="discountRate"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 5.0"
            {...form.register('discountRate', { valueAsNumber: true })}
          />
          {form.formState.errors.discountRate && (
            <p className="text-xs text-destructive">{form.formState.errors.discountRate.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Recognition Date */}
        <div className="space-y-2">
          <Label htmlFor="recognitionDate">Recognition Date *</Label>
          <Input id="recognitionDate" type="date" {...form.register('recognitionDate')} />
          {form.formState.errors.recognitionDate && (
            <p className="text-xs text-destructive">{form.formState.errors.recognitionDate.message}</p>
          )}
        </div>

        {/* Expected Settlement Date */}
        <div className="space-y-2">
          <Label htmlFor="expectedSettlementDate">Expected Settlement Date</Label>
          <Input id="expectedSettlementDate" type="date" {...form.register('expectedSettlementDate')} />
          {form.formState.errors.expectedSettlementDate && (
            <p className="text-xs text-destructive">{form.formState.errors.expectedSettlementDate.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* GL Account */}
        <div className="space-y-2">
          <Label htmlFor="glAccountId">GL Account ID *</Label>
          <Input id="glAccountId" placeholder="Select GL account" {...form.register('glAccountId')} />
          {form.formState.errors.glAccountId && (
            <p className="text-xs text-destructive">{form.formState.errors.glAccountId.message}</p>
          )}
        </div>

        {/* Cost Center */}
        <div className="space-y-2">
          <Label htmlFor="costCenterId">Cost Center ID</Label>
          <Input id="costCenterId" placeholder="Select cost center (optional)" {...form.register('costCenterId')} />
          {form.formState.errors.costCenterId && (
            <p className="text-xs text-destructive">{form.formState.errors.costCenterId.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Provision'}
        </Button>
      </div>
    </form>
  );
}
