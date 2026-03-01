'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, GitMerge } from 'lucide-react';
import { EntityCombobox, type EntityOption } from '@/components/erp/entity-combobox';
import { searchSuppliers } from '../actions/entity-search.actions';
import { reconcileSupplierStatementAction } from '../actions/ap-capture.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReconFormSchema = z.object({
  supplierId: z.string().uuid('Select a supplier'),
  asOfDate: z.string().date(),
  statementCsv: z.string().min(1, 'Paste statement lines'),
  dateTolerance: z.coerce.number().int().min(0).max(30).default(3),
});

type ReconFormValues = z.infer<typeof ReconFormSchema>;

export function ApSupplierReconForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ matched: number; unmatched: number } | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<EntityOption | null>(null);

  const form = useForm<ReconFormValues>({
    resolver: zodResolver(ReconFormSchema),
    defaultValues: {
      supplierId: '',
      asOfDate: new Date().toISOString().split('T')[0],
      statementCsv: '',
      dateTolerance: 3,
    },
  });

  function handleSubmit(data: ReconFormValues) {
    setError(null);
    setResult(null);

    const lines = data.statementCsv.trim().split('\n');
    const statementLines = lines.map((line) => {
      const [lineRef, date, description, amount, currencyCode] = line.split(',').map((v) => v.trim());
      return { lineRef, date, description, amount: Number(amount), currencyCode: currencyCode ?? '' };
    }).filter(({ lineRef, date }) => lineRef && date);

    if (statementLines.length === 0) {
      setError('No valid statement lines found.');
      return;
    }

    startTransition(async () => {
      const res = await reconcileSupplierStatementAction({
        supplierId: data.supplierId,
        asOfDate: data.asOfDate,
        statementLines,
        dateTolerance: data.dateTolerance,
      });
      if (res.ok) {
        setResult({ matched: res.value.matched, unmatched: res.value.unmatched });
      } else {
        setError(res.error.message);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>
            Supplier <span className="text-destructive">*</span>
          </Label>
          <EntityCombobox
            value={selectedSupplier}
            onChange={(opt) => {
              setSelectedSupplier(opt);
              form.setValue('supplierId', opt?.id ?? '', { shouldValidate: true });
            }}
            loadOptions={(q) => searchSuppliers(q)}
            placeholder="Select supplier"
            ariaLabel="Supplier"
            error={form.formState.errors.supplierId?.message}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="asOfDate">
            As-of Date <span className="text-destructive">*</span>
          </Label>
          <Input id="asOfDate" type="date" {...form.register('asOfDate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTolerance">Date Tolerance (days)</Label>
          <Input id="dateTolerance" type="number" min={0} max={30} {...form.register('dateTolerance')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="statementCsv">
          Statement Lines (CSV) <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Format: lineRef, date, description, amount, currencyCode (one per line)
        </p>
        <Textarea
          id="statementCsv"
          {...form.register('statementCsv')}
          placeholder="REF001,2026-01-15,Invoice payment,1000.00,USD&#10;REF002,2026-01-20,Credit note,-200.00,USD"
          rows={10}
          className="font-mono text-xs"
        />
        {form.formState.errors.statementCsv && (
          <p className="text-xs text-destructive">{form.formState.errors.statementCsv.message}</p>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reconciliation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Matched</p>
                <p className="text-lg font-bold text-success tabular-nums">{result.matched}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unmatched</p>
                <p className="text-lg font-bold text-destructive tabular-nums">{result.unmatched}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitMerge className="mr-2 h-4 w-4" />}
          Reconcile
        </Button>
      </div>
    </form>
  );
}
