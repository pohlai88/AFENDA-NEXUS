'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateSupplierSchema, type CreateSupplier, type PaymentMethodType } from '@afenda/contracts';
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
import { Loader2 } from 'lucide-react';
import { EntityCombobox, type EntityOption } from '@/components/erp/entity-combobox';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { useReceipt } from '@/hooks/use-receipt';
import { searchCompanies } from '../actions/entity-search.actions';
import { createSupplierAction } from '../actions/ap-supplier.actions';
import { routes } from '@/lib/constants';

interface ApSupplierFormProps {
  defaultCompanyId?: string;
}

export function ApSupplierForm({ defaultCompanyId }: ApSupplierFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { isOpen, receipt, showReceipt, clearReceipt } = useReceipt();

  const [selectedCompany, setSelectedCompany] = useState<EntityOption | null>(null);

  const form = useForm<CreateSupplier>({
    resolver: zodResolver(CreateSupplierSchema),
    defaultValues: {
      companyId: defaultCompanyId ?? '',
      code: '',
      name: '',
      taxId: '',
      currencyCode: '',
      defaultPaymentMethod: null,
      whtRateId: null,
      remittanceEmail: '',
    },
  });

  function handleCompanyChange(opt: EntityOption | null) {
    setSelectedCompany(opt);
    form.setValue('companyId', opt?.id ?? '', { shouldValidate: true });
  }

  function handleSubmit(data: CreateSupplier) {
    setError(null);
    startTransition(async () => {
      const result = await createSupplierAction(data);
      if (result.ok) {
        showReceipt(result.value);
      } else {
        setError(result.error.message);
      }
    });
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Supplier Created"
        onClose={clearReceipt}
        viewHref={routes.finance.supplierDetail(receipt.resultRef)}
        backHref={routes.finance.suppliers}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Company <span className="text-destructive">*</span>
          </Label>
          <EntityCombobox
            value={selectedCompany}
            onChange={handleCompanyChange}
            loadOptions={(q) => searchCompanies(q)}
            placeholder="Select company"
            ariaLabel="Company"
            error={form.formState.errors.companyId?.message}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">
            Supplier Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="code"
            {...form.register('code')}
            placeholder="e.g. SUP-001"
            className="font-mono uppercase"
          />
          {form.formState.errors.code && (
            <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input id="name" {...form.register('name')} placeholder="Supplier legal name" />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currencyCode">
            Currency <span className="text-destructive">*</span>
          </Label>
          <Input
            id="currencyCode"
            {...form.register('currencyCode')}
            placeholder="e.g. USD, EUR"
            maxLength={3}
            className="uppercase"
          />
          {form.formState.errors.currencyCode && (
            <p className="text-xs text-destructive">{form.formState.errors.currencyCode.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID</Label>
          <Input id="taxId" {...form.register('taxId')} placeholder="Tax identification number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remittanceEmail">Remittance Email</Label>
          <Input
            id="remittanceEmail"
            type="email"
            {...form.register('remittanceEmail')}
            placeholder="remittance@supplier.com"
          />
          {form.formState.errors.remittanceEmail && (
            <p className="text-xs text-destructive">{form.formState.errors.remittanceEmail.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultPaymentMethod">Default Payment Method</Label>
        <Select
          value={form.watch('defaultPaymentMethod') ?? ''}
          onValueChange={(value) => form.setValue('defaultPaymentMethod', (value || null) as PaymentMethodType | null, { shouldValidate: true })}
        >
          <SelectTrigger id="defaultPaymentMethod" className="w-full">
            <SelectValue placeholder="Select payment method…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
            <SelectItem value="CHECK">Check</SelectItem>
            <SelectItem value="WIRE">Wire</SelectItem>
            <SelectItem value="SEPA">SEPA</SelectItem>
            <SelectItem value="LOCAL_TRANSFER">Local Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Supplier
        </Button>
      </div>
    </form>
  );
}
