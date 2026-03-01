'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateAllocationRunInputSchema,
  type CreateAllocationRunInput,
  AllocationMethodEnum,
} from '@afenda/contracts';
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
import type { ApiResult, CommandReceipt } from '@/lib/types';
import Link from 'next/link';

interface AllocationRunFormProps {
  onSubmit: (data: CreateAllocationRunInput) => Promise<ApiResult<CommandReceipt>>;
}

const methodOptions = [
  { value: 'direct', label: 'Direct Allocation' },
  { value: 'step_down', label: 'Step-Down' },
  { value: 'reciprocal', label: 'Reciprocal' },
  { value: 'activity_based', label: 'Activity-Based' },
] as const;

export function AllocationRunForm({ onSubmit }: AllocationRunFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<CreateAllocationRunInput>({
    resolver: zodResolver(CreateAllocationRunInputSchema),
    defaultValues: {
      period: new Date().toISOString().slice(0, 7), // YYYY-MM
      method: 'step_down',
      ruleIds: undefined,
    },
  });

  async function handleSubmit(data: CreateAllocationRunInput) {
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
        title="Allocation Run Completed"
        onClose={clearReceipt}
        viewHref={receipt.resultRef ? routes.finance.allocationDetail(receipt.resultRef) : undefined}
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

      {/* Period */}
      <div className="space-y-2">
        <Label htmlFor="period">Fiscal Period *</Label>
        <Input
          id="period"
          type="month"
          placeholder="YYYY-MM"
          {...form.register('period')}
        />
        {form.formState.errors.period && (
          <p className="text-xs text-destructive">{form.formState.errors.period.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          The allocation will apply to this fiscal period.
        </p>
      </div>

      {/* Method */}
      <div className="space-y-2">
        <Label htmlFor="method">Allocation Method *</Label>
        <Select
          value={form.watch('method')}
          onValueChange={(val) =>
            form.setValue('method', val as CreateAllocationRunInput['method'], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            {methodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Direct: one pass. Step-Down: ordered cascade. Reciprocal: iterative. Activity-Based: per
          activity pools.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t pt-6">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Running Allocation…' : 'Execute Allocation Run'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={routes.finance.costCenters}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
