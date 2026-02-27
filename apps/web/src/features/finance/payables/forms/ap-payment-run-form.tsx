'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePaymentRunSchema, type CreatePaymentRun } from '@afenda/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { EntityCombobox, type EntityOption } from '@/components/erp/entity-combobox';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { useReceipt } from '@/hooks/use-receipt';
import { searchCompanies } from '../actions/entity-search.actions';
import { createPaymentRunAction } from '../actions/ap-payment-run.actions';
import { routes } from '@/lib/constants';

interface ApPaymentRunFormProps {
  defaultCompanyId?: string;
}

export function ApPaymentRunForm({ defaultCompanyId }: ApPaymentRunFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { isOpen, receipt, showReceipt, clearReceipt } = useReceipt();

  const [selectedCompany, setSelectedCompany] = useState<EntityOption | null>(null);

  const form = useForm<CreatePaymentRun>({
    resolver: zodResolver(CreatePaymentRunSchema),
    defaultValues: {
      companyId: defaultCompanyId ?? '',
      runDate: new Date().toISOString().split('T')[0],
      cutoffDate: new Date().toISOString().split('T')[0],
      currencyCode: '',
    },
  });

  function handleCompanyChange(opt: EntityOption | null) {
    setSelectedCompany(opt);
    form.setValue('companyId', opt?.id ?? '', { shouldValidate: true });
  }

  function handleSubmit(data: CreatePaymentRun) {
    setError(null);
    startTransition(async () => {
      const result = await createPaymentRunAction(data);
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
        title="Payment Run Created"
        onClose={clearReceipt}
        viewHref={routes.finance.paymentRunDetail(receipt.resultRef)}
        backHref={routes.finance.paymentRuns}
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
          <Label htmlFor="runDate">
            Run Date <span className="text-destructive">*</span>
          </Label>
          <Input id="runDate" type="date" {...form.register('runDate')} />
          {form.formState.errors.runDate && (
            <p className="text-xs text-destructive">{form.formState.errors.runDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cutoffDate">
            Cutoff Date <span className="text-destructive">*</span>
          </Label>
          <Input id="cutoffDate" type="date" {...form.register('cutoffDate')} />
          {form.formState.errors.cutoffDate && (
            <p className="text-xs text-destructive">{form.formState.errors.cutoffDate.message}</p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Payment Run
        </Button>
      </div>
    </form>
  );
}
