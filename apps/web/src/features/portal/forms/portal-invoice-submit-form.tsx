'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { routes } from '@/lib/constants';
import { submitInvoiceAction } from '../actions/portal.actions';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface InvoiceLine {
  description: string;
  quantity: string;
  unitPrice: string;
  taxCode: string;
}

const emptyLine: InvoiceLine = {
  description: '',
  quantity: '1',
  unitPrice: '0',
  taxCode: '',
};

interface PortalInvoiceSubmitFormProps {
  supplierId: string;
}

export function PortalInvoiceSubmitForm({ supplierId }: PortalInvoiceSubmitFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [lines, setLines] = useState<InvoiceLine[]>([{ ...emptyLine }]);

  function addLine() {
    setLines((prev) => [...prev, { ...emptyLine }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof InvoiceLine, value: string) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  }

  function handleSubmit() {
    setError(null);

    if (!invoiceNumber || !invoiceDate || !dueDate) {
      setError('Invoice number, date, and due date are required.');
      return;
    }

    if (lines.length === 0 || lines.every((l) => !l.description)) {
      setError('At least one line item with a description is required.');
      return;
    }

    startTransition(async () => {
      const result = await submitInvoiceAction(supplierId, {
        invoices: [
          {
            invoiceNumber,
            invoiceDate,
            dueDate,
            description,
            currencyCode,
            lines: lines
              .filter((l) => l.description)
              .map((l, i) => ({
                lineNumber: i + 1,
                description: l.description,
                quantity: parseFloat(l.quantity) || 1,
                unitPrice: parseFloat(l.unitPrice) || 0,
                taxCode: l.taxCode || null,
              })),
          },
        ],
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      router.push(routes.portal.invoices);
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currencyCode">Currency</Label>
              <Input
                id="currencyCode"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                placeholder="USD"
                maxLength={3}
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Invoice description (optional)"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Line
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                    placeholder="Line item description"
                  />
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(index, 'unitPrice', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Tax Code</Label>
                  <Input
                    value={line.taxCode}
                    onChange={(e) => updateLine(index, 'taxCode', e.target.value)}
                    placeholder="VAT"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(index)}
                  disabled={lines.length <= 1}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove line</span>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push(routes.portal.invoices)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Invoice
        </Button>
      </div>
    </div>
  );
}
