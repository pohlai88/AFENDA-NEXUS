'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { processBankRejectionAction } from '../actions/ap-payment-run.actions';
import { routes } from '@/lib/constants';

const BankRejectionSchema = z.object({
  rejectionType: z.enum(['FULL', 'PARTIAL']),
  reason: z.string().min(1, 'Reason is required').max(500),
  bankRef: z.string().min(1, 'Bank reference is required').max(100),
  rejectedAmount: z.coerce.number().nonnegative().optional(),
});

type BankRejectionValues = z.infer<typeof BankRejectionSchema>;

interface ApBankRejectionFormProps {
  runId: string;
}

export function ApBankRejectionForm({ runId }: ApBankRejectionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BankRejectionValues>({
    resolver: zodResolver(BankRejectionSchema),
    defaultValues: {
      rejectionType: 'FULL',
      reason: '',
      bankRef: '',
    },
  });

  function handleSubmit(data: BankRejectionValues) {
    setError(null);
    startTransition(async () => {
      const result = await processBankRejectionAction(runId, data);
      if (result.ok) {
        router.push(routes.finance.paymentRunDetail(runId));
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  const rejectionType = form.watch('rejectionType');

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rejectionType">Rejection Type</Label>
          <Select
            value={form.watch('rejectionType')}
            onValueChange={(value) => form.setValue('rejectionType', value as 'FULL' | 'PARTIAL', { shouldValidate: true })}
          >
            <SelectTrigger id="rejectionType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL">Full Rejection</SelectItem>
              <SelectItem value="PARTIAL">Partial Rejection</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankRef">
            Bank Reference <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bankRef"
            {...form.register('bankRef')}
            placeholder="Bank rejection reference"
          />
          {form.formState.errors.bankRef && (
            <p className="text-xs text-destructive">{form.formState.errors.bankRef.message}</p>
          )}
        </div>
      </div>

      {rejectionType === 'PARTIAL' && (
        <div className="space-y-2">
          <Label htmlFor="rejectedAmount">Rejected Amount</Label>
          <Input
            id="rejectedAmount"
            type="number"
            step="0.01"
            {...form.register('rejectedAmount')}
            placeholder="0.00"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reason">
          Reason <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="reason"
          {...form.register('reason')}
          placeholder="Reason for bank rejection"
          rows={3}
        />
        {form.formState.errors.reason && (
          <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={isPending}>
          { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Process Rejection
        </Button>
      </div>
    </form>
  );
}
