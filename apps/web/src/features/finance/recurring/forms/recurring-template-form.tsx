'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateRecurringTemplateSchema, type CreateRecurringTemplate } from '@afenda/contracts';
import { createRecurringTemplateAction } from '../actions/recurring.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import type { CommandReceipt } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { routes } from '@/lib/constants';

interface LedgerOption {
  id: string;
  name: string;
  companyId: string;
}

interface RecurringTemplateFormProps {
  ledgers: LedgerOption[];
}

export function RecurringTemplateForm({ ledgers }: RecurringTemplateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateRecurringTemplate>({
    resolver: zodResolver(CreateRecurringTemplateSchema),
    defaultValues: {
      companyId: '',
      ledgerId: '',
      description: '',
      frequency: 'MONTHLY',
      nextRunDate: new Date(),
      lines: [
        { accountCode: '', debit: 0, credit: 0, description: '' },
        { accountCode: '', debit: 0, credit: 0, description: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  function handleLedgerChange(ledgerId: string) {
    const ledger = ledgers.find((l) => l.id === ledgerId);
    form.setValue('ledgerId', ledgerId);
    if (ledger) {
      form.setValue('companyId', ledger.companyId);
    }
  }

  function onSubmit(data: CreateRecurringTemplate) {
    startTransition(async () => {
      setServerError(null);
      const result = await createRecurringTemplateAction(data);
      if (result.ok) {
        setReceipt(result.value);
      } else {
        setServerError(result.error.message);
      }
    });
  }

  if (receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Recurring template created"
        onClose={() => router.push(routes.finance.recurring)}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Ledger</Label>
          <Select value={form.watch('ledgerId')} onValueChange={handleLedgerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select ledger" />
            </SelectTrigger>
            <SelectContent>
              {ledgers.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.ledgerId && (
            <p className="text-xs text-destructive">{form.formState.errors.ledgerId.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            {...form.register('description')}
            placeholder="Monthly rent accrual"
          />
          {form.formState.errors.description && (
            <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Frequency</Label>
          <Select
            value={form.watch('frequency')}
            onValueChange={(v) =>
              form.setValue('frequency', v as 'MONTHLY' | 'QUARTERLY' | 'YEARLY')
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nextRunDate">Next Run Date</Label>
          <Input id="nextRunDate" type="date" {...form.register('nextRunDate')} />
          {form.formState.errors.nextRunDate && (
            <p className="text-xs text-destructive">{form.formState.errors.nextRunDate.message}</p>
          )}
        </div>
      </div>

      {/* Journal lines */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Journal Lines</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ accountCode: '', debit: 0, credit: 0, description: '' })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Add Line
          </Button>
        </div>

        {form.formState.errors.lines?.root && (
          <p className="text-xs text-destructive">{form.formState.errors.lines.root.message}</p>
        )}

        <div className="rounded-md border">
          <div className="grid grid-cols-[1fr_120px_120px_1fr_40px] gap-2 border-b bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
            <span>Account Code</span>
            <span>Debit</span>
            <span>Credit</span>
            <span>Description</span>
            <span />
          </div>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_120px_120px_1fr_40px] gap-2 border-b p-3 last:border-0"
            >
              <Input
                {...form.register(`lines.${index}.accountCode`)}
                placeholder="1100"
                className="font-mono text-sm"
              />
              <Input
                {...form.register(`lines.${index}.debit`, { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="text-right"
                aria-label="Debit amount"
              />
              <Input
                {...form.register(`lines.${index}.credit`, { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="text-right"
                aria-label="Credit amount"
              />
              <Input
                {...form.register(`lines.${index}.description`)}
                placeholder="Line description"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={fields.length <= 2}
                onClick={() => remove(index)}
                className="h-9 w-9 p-0"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Remove line</span>
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Template'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
