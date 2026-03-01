'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateDriverInputSchema, type CreateDriverInput } from '@afenda/contracts';
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

interface CostDriverFormProps {
  onSubmit: (data: CreateDriverInput) => Promise<ApiResult<CommandReceipt>>;
}

const driverTypeOptions = [
  { value: 'headcount', label: 'Headcount' },
  { value: 'square_footage', label: 'Square Footage' },
  { value: 'machine_hours', label: 'Machine Hours' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'custom', label: 'Custom' },
] as const;

export function CostDriverForm({ onSubmit }: CostDriverFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<CreateDriverInput>({
    resolver: zodResolver(CreateDriverInputSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      type: 'headcount',
      unit: '',
      effectiveFrom: new Date(),
    },
  });

  async function handleSubmit(data: CreateDriverInput) {
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
        title="Cost Driver Created"
        onClose={clearReceipt}
        backHref={routes.finance.costDrivers}
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
          <Input id="code" placeholder="e.g. HC" {...form.register('code')} />
          {form.formState.errors.code && (
            <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" placeholder="e.g. Headcount" {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
      </div>

      {/* Driver Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Driver Type *</Label>
        <Select
          value={form.watch('type')}
          onValueChange={(val) =>
            form.setValue('type', val as CreateDriverInput['type'], { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select driver type" />
          </SelectTrigger>
          <SelectContent>
            {driverTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Unit of Measure */}
        <div className="space-y-2">
          <Label htmlFor="unit">Unit of Measure *</Label>
          <Input id="unit" placeholder="e.g. FTE, sq ft, hours" {...form.register('unit')} />
          {form.formState.errors.unit && (
            <p className="text-xs text-destructive">{form.formState.errors.unit.message}</p>
          )}
        </div>

        {/* Effective From */}
        <div className="space-y-2">
          <Label htmlFor="effectiveFrom">Effective From *</Label>
          <Input
            id="effectiveFrom"
            type="date"
            {...form.register('effectiveFrom', { valueAsDate: true })}
          />
          {form.formState.errors.effectiveFrom && (
            <p className="text-xs text-destructive">{form.formState.errors.effectiveFrom.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What this driver measures and how it is used"
          rows={3}
          {...form.register('description')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t pt-6">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Cost Driver'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={routes.finance.costDrivers}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
