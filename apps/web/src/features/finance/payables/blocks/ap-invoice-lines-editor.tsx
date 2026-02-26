'use client';

import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import type { CreateApInvoice } from '@afenda/contracts';
import { MoneyCell } from '@/components/erp/money-cell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

interface ApInvoiceLinesEditorProps {
  form: UseFormReturn<CreateApInvoice>;
}

export function ApInvoiceLinesEditor({ form }: ApInvoiceLinesEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const lines = form.watch('lines');
  const totalAmount = lines?.reduce((sum, l) => sum + (l.amount || 0), 0) ?? 0;
  const totalTax = lines?.reduce((sum, l) => sum + (l.taxAmount || 0), 0) ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Invoice Lines</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              accountId: '',
              description: '',
              quantity: 1,
              unitPrice: 0,
              amount: 0,
              taxAmount: 0,
            })
          }
        >
          <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
          Add Line
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>
                  <Input
                    {...form.register(`lines.${index}.accountId`)}
                    placeholder="Account UUID"
                    aria-label={`Line ${index + 1} account`}
                    className="font-mono text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    {...form.register(`lines.${index}.description`)}
                    placeholder="Description"
                    aria-label={`Line ${index + 1} description`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })}
                    type="number"
                    min="1"
                    step="1"
                    aria-label={`Line ${index + 1} quantity`}
                    className="w-16 text-right font-mono"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    {...form.register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    aria-label={`Line ${index + 1} unit price`}
                    className="w-24 text-right font-mono"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    {...form.register(`lines.${index}.amount`, { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    aria-label={`Line ${index + 1} amount`}
                    className="w-24 text-right font-mono"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    {...form.register(`lines.${index}.taxAmount`, { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    aria-label={`Line ${index + 1} tax`}
                    className="w-20 text-right font-mono"
                  />
                </TableCell>
                <TableCell>
                  {fields.length > 1 && (
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
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-medium">
              <TableCell colSpan={4} className="text-right text-xs text-muted-foreground">
                Totals
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={totalAmount} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={totalTax} />
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {form.formState.errors.lines?.root?.message && (
        <p className="text-xs text-destructive" role="alert">
          {form.formState.errors.lines.root.message}
        </p>
      )}
    </div>
  );
}
