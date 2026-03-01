'use client';

import { useCallback, useContext, useEffect, useRef } from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import type { CreateJournal } from '@afenda/contracts';
import { cn } from '@/lib/utils';
import { MoneyCell } from '@/components/erp/money-cell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShortcutContext } from '@/providers/shortcut-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

interface JournalLinesEditorProps {
  form: UseFormReturn<CreateJournal>;
}

function getFocusedRowIndex(container: HTMLElement | null): number | null {
  const el = typeof document !== 'undefined' ? document.activeElement : null;
  if (!el || !container?.contains(el as Node)) return null;
  const row = (el as HTMLElement).closest?.('tr[data-row-index]');
  if (!row) return null;
  const idx = row.getAttribute('data-row-index');
  return idx != null ? parseInt(idx, 10) : null;
}

export function JournalLinesEditor({ form }: JournalLinesEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const lines = form.watch('lines');
  const gridRef = useRef<HTMLDivElement>(null);
  const shortcutCtx = useContext(ShortcutContext);
  const tableScopePushedRef = useRef(false);

  // Push table scope when grid gains focus, pop when focus leaves
  useEffect(() => {
    const container = gridRef.current;
    if (!container || !shortcutCtx) return;

    const handleFocusIn = (e: FocusEvent) => {
      if (!container.contains(e.relatedTarget as Node)) {
        shortcutCtx.engine.pushScope('table');
        tableScopePushedRef.current = true;
      }
    };
    const handleFocusOut = (e: FocusEvent) => {
      if (!container.contains(e.relatedTarget as Node)) {
        shortcutCtx.engine.popScope('table');
        tableScopePushedRef.current = false;
      }
    };

    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);
    return () => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
      if (tableScopePushedRef.current) {
        shortcutCtx.engine.popScope('table');
      }
    };
  }, [shortcutCtx]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'F8') return;
      const rowIndex = getFocusedRowIndex(gridRef.current);
      if (rowIndex == null || rowIndex < 1 || !lines?.[rowIndex - 1]) return;

      e.preventDefault();
      e.stopPropagation();
      const prevLine = lines[rowIndex - 1];
      if (!prevLine) return;
      form.setValue(`lines.${rowIndex}`, {
        accountCode: prevLine.accountCode ?? '',
        description: prevLine.description ?? '',
        debit: prevLine.debit ?? 0,
        credit: prevLine.credit ?? 0,
        currency: prevLine.currency ?? 'USD',
      });
    },
    [lines, form],
  );
  const totalDebit = lines?.reduce((sum, l) => sum + (l.debit || 0), 0) ?? 0;
  const totalCredit = lines?.reduce((sum, l) => sum + (l.credit || 0), 0) ?? 0;
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;
  const difference = Math.abs(totalDebit - totalCredit);

  // Per-line validation: flag lines where both debit and credit are > 0
  const lineErrors = lines?.map((l, _i) => {
    const errors: string[] = [];
    if (!l.accountCode?.trim()) errors.push('Account code required');
    if ((l.debit || 0) > 0 && (l.credit || 0) > 0)
      errors.push('A line cannot have both debit and credit');
    if ((l.debit || 0) === 0 && (l.credit || 0) === 0)
      errors.push('Enter a debit or credit amount');
    return errors;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Journal Lines</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ accountCode: '', debit: 0, credit: 0, currency: 'USD' })}
        >
          <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
          Add Line
        </Button>
      </div>

      <div
        ref={gridRef}
        className="rounded-md border"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="grid"
        aria-label="Journal lines"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const errors = lineErrors?.[index] ?? [];
              return (
                <TableRow
                  key={field.id}
                  data-row-index={index}
                  className={errors.length > 0 ? 'bg-destructive/5' : undefined}
                >
                  <TableCell>
                    <Input
                      {...form.register(`lines.${index}.accountCode`)}
                      placeholder="e.g. 1000"
                      aria-label={`Line ${index + 1} account code`}
                      aria-invalid={errors.some((e) => e.includes('Account code'))}
                      className="font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      {...form.register(`lines.${index}.description`)}
                      placeholder="Optional description"
                      aria-label={`Line ${index + 1} description`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      {...form.register(`lines.${index}.debit`, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label={`Line ${index + 1} debit`}
                      className="text-right font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      {...form.register(`lines.${index}.credit`, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label={`Line ${index + 1} credit`}
                      className="text-right font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        aria-label={`Remove line ${index + 1}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="font-medium">
              <TableCell colSpan={2} className="text-right text-xs text-muted-foreground">
                Totals
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={totalDebit} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={totalCredit} />
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Balance status indicator */}
      {totalDebit + totalCredit > 0 && (
        <div
          role="alert"
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium',
            isBalanced ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}
        >
          {isBalanced ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Balanced — debits equal credits
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Out of balance by {difference.toFixed(2)} — debits ({totalDebit.toFixed(2)}) must
              equal credits ({totalCredit.toFixed(2)})
            </>
          )}
        </div>
      )}

      {/* Zod array-level error from CreateJournalSchema min(2) */}
      {form.formState.errors.lines?.root?.message && (
        <p className="text-xs text-destructive" role="alert">
          {form.formState.errors.lines.root.message}
        </p>
      )}
    </div>
  );
}
