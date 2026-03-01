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
import type { IntangibleType, AmortizationMethod } from '../types';
import { intangibleTypeLabels, amortizationMethodLabels } from '../types';

const CreateIntangibleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  categoryId: z.string().min(1, 'Category is required'),
  intangibleType: z.string().min(1),
  acquisitionDate: z.string().min(1, 'Acquisition date is required'),
  amortizationStartDate: z.string().min(1, 'Amortization start date is required'),
  originalCost: z.coerce.number().min(0),
  residualValue: z.coerce.number().min(0),
  usefulLifeMonths: z.coerce.number().int().min(0),
  amortizationMethod: z.string().min(1),
  currency: z.string().min(1, 'Currency is required').max(3),
  hasIndefiniteLife: z.boolean(),
  isInternallyGenerated: z.boolean(),
  developmentPhase: z.string(),
  patentNumber: z.string(),
  registrationNumber: z.string(),
  expiryDate: z.string(),
});

interface CreateIntangibleFormData {
  name: string;
  description: string;
  categoryId: string;
  intangibleType: IntangibleType;
  acquisitionDate: string;
  amortizationStartDate: string;
  originalCost: number;
  residualValue: number;
  usefulLifeMonths: number;
  amortizationMethod: AmortizationMethod;
  currency: string;
  hasIndefiniteLife: boolean;
  isInternallyGenerated: boolean;
  developmentPhase: string;
  patentNumber: string;
  registrationNumber: string;
  expiryDate: string;
}

interface CreateIntangibleFormProps {
  onSubmit: (
    data: unknown
  ) => Promise<{ ok: true; data: { id: string; assetNumber: string } } | { ok: false; error: string }>;
}

const typeOptions = Object.entries(intangibleTypeLabels).map(([value, label]) => ({
  value: value as IntangibleType,
  label,
}));

const methodOptions = Object.entries(amortizationMethodLabels).map(([value, label]) => ({
  value: value as AmortizationMethod,
  label,
}));

export function CreateIntangibleForm({ onSubmit }: CreateIntangibleFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const [selectedCategory, setSelectedCategory] = useState<EntityOption | null>(null);

  const form = useForm<CreateIntangibleFormData>({
    resolver: zodResolver(CreateIntangibleSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      intangibleType: 'software',
      acquisitionDate: '',
      amortizationStartDate: '',
      originalCost: 0,
      residualValue: 0,
      usefulLifeMonths: 60,
      amortizationMethod: 'straight_line',
      currency: '',
      hasIndefiniteLife: false,
      isInternallyGenerated: false,
      developmentPhase: '',
      patentNumber: '',
      registrationNumber: '',
      expiryDate: '',
    },
  });

  const hasIndefiniteLife = form.watch('hasIndefiniteLife');

  async function handleSubmit(data: CreateIntangibleFormData) {
    setSubmitting(true);
    setError(null);

    const result = await onSubmit({
      ...data,
      originalCost: Number(data.originalCost),
      residualValue: Number(data.residualValue),
      usefulLifeMonths: Number(data.usefulLifeMonths),
      expiryDate: data.expiryDate || null,
      developmentPhase: data.developmentPhase || null,
      patentNumber: data.patentNumber || null,
      registrationNumber: data.registrationNumber || null,
    });

    setSubmitting(false);

    if (result.ok) {
      showReceipt({
        commandId: idempotencyKeyRef.current,
        idempotencyKey: idempotencyKeyRef.current,
        resultRef: result.data.id,
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
        title="Intangible Asset Created"
        onClose={clearReceipt}
        viewHref={routes.finance.intangibleDetail(receipt.resultRef)}
        backHref={routes.finance.intangibles}
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
          <Input id="name" placeholder="e.g. SAP ERP License" {...form.register('name', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="intangibleType">Type *</Label>
          <Select
            value={form.watch('intangibleType')}
            onValueChange={(v) => form.setValue('intangibleType', v as IntangibleType, { shouldValidate: true })}
          >
            <SelectTrigger id="intangibleType"><SelectValue /></SelectTrigger>
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
        <Textarea id="description" placeholder="Describe the asset..." rows={2} {...form.register('description')} />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="originalCost">Original Cost *</Label>
          <Input id="originalCost" type="number" min="0" step="0.01" {...form.register('originalCost', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="residualValue">Residual Value</Label>
          <Input id="residualValue" type="number" min="0" step="0.01" {...form.register('residualValue', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Input id="currency" placeholder="e.g. USD" maxLength={3} {...form.register('currency', { required: true })} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="acquisitionDate">Acquisition Date *</Label>
          <Input id="acquisitionDate" type="date" {...form.register('acquisitionDate', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amortizationStartDate">Amortization Start *</Label>
          <Input id="amortizationStartDate" type="date" {...form.register('amortizationStartDate', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input id="expiryDate" type="date" {...form.register('expiryDate')} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="amortizationMethod">Amortization Method *</Label>
          <Select
            value={form.watch('amortizationMethod')}
            onValueChange={(v) => form.setValue('amortizationMethod', v as AmortizationMethod, { shouldValidate: true })}
          >
            <SelectTrigger id="amortizationMethod"><SelectValue /></SelectTrigger>
            <SelectContent>
              {methodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="usefulLifeMonths">Useful Life (months)</Label>
          <Input
            id="usefulLifeMonths"
            type="number"
            min="0"
            disabled={hasIndefiniteLife}
            {...form.register('usefulLifeMonths', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label>Category *</Label>
          <EntityCombobox
            value={selectedCategory}
            onChange={(opt) => {
              setSelectedCategory(opt);
              form.setValue('categoryId', opt?.id ?? '', { shouldValidate: true });
            }}
            loadOptions={async (_q) => {
              // TODO: wire to searchCategories server action
              return [];
            }}
            placeholder="Select category…"
            error={form.formState.errors.categoryId?.message}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="patentNumber">Patent Number</Label>
          <Input id="patentNumber" placeholder="Optional" {...form.register('patentNumber')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input id="registrationNumber" placeholder="Optional" {...form.register('registrationNumber')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="developmentPhase">Development Phase</Label>
          <Input id="developmentPhase" placeholder="e.g. Research, Development" {...form.register('developmentPhase')} />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Checkbox
            id="hasIndefiniteLife"
            checked={hasIndefiniteLife}
            onCheckedChange={(checked) => form.setValue('hasIndefiniteLife', !!checked)}
          />
          <Label htmlFor="hasIndefiniteLife">Indefinite Useful Life</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="isInternallyGenerated"
            checked={form.watch('isInternallyGenerated')}
            onCheckedChange={(checked) => form.setValue('isInternallyGenerated', !!checked)}
          />
          <Label htmlFor="isInternallyGenerated">Internally Generated (IAS 38)</Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Intangible Asset'}
        </Button>
      </div>
    </form>
  );
}
