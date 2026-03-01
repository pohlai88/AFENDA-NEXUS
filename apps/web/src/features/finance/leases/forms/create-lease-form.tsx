'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EntityCombobox, type EntityOption } from '@/components/erp/entity-combobox';
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
import { Checkbox } from '@/components/ui/checkbox';
import { routes } from '@/lib/constants';
import type { LeaseType, AssetClass, PaymentFrequency } from '../types';
import { leaseTypeLabels, assetClassLabels, paymentFrequencyLabels } from '../types';

const CreateLeaseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  lessorName: z.string().min(1, 'Lessor name is required'),
  lessorId: z.string(),
  assetClass: z.string().min(1),
  assetDescription: z.string(),
  leaseType: z.string().min(1),
  commencementDate: z.string().min(1, 'Commencement date is required'),
  endDate: z.string().min(1, 'End date is required'),
  paymentAmount: z.coerce.number().min(0),
  paymentFrequency: z.string().min(1),
  currency: z.string().min(1, 'Currency is required').max(3),
  incrementalBorrowingRate: z.coerce.number().min(0),
  hasExtensionOption: z.boolean(),
  extensionPeriod: z.coerce.number().min(0),
  hasTerminationOption: z.boolean(),
  terminationPenalty: z.coerce.number().min(0),
  hasPurchaseOption: z.boolean(),
  purchasePrice: z.coerce.number().min(0),
  glAccountAsset: z.string().min(1, 'ROU asset account is required'),
  glAccountLiability: z.string().min(1, 'Liability account is required'),
  glAccountInterest: z.string().min(1, 'Interest account is required'),
  glAccountDepreciation: z.string().min(1, 'Depreciation account is required'),
});

interface CreateLeaseFormData {
  description: string;
  lessorName: string;
  lessorId: string;
  assetClass: AssetClass;
  assetDescription: string;
  leaseType: LeaseType;
  commencementDate: string;
  endDate: string;
  paymentAmount: number;
  paymentFrequency: PaymentFrequency;
  currency: string;
  incrementalBorrowingRate: number;
  hasExtensionOption: boolean;
  extensionPeriod: number;
  hasTerminationOption: boolean;
  terminationPenalty: number;
  hasPurchaseOption: boolean;
  purchasePrice: number;
  glAccountAsset: string;
  glAccountLiability: string;
  glAccountInterest: string;
  glAccountDepreciation: string;
}

interface CreateLeaseFormProps {
  onSubmit: (
    data: Record<string, unknown>
  ) => Promise<{ ok: true; leaseId: string; leaseNumber: string } | { ok: false; error: string }>;
}

const typeOptions = Object.entries(leaseTypeLabels).map(([value, label]) => ({ value, label }));
const classOptions = Object.entries(assetClassLabels).map(([value, label]) => ({ value, label }));
const freqOptions = Object.entries(paymentFrequencyLabels).map(([value, label]) => ({ value, label }));

