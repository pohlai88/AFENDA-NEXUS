'use client';

/**
 * PortalCreditDebitNoteForm — CAP-CRDB (SP-6011)
 *
 * Client component that lets a supplier submit a credit note or debit note
 * against an existing invoice.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, MinusCircle, PlusCircle } from 'lucide-react';
import { routes } from '@/lib/constants';

// ─── Types ─────────────────────────────────────────────────────────────────────

type DocumentType = 'CREDIT_NOTE' | 'DEBIT_NOTE';

interface FormState {
  documentType: DocumentType;
  originalInvoiceId: string;
  noteNumber: string;
  noteDate: string;
  reason: string;
  adjustmentAmountMinorUnit: string;
  currencyCode: string;
  poRef: string;
}

const DEFAULT_FORM: FormState = {
  documentType: 'CREDIT_NOTE',
  originalInvoiceId: '',
  noteNumber: '',
  noteDate: new Date().toISOString().slice(0, 10),
  reason: '',
  adjustmentAmountMinorUnit: '',
  currencyCode: '', // Must be set from invoice data — no hardcoded default
  poRef: '',
};

// ─── Helper ────────────────────────────────────────────────────────────────────

function formatMinorUnit(minorUnit: string, currency: string): string {
  const n = parseInt(minorUnit, 10);
  if (isNaN(n)) return '';
  return (n / 100).toLocaleString('en-US', { style: 'currency', currency });
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface PortalCreditDebitNoteFormProps {
  supplierId: string;
  supplierName: string;
}

export function PortalCreditDebitNoteForm({ supplierId }: PortalCreditDebitNoteFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; noteNumber: string } | null>(null);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Simple client-side validation
      if (!form.originalInvoiceId.trim()) {
        setSubmitError('Original invoice ID is required.');
        return;
      }
      if (!form.noteNumber.trim() || !form.reason.trim()) {
        setSubmitError('Note number and reason are required.');
        return;
      }
      const amount = parseInt(form.adjustmentAmountMinorUnit, 10);
      if (isNaN(amount) || amount <= 0) {
        setSubmitError('Adjustment amount must be a positive integer in minor units (e.g. cents).');
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const res = await fetch(`/api/portal/suppliers/${supplierId}/invoices/credit-debit-note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentType: form.documentType,
            originalInvoiceId: form.originalInvoiceId.trim(),
            noteNumber: form.noteNumber.trim(),
            noteDate: form.noteDate,
            reason: form.reason.trim(),
            adjustmentAmountMinorUnit: String(amount),
            currencyCode: form.currencyCode,
            poRef: form.poRef.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error?.message ?? `Server error: ${res.status}`);
        }

        const data = await res.json();
        setSuccess({ id: data.id, noteNumber: data.noteNumber });
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Submission failed');
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, supplierId]
  );

  if (success) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <h2 className="text-lg font-semibold">
              {form.documentType === 'CREDIT_NOTE' ? 'Credit Note' : 'Debit Note'} Submitted
            </h2>
            <p className="text-sm text-muted-foreground">
              Note number <span className="font-mono font-medium">{success.noteNumber}</span> has
              been submitted and created as a DRAFT — ID:{' '}
              <span className="font-mono">{success.id.slice(0, 8)}…</span>
            </p>
            <div className="mt-4 flex gap-3">
              <Button variant="outline" onClick={() => router.push(routes.portal.invoices)}>
                View invoices
              </Button>
              <Button
                onClick={() => {
                  setSuccess(null);
                  setForm(DEFAULT_FORM);
                }}
              >
                Submit another
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isCreditNote = form.documentType === 'CREDIT_NOTE';
  const formattedAmount = formatMinorUnit(form.adjustmentAmountMinorUnit, form.currencyCode);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {isCreditNote ? (
            <MinusCircle className="h-5 w-5 text-blue-600" />
          ) : (
            <PlusCircle className="h-5 w-5 text-warning" />
          )}
          <div>
            <CardTitle className="text-base">
              {isCreditNote ? 'Credit Note' : 'Debit Note'} Details
            </CardTitle>
            <CardDescription>
              {isCreditNote
                ? 'Reduces the amount owed on the original invoice.'
                : 'Increases the amount owed on the original invoice.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Document type */}
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select
              value={form.documentType}
              onValueChange={(v) => set('documentType', v as DocumentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREDIT_NOTE">
                  <span className="flex items-center gap-2">
                    <MinusCircle className="h-4 w-4 text-blue-600" />
                    Credit Note
                  </span>
                </SelectItem>
                <SelectItem value="DEBIT_NOTE">
                  <span className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-warning" />
                    Debit Note
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Original invoice */}
          <div className="space-y-2">
            <Label htmlFor="originalInvoiceId">
              Original Invoice ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="originalInvoiceId"
              placeholder="Invoice ID from your invoice list"
              value={form.originalInvoiceId}
              onChange={(e) => set('originalInvoiceId', e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Find this in the invoice detail page URL or your invoice list.
            </p>
          </div>

          {/* Note number + date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="noteNumber">
                Note Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="noteNumber"
                placeholder="e.g. CN-2025-001"
                value={form.noteNumber}
                onChange={(e) => set('noteNumber', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noteDate">
                Note Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="noteDate"
                type="date"
                value={form.noteDate}
                onChange={(e) => set('noteDate', e.target.value)}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why this credit/debit note is being issued…"
              rows={3}
              value={form.reason}
              onChange={(e) => set('reason', e.target.value)}
            />
          </div>

          {/* Amount + currency */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount">
                Adjustment Amount (minor units) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  placeholder="e.g. 12500 for $125.00"
                  value={form.adjustmentAmountMinorUnit}
                  onChange={(e) =>
                    set('adjustmentAmountMinorUnit', e.target.value.replace(/\D/g, ''))
                  }
                  className="pr-24"
                />
                {formattedAmount && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    = {formattedAmount}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Enter as integer minor units (cents for USD). No decimals.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={form.currencyCode} onValueChange={(v) => set('currencyCode', v)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'THB'].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PO ref (optional) */}
          <div className="space-y-2">
            <Label htmlFor="poRef">PO Reference (optional)</Label>
            <Input
              id="poRef"
              placeholder="e.g. PO-2025-001"
              value={form.poRef}
              onChange={(e) => set('poRef', e.target.value)}
            />
          </div>

          {/* Summary badge */}
          {form.adjustmentAmountMinorUnit && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
              <Badge variant={isCreditNote ? 'secondary' : 'outline'}>
                {isCreditNote ? 'Credit' : 'Debit'}
              </Badge>
              <span className="text-sm">
                {isCreditNote ? '↓ Reduces' : '↑ Increases'} payable by{' '}
                <span className="font-semibold">{formattedAmount || '—'}</span>
              </span>
            </div>
          )}

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? 'Submitting…'
                : `Submit ${isCreditNote ? 'Credit Note' : 'Debit Note'}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
