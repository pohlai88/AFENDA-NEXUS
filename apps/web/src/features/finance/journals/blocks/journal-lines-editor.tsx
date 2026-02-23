"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { CreateJournal } from "@afenda/contracts";
import { MoneyCell } from "@/components/erp/money-cell";
import { Plus, Trash2 } from "lucide-react";

interface JournalLinesEditorProps {
  form: UseFormReturn<CreateJournal>;
}

export function JournalLinesEditor({ form }: JournalLinesEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const lines = form.watch("lines");
  const totalDebit = lines?.reduce((sum, l) => sum + (l.debit || 0), 0) ?? 0;
  const totalCredit = lines?.reduce((sum, l) => sum + (l.credit || 0), 0) ?? 0;
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Journal Lines</h3>
        <button
          type="button"
          onClick={() =>
            append({ accountCode: "", debit: 0, credit: 0, currency: "USD" })
          }
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Add Line
        </button>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Account Code</th>
              <th className="px-3 py-2 text-left font-medium">Description</th>
              <th className="px-3 py-2 text-right font-medium">Debit</th>
              <th className="px-3 py-2 text-right font-medium">Credit</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b">
                <td className="px-3 py-2">
                  <input
                    {...form.register(`lines.${index}.accountCode`)}
                    className="w-full rounded-md border bg-transparent px-2 py-1 text-sm"
                    placeholder="e.g. 1000"
                    aria-label={`Line ${index + 1} account code`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    {...form.register(`lines.${index}.description`)}
                    className="w-full rounded-md border bg-transparent px-2 py-1 text-sm"
                    placeholder="Optional description"
                    aria-label={`Line ${index + 1} description`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    {...form.register(`lines.${index}.debit`, { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border bg-transparent px-2 py-1 text-right text-sm font-mono"
                    aria-label={`Line ${index + 1} debit`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    {...form.register(`lines.${index}.credit`, { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border bg-transparent px-2 py-1 text-right text-sm font-mono"
                    aria-label={`Line ${index + 1} credit`}
                  />
                </td>
                <td className="px-3 py-2">
                  {fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove line ${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 font-medium">
              <td colSpan={2} className="px-3 py-2 text-right text-xs text-muted-foreground">
                Totals
              </td>
              <td className="px-3 py-2 text-right">
                <MoneyCell amount={totalDebit} />
              </td>
              <td className="px-3 py-2 text-right">
                <MoneyCell amount={totalCredit} />
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {!isBalanced && totalDebit + totalCredit > 0 && (
        <p className="text-xs text-destructive" role="alert">
          Debits ({totalDebit.toFixed(2)}) must equal credits ({totalCredit.toFixed(2)})
        </p>
      )}
      {isBalanced && (
        <p className="text-xs text-emerald-600">Balanced</p>
      )}
    </div>
  );
}
