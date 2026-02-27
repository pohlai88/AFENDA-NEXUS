'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';
import { batchImportInvoicesAction } from '../actions/ap-capture.actions';
import { Card, CardContent } from '@/components/ui/card';

const BatchImportFormSchema = z.object({
  csvData: z.string().min(1, 'Paste CSV data to import'),
});

type BatchImportValues = z.infer<typeof BatchImportFormSchema>;

export function ApBatchImportForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string } | null>(null);

  const form = useForm<BatchImportValues>({
    resolver: zodResolver(BatchImportFormSchema),
    defaultValues: { csvData: '' },
  });

  function handleSubmit(data: BatchImportValues) {
    setError(null);
    setResult(null);

    const lines = data.csvData.trim().split('\n');
    if (lines.length < 2) {
      setError('CSV must contain a header row and at least one data row.');
      return;
    }

    const headerLine = lines[0]!;
    const headers = headerLine.split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] ?? '';
      });
      return row;
    });

    startTransition(async () => {
      const res = await batchImportInvoicesAction({ rows });
      if (res.ok) {
        setResult({ message: `Import complete. Reference: ${res.value.resultRef}` });
        form.reset();
      } else {
        setError(res.error.message);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="csvData">
          CSV Data <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Paste CSV with headers: companyId, supplierId, ledgerId, invoiceNumber, invoiceDate, dueDate, currencyCode, description, amount
        </p>
        <Textarea
          id="csvData"
          {...form.register('csvData')}
          placeholder="companyId,supplierId,ledgerId,invoiceNumber,invoiceDate,dueDate,currencyCode,description,amount&#10;..."
          rows={12}
          className="font-mono text-xs"
        />
        {form.formState.errors.csvData && (
          <p className="text-xs text-destructive">{form.formState.errors.csvData.message}</p>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      )}

      {result && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-success">{result.message}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Import Invoices
        </Button>
      </div>
    </form>
  );
}
