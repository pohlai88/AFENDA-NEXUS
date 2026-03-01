'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePaymentRunSchema, type CreatePaymentRun } from '@afenda/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { EntityCombobox, type EntityOption } from '@/components/erp/entity-combobox';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { useReceipt } from '@/hooks/use-receipt';
import { searchCompanies } from '../actions/entity-search.actions';
import { createPaymentRunAction, getPaymentProposalAction } from '../actions/ap-payment-run.actions';
import { routes } from '@/lib/constants';
import type { PaymentProposalResponse } from '../queries/ap-payment-run.queries';

interface ApPaymentRunFormProps {
  defaultCompanyId?: string;
}

export function ApPaymentRunForm({ defaultCompanyId }: ApPaymentRunFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<PaymentProposalResponse | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
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

      {form.watch('companyId') && form.watch('runDate') && form.watch('cutoffDate') && form.watch('currencyCode') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" aria-hidden />
              Suggest invoices
            </CardTitle>
            <CardDescription>
              Get suggested invoices based on due date and early payment discount eligibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={proposalLoading}
              onClick={async () => {
                setProposalLoading(true);
                setProposal(null);
                const result = await getPaymentProposalAction({
                  companyId: form.getValues('companyId'),
                  runDate: form.getValues('runDate'),
                  cutoffDate: form.getValues('cutoffDate'),
                  currencyCode: form.getValues('currencyCode').toUpperCase(),
                  includeDiscountOpportunities: true,
                });
                setProposalLoading(false);
                if (result.ok) setProposal(result.value);
              }}
            >
              {proposalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get suggestion
            </Button>
            {proposal && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">
                  {proposal.summary.totalInvoices} invoices suggested across {proposal.summary.totalGroups} suppliers
                </p>
                <p className="text-muted-foreground">
                  Total net: {(Number(proposal.summary.totalNet) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} {proposal.summary.totalGroups > 0 ? proposal.groups[0]?.currencyCode : ''}
                  {Number(proposal.summary.discountSavings) > 0 && (
                    <> · Discount savings: {(Number(proposal.summary.discountSavings) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
