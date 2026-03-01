'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddEntityInputSchema } from '@afenda/contracts';
import type { z } from 'zod';

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
import { addGroupEntityAction } from '../actions/consolidation.actions';
import { routes } from '@/lib/constants';

type FormValues = z.infer<typeof AddEntityInputSchema>;

const entityTypeOptions = [
  { value: 'subsidiary', label: 'Subsidiary' },
  { value: 'associate', label: 'Associate' },
  { value: 'joint_venture', label: 'Joint Venture' },
  { value: 'branch', label: 'Branch' },
] as const;

const consolidationMethodOptions = [
  { value: 'full', label: 'Full Consolidation' },
  { value: 'proportional', label: 'Proportional' },
  { value: 'equity_method', label: 'Equity Method' },
] as const;

export function AddEntityForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; id?: string; error?: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(AddEntityInputSchema),
    defaultValues: {
      entityCode: '',
      name: '',
      country: '',
      currency: 'USD',
      entityType: 'subsidiary',
      consolidationMethod: 'full',
      parentId: '',
      ownershipPercent: 100,
      votingRightsPercent: 100,
      acquisitionDate: new Date(),
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await addGroupEntityAction(values);
      if (result.ok) {
        setFeedback({ ok: true, id: result.id });
        router.push(routes.finance.groupEntityDetail(result.id));
      } else {
        setFeedback({ ok: false, error: result.error.message });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {feedback && !feedback.ok && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {feedback.error ?? 'An error occurred'}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Entity Code */}
        <div className="space-y-2">
          <Label htmlFor="entityCode">Entity Code</Label>
          <Input id="entityCode" {...form.register('entityCode')} placeholder="e.g. EU-OP" />
          {form.formState.errors.entityCode && (
            <p className="text-sm text-destructive">{form.formState.errors.entityCode.message}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Entity Name</Label>
          <Input id="name" {...form.register('name')} placeholder="e.g. European Operations GmbH" />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...form.register('country')} placeholder="e.g. DE" />
          {form.formState.errors.country && (
            <p className="text-sm text-destructive">{form.formState.errors.country.message}</p>
          )}
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" {...form.register('currency')} placeholder="e.g. EUR" maxLength={3} />
          {form.formState.errors.currency && (
            <p className="text-sm text-destructive">{form.formState.errors.currency.message}</p>
          )}
        </div>

        {/* Entity Type */}
        <div className="space-y-2">
          <Label htmlFor="entityType">Entity Type</Label>
          <Select
            value={form.watch('entityType')}
            onValueChange={(v) => form.setValue('entityType', v as FormValues['entityType'])}
          >
            <SelectTrigger id="entityType"><SelectValue /></SelectTrigger>
            <SelectContent>
              {entityTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Consolidation Method */}
        <div className="space-y-2">
          <Label htmlFor="consolidationMethod">Consolidation Method</Label>
          <Select
            value={form.watch('consolidationMethod')}
            onValueChange={(v) => form.setValue('consolidationMethod', v as FormValues['consolidationMethod'])}
          >
            <SelectTrigger id="consolidationMethod"><SelectValue /></SelectTrigger>
            <SelectContent>
              {consolidationMethodOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Parent ID */}
        <div className="space-y-2">
          <Label htmlFor="parentId">Parent Entity ID</Label>
          <Input id="parentId" {...form.register('parentId')} placeholder="Select parent entity" />
          {form.formState.errors.parentId && (
            <p className="text-sm text-destructive">{form.formState.errors.parentId.message}</p>
          )}
        </div>

        {/* Ownership % */}
        <div className="space-y-2">
          <Label htmlFor="ownershipPercent">Ownership %</Label>
          <Input
            id="ownershipPercent"
            type="number"
            min={0}
            max={100}
            {...form.register('ownershipPercent', { valueAsNumber: true })}
          />
        </div>

        {/* Voting Rights % */}
        <div className="space-y-2">
          <Label htmlFor="votingRightsPercent">Voting Rights %</Label>
          <Input
            id="votingRightsPercent"
            type="number"
            min={0}
            max={100}
            {...form.register('votingRightsPercent', { valueAsNumber: true })}
          />
        </div>

        {/* Acquisition Date */}
        <div className="space-y-2">
          <Label htmlFor="acquisitionDate">Acquisition Date</Label>
          <Input id="acquisitionDate" type="date" {...form.register('acquisitionDate', { valueAsDate: true })} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Adding…' : 'Add Entity'}
        </Button>
      </div>
    </form>
  );
}
