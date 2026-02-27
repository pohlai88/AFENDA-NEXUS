'use client';

import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateApInvoiceSchema, type CreateApInvoice } from '@afenda/contracts';
import { ApInvoiceLinesEditor } from '../blocks/ap-invoice-lines-editor';
import { useReceipt } from '@/hooks/use-receipt';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { EntityCombobox, type EntityOption } from '@/components/erp/entity-combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import {
  searchSuppliers,
  searchCompanies,
  searchLedgers,
} from '../actions/entity-search.actions';
import Link from 'next/link';

interface ApInvoiceFormProps {
  onSubmit: (data: CreateApInvoice) => Promise<ApiResult<CommandReceipt>>;
  defaultCompany?: EntityOption | null;
  defaultLedger?: EntityOption | null;
}

export function ApInvoiceForm({ onSubmit, defaultCompany, defaultLedger }: ApInvoiceFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();

  const idempotencyKeyRef = useRef(crypto.randomUUID());

  // ─── Entity selections (controlled outside react-hook-form) ─────────────
  const [selectedSupplier, setSelectedSupplier] = useState<EntityOption | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<EntityOption | null>(defaultCompany ?? null);
  const [selectedLedger, setSelectedLedger] = useState<EntityOption | null>(defaultLedger ?? null);

  const form = useForm<CreateApInvoice>({
    resolver: zodResolver(CreateApInvoiceSchema),
    defaultValues: {
      companyId: defaultCompany?.id ?? '',
      ledgerId: defaultLedger?.id ?? '',
      supplierId: '',
      invoiceNumber: '',
      supplierRef: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      currencyCode: '',
      description: '',
      poRef: '',
      receiptRef: '',
      lines: [
        { accountId: '', description: '', quantity: 1, unitPrice: 0, amount: 0, taxAmount: 0 },
      ],
    },
  });

  // ─── Entity change handlers (sync combobox → form values) ───────────────
  const handleSupplierChange = useCallback(
    (next: EntityOption | null) => {
      setSelectedSupplier(next);
      form.setValue('supplierId', next?.id ?? '', { shouldValidate: true });
    },
    [form]
  );

  const handleCompanyChange = useCallback(
    (next: EntityOption | null) => {
      setSelectedCompany(next);
      form.setValue('companyId', next?.id ?? '', { shouldValidate: true });
      // Reset ledger when company changes
      setSelectedLedger(null);
      form.setValue('ledgerId', '', { shouldValidate: true });
    },
    [form]
  );

  const handleLedgerChange = useCallback(
    (next: EntityOption | null) => {
      setSelectedLedger(next);
      form.setValue('ledgerId', next?.id ?? '', { shouldValidate: true });
    },
    [form]
  );

  const ledgerLoader = useCallback(
    (q: string) => searchLedgers(q, selectedCompany?.id),
    [selectedCompany?.id]
  );

  async function handleSubmit(data: CreateApInvoice) {
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
        title="AP Invoice Created"
        onClose={clearReceipt}
        viewHref={routes.finance.payableDetail(receipt.resultRef)}
        backHref={routes.finance.payables}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Row 1: Company + Ledger */}
      <div className="grid gap-4 sm:grid-cols-2">
        <EntityCombobox
          label="Company"
          value={selectedCompany}
          onChange={handleCompanyChange}
          loadOptions={searchCompanies}
          placeholder="Select company…"
          error={form.formState.errors.companyId?.message}
        />
        <EntityCombobox
          label="Ledger"
          value={selectedLedger}
          onChange={handleLedgerChange}
          loadOptions={ledgerLoader}
          placeholder="Select ledger…"
          disabled={!selectedCompany}
          description={!selectedCompany ? 'Select a company first' : undefined}
          error={form.formState.errors.ledgerId?.message}
        />
      </div>

      {/* Row 2: Invoice Number + Supplier */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">
            Invoice Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="invoiceNumber"
            {...form.register('invoiceNumber')}
            placeholder="e.g. INV-001"
          />
          {form.formState.errors.invoiceNumber && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.invoiceNumber.message}
            </p>
          )}
        </div>

        <EntityCombobox
          label="Supplier"
          value={selectedSupplier}
          onChange={handleSupplierChange}
          loadOptions={searchSuppliers}
          placeholder="Search suppliers…"
          createHref={undefined}
          error={form.formState.errors.supplierId?.message}
        />
      </div>

      {/* Row 3: Dates + Currency */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="invoiceDate">
            Invoice Date <span className="text-destructive">*</span>
          </Label>
          <Input id="invoiceDate" type="date" {...form.register('invoiceDate')} />
          {form.formState.errors.invoiceDate && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.invoiceDate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">
            Due Date <span className="text-destructive">*</span>
          </Label>
          <Input id="dueDate" type="date" {...form.register('dueDate')} />
          {form.formState.errors.dueDate && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.dueDate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currencyCode">
            Currency <span className="text-destructive">*</span>
          </Label>
          <Input
            id="currencyCode"
            {...form.register('currencyCode')}
            placeholder="e.g. USD, EUR, MYR"
            maxLength={3}
            className="uppercase"
          />
          {form.formState.errors.currencyCode && (
            <p className="text-xs text-destructive" role="alert">
              {form.formState.errors.currencyCode.message}
            </p>
          )}
        </div>
      </div>

      {/* Row 3: Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          {...form.register('description')}
          placeholder="Optional invoice description"
        />
      </div>

      {/* Row 4: References */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="supplierRef">Supplier Ref</Label>
          <Input
            id="supplierRef"
            {...form.register('supplierRef')}
            placeholder="Supplier reference"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="poRef">PO Reference</Label>
          <Input id="poRef" {...form.register('poRef')} placeholder="Purchase order ref" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="receiptRef">Receipt Ref</Label>
          <Input id="receiptRef" {...form.register('receiptRef')} placeholder="Goods receipt ref" />
        </div>
      </div>

      {/* Lines Editor */}
      <ApInvoiceLinesEditor form={form} />

      {error && (
        <div
          className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href={routes.finance.payables}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