export function CreateLeaseForm({ onSubmit }: CreateLeaseFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const [selectedLessor, setSelectedLessor] = useState<EntityOption | null>(null);
  const [selectedGlAsset, setSelectedGlAsset] = useState<EntityOption | null>(null);
  const [selectedGlLiability, setSelectedGlLiability] = useState<EntityOption | null>(null);
  const [selectedGlInterest, setSelectedGlInterest] = useState<EntityOption | null>(null);
  const [selectedGlDepreciation, setSelectedGlDepreciation] = useState<EntityOption | null>(null);

  const form = useForm<CreateLeaseFormData>({
    resolver: zodResolver(CreateLeaseSchema),
    defaultValues: {
      description: '',
      lessorName: '',
      lessorId: '',
      assetClass: 'property',
      assetDescription: '',
      leaseType: 'finance',
      commencementDate: '',
      endDate: '',
      paymentAmount: 0,
      paymentFrequency: 'monthly',
      currency: '',
      incrementalBorrowingRate: 0,
      hasExtensionOption: false,
      extensionPeriod: 0,
      hasTerminationOption: false,
      terminationPenalty: 0,
      hasPurchaseOption: false,
      purchasePrice: 0,
      glAccountAsset: '',
      glAccountLiability: '',
      glAccountInterest: '',
      glAccountDepreciation: '',
    },
  });

  async function handleSubmit(data: CreateLeaseFormData) {
    setSubmitting(true);
    setError(null);

    const result = await onSubmit({
      ...data,
      paymentAmount: Number(data.paymentAmount),
      incrementalBorrowingRate: Number(data.incrementalBorrowingRate),
      extensionPeriod: data.hasExtensionOption ? Number(data.extensionPeriod) : null,
      terminationPenalty: data.hasTerminationOption ? Number(data.terminationPenalty) : null,
      purchasePrice: data.hasPurchaseOption ? Number(data.purchasePrice) : null,
    });

    setSubmitting(false);

    if (result.ok) {
      showReceipt({
        commandId: idempotencyKeyRef.current,
        idempotencyKey: idempotencyKeyRef.current,
        resultRef: result.leaseId,
        completedAt: new Date().toISOString(),
      });
      idempotencyKeyRef.current = crypto.randomUUID();
    } else {
      setError(result.error);
    }
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Lease Created"
        onClose={clearReceipt}
        viewHref={routes.finance.leaseDetail(receipt.resultRef)}
        backHref={routes.finance.leases}
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
          <Label htmlFor="lessorName">Lessor Name *</Label>
          <Input id="lessorName" placeholder="e.g. ABC Leasing Corp" {...form.register('lessorName', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leaseType">Lease Type *</Label>
          <Select
            value={form.watch('leaseType')}
            onValueChange={(v) => form.setValue('leaseType', v as LeaseType, { shouldValidate: true })}
          >
            <SelectTrigger id="leaseType"><SelectValue /></SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="assetClass">Asset Class *</Label>
          <Select
            value={form.watch('assetClass')}
            onValueChange={(v) => form.setValue('assetClass', v as AssetClass, { shouldValidate: true })}
          >
            <SelectTrigger id="assetClass"><SelectValue /></SelectTrigger>
            <SelectContent>
              {classOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assetDescription">Asset Description *</Label>
          <Input id="assetDescription" placeholder="e.g. Office space, Floor 12" {...form.register('assetDescription', { required: true })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Lease Description</Label>
        <Textarea id="description" placeholder="Describe the lease arrangement..." rows={2} {...form.register('description')} />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="commencementDate">Commencement Date *</Label>
          <Input id="commencementDate" type="date" {...form.register('commencementDate', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date *</Label>
          <Input id="endDate" type="date" {...form.register('endDate', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Input id="currency" placeholder="e.g. USD" maxLength={3} {...form.register('currency', { required: true })} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="paymentAmount">Payment Amount *</Label>
          <Input id="paymentAmount" type="number" min="0" step="0.01" {...form.register('paymentAmount', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentFrequency">Payment Frequency *</Label>
          <Select
            value={form.watch('paymentFrequency')}
            onValueChange={(v) => form.setValue('paymentFrequency', v as PaymentFrequency, { shouldValidate: true })}
          >
            <SelectTrigger id="paymentFrequency"><SelectValue /></SelectTrigger>
            <SelectContent>
              {freqOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="incrementalBorrowingRate">IBR (%) *</Label>
          <Input id="incrementalBorrowingRate" type="number" min="0" step="0.01" {...form.register('incrementalBorrowingRate', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Lessor</Label>
          <EntityCombobox
            value={selectedLessor}
            onChange={(opt) => { setSelectedLessor(opt); form.setValue('lessorId', opt?.id ?? '', { shouldValidate: true }); }}
            loadOptions={async (_q) => []}
            placeholder="Select lessor…"
          />
        </div>
        <div className="space-y-2">
          <Label>GL Account — ROU Asset *</Label>
          <EntityCombobox
            value={selectedGlAsset}
            onChange={(opt) => { setSelectedGlAsset(opt); form.setValue('glAccountAsset', opt?.id ?? '', { shouldValidate: true }); }}
            loadOptions={async (_q) => []}
            placeholder="Select account…"
            error={form.formState.errors.glAccountAsset?.message}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>GL Account — Liability *</Label>
          <EntityCombobox
            value={selectedGlLiability}
            onChange={(opt) => { setSelectedGlLiability(opt); form.setValue('glAccountLiability', opt?.id ?? '', { shouldValidate: true }); }}
            loadOptions={async (_q) => []}
            placeholder="Select account…"
            error={form.formState.errors.glAccountLiability?.message}
          />
        </div>
        <div className="space-y-2">
          <Label>GL Account — Interest *</Label>
          <EntityCombobox
            value={selectedGlInterest}
            onChange={(opt) => { setSelectedGlInterest(opt); form.setValue('glAccountInterest', opt?.id ?? '', { shouldValidate: true }); }}
            loadOptions={async (_q) => []}
            placeholder="Select account…"
            error={form.formState.errors.glAccountInterest?.message}
          />
        </div>
        <div className="space-y-2">
          <Label>GL Account — Depreciation *</Label>
          <EntityCombobox
            value={selectedGlDepreciation}
            onChange={(opt) => { setSelectedGlDepreciation(opt); form.setValue('glAccountDepreciation', opt?.id ?? '', { shouldValidate: true }); }}
            loadOptions={async (_q) => []}
            placeholder="Select account…"
            error={form.formState.errors.glAccountDepreciation?.message}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="text-sm font-medium">Options (IFRS 16)</h3>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="hasExtensionOption"
              checked={form.watch('hasExtensionOption')}
              onCheckedChange={(checked) => form.setValue('hasExtensionOption', !!checked)}
            />
            <Label htmlFor="hasExtensionOption">Extension Option</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="hasTerminationOption"
              checked={form.watch('hasTerminationOption')}
              onCheckedChange={(checked) => form.setValue('hasTerminationOption', !!checked)}
            />
            <Label htmlFor="hasTerminationOption">Termination Option</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="hasPurchaseOption"
              checked={form.watch('hasPurchaseOption')}
              onCheckedChange={(checked) => form.setValue('hasPurchaseOption', !!checked)}
            />
            <Label htmlFor="hasPurchaseOption">Purchase Option</Label>
          </div>
        </div>

        {form.watch('hasExtensionOption') && (
          <div className="space-y-2">
            <Label htmlFor="extensionPeriod">Extension Period (months)</Label>
            <Input id="extensionPeriod" type="number" min="0" className="max-w-xs" {...form.register('extensionPeriod', { valueAsNumber: true })} />
          </div>
        )}
        {form.watch('hasTerminationOption') && (
          <div className="space-y-2">
            <Label htmlFor="terminationPenalty">Termination Penalty</Label>
            <Input id="terminationPenalty" type="number" min="0" step="0.01" className="max-w-xs" {...form.register('terminationPenalty', { valueAsNumber: true })} />
          </div>
        )}
        {form.watch('hasPurchaseOption') && (
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase Price</Label>
            <Input id="purchasePrice" type="number" min="0" step="0.01" className="max-w-xs" {...form.register('purchasePrice', { valueAsNumber: true })} />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Lease'}
        </Button>
      </div>
    </form>
  );
}
