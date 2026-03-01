'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { routes } from '@/lib/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateRevenueContractSchema } from '@afenda/contracts';
import type { CreateRevenueContract } from '@afenda/contracts';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createRevenueContractAction } from '../actions/revenue.actions';
import type { CommandReceipt } from '@/lib/types';

export function CreateRevenueContractForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateRevenueContract>({
    resolver: zodResolver(CreateRevenueContractSchema),
  });

  function onSubmit(data: CreateRevenueContract) {
    setError(null);
    startTransition(async () => {
      const result = await createRevenueContractAction(data);
      if (result.ok) {
        setReceipt(result.value);
      } else {
        setError(result.error.message);
      }
    });
  }

  if (receipt) {
    return (
      <ReceiptPanel
        title="Revenue Contract Created"
        receipt={receipt}
        onClose={() => router.push(routes.finance.revenueRecognition)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyId">Company ID</Label>
          <Input id="companyId" {...register('companyId')} aria-invalid={!!errors.companyId} />
          {errors.companyId && <p className="text-sm text-destructive">{errors.companyId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractNumber">Contract Number</Label>
          <Input id="contractNumber" {...register('contractNumber')} aria-invalid={!!errors.contractNumber} />
          {errors.contractNumber && <p className="text-sm text-destructive">{errors.contractNumber.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <Input id="customerName" {...register('customerName')} aria-invalid={!!errors.customerName} />
          {errors.customerName && <p className="text-sm text-destructive">{errors.customerName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalAmount">Total Amount</Label>
          <Input id="totalAmount" {...register('totalAmount')} placeholder="Integer string" aria-invalid={!!errors.totalAmount} />
          {errors.totalAmount && <p className="text-sm text-destructive">{errors.totalAmount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" maxLength={3} {...register('currency')} aria-invalid={!!errors.currency} />
          {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Recognition Method</Label>
          <Select onValueChange={(v) => setValue('recognitionMethod', v as CreateRevenueContract['recognitionMethod'])}>
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STRAIGHT_LINE">Straight Line</SelectItem>
              <SelectItem value="MILESTONE">Milestone</SelectItem>
              <SelectItem value="PERCENTAGE_OF_COMPLETION">% of Completion</SelectItem>
            </SelectContent>
          </Select>
          {errors.recognitionMethod && <p className="text-sm text-destructive">{errors.recognitionMethod.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" {...register('startDate')} aria-invalid={!!errors.startDate} />
          {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" type="date" {...register('endDate')} aria-invalid={!!errors.endDate} />
          {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="deferredAccountId">Deferred Account ID</Label>
          <Input id="deferredAccountId" {...register('deferredAccountId')} aria-invalid={!!errors.deferredAccountId} />
          {errors.deferredAccountId && <p className="text-sm text-destructive">{errors.deferredAccountId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="revenueAccountId">Revenue Account ID</Label>
          <Input id="revenueAccountId" {...register('revenueAccountId')} aria-invalid={!!errors.revenueAccountId} />
          {errors.revenueAccountId && <p className="text-sm text-destructive">{errors.revenueAccountId.message}</p>}
        </div>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creating…' : 'Create Revenue Contract'}
      </Button>
    </form>
  );
}
