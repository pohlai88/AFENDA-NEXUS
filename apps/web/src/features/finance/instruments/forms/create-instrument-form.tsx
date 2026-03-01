'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const CreateInstrumentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  instrumentType: z.string().min(1),
  classification: z.string().min(1),
  fairValueLevel: z.string().min(1),
  nominalAmount: z.number().min(0),
  currencyCode: z.string().min(1, 'Currency is required'),
  effectiveInterestRateBps: z.number().min(0),
  contractualRateBps: z.number().min(0),
  maturityDate: z.string().optional(),
  counterpartyId: z.string().min(1, 'Counterparty is required'),
  glAccountId: z.string().min(1, 'GL Account is required'),
});

type CreateInstrumentFormData = z.infer<typeof CreateInstrumentFormSchema>;

interface CreateInstrumentFormProps {
  onSubmit: (data: unknown) => Promise<ApiResult<CommandReceipt>>;
}

const typeOptions = [
  { value: 'DEBT_HELD', label: 'Debt Held' },
  { value: 'DEBT_ISSUED', label: 'Debt Issued' },
  { value: 'EQUITY_INVESTMENT', label: 'Equity Investment' },
  { value: 'DERIVATIVE', label: 'Derivative' },
  { value: 'LOAN_RECEIVABLE', label: 'Loan Receivable' },
  { value: 'TRADE_RECEIVABLE', label: 'Trade Receivable' },
] as const;

const classificationOptions = [
  { value: 'AMORTIZED_COST', label: 'Amortized Cost' },
  { value: 'FVOCI', label: 'FVOCI' },
  { value: 'FVTPL', label: 'FVTPL' },
] as const;

const fairValueLevelOptions = [
  { value: 'LEVEL_1', label: 'Level 1' },
  { value: 'LEVEL_2', label: 'Level 2' },
  { value: 'LEVEL_3', label: 'Level 3' },
] as const;

export function CreateInstrumentForm({ onSubmit }: CreateInstrumentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const form = useForm<CreateInstrumentFormData>({
    resolver: zodResolver(CreateInstrumentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      instrumentType: 'DEBT_HELD',
      classification: 'AMORTIZED_COST',
      fairValueLevel: 'LEVEL_1',
      nominalAmount: 0,
      currencyCode: '',
      effectiveInterestRateBps: 0,
      contractualRateBps: 0,
      counterpartyId: '',
      glAccountId: '',
    },
  });

  async function handleSubmit(data: CreateInstrumentFormData) {
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
        title="Instrument Created"
        onClose={clearReceipt}
        viewHref={routes.finance.instrumentDetail(receipt.resultRef)}
        backHref={routes.finance.instruments}
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
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" placeholder="e.g. Treasury Bonds 2028" {...form.register('name', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instrumentType">Instrument Type *</Label>
          <Select
            value={form.watch('instrumentType')}
            onValueChange={(v) => form.setValue('instrumentType', v, { shouldValidate: true })}
          >
            <SelectTrigger id="instrumentType"><SelectValue /></SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe the instrument..." rows={2} {...form.register('description')} />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="classification">Classification *</Label>
          <Select
            value={form.watch('classification')}
            onValueChange={(v) => form.setValue('classification', v, { shouldValidate: true })}
          >
            <SelectTrigger id="classification"><SelectValue /></SelectTrigger>
            <SelectContent>
              {classificationOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fairValueLevel">Fair Value Level</Label>
          <Select
            value={form.watch('fairValueLevel')}
            onValueChange={(v) => form.setValue('fairValueLevel', v, { shouldValidate: true })}
          >
            <SelectTrigger id="fairValueLevel"><SelectValue /></SelectTrigger>
            <SelectContent>
              {fairValueLevelOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currencyCode">Currency *</Label>
          <Input id="currencyCode" placeholder="USD" maxLength={3} {...form.register('currencyCode', { required: true })} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="nominalAmount">Nominal Amount *</Label>
          <Input id="nominalAmount" type="number" min="0" {...form.register('nominalAmount', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="effectiveInterestRateBps">Effective Rate (bps)</Label>
          <Input id="effectiveInterestRateBps" type="number" min="0" {...form.register('effectiveInterestRateBps', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractualRateBps">Contractual Rate (bps)</Label>
          <Input id="contractualRateBps" type="number" min="0" {...form.register('contractualRateBps', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="maturityDate">Maturity Date</Label>
          <Input id="maturityDate" type="date" {...form.register('maturityDate')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="counterpartyId">Counterparty ID *</Label>
          <Input id="counterpartyId" placeholder="Select entity" {...form.register('counterpartyId', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="glAccountId">GL Account ID *</Label>
          <Input id="glAccountId" placeholder="Select entity" {...form.register('glAccountId', { required: true })} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Instrument'}
        </Button>
      </div>
    </form>
  );
}
