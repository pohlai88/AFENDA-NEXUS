'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EntityCombobox, type EntityOption } from '@/components/erp/entity-combobox';
import { useReceipt } from '@/hooks/use-receipt';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { routes } from '@/lib/constants';
import type { ProjectType, BillingMethod, RevenueRecognition } from '../types';
import { projectTypeLabels, billingMethodLabels } from '../types';

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  customerId: z.string(),
  projectType: z.string().min(1),
  billingMethod: z.string().min(1),
  revenueRecognition: z.string().min(1),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string(),
  projectManager: z.string().min(1, 'Project manager is required'),
  department: z.string().min(1, 'Department is required'),
  contractValue: z.coerce.number().min(0),
  budgetedCost: z.coerce.number().min(0),
  currency: z.string().min(1, 'Currency is required').max(3),
  costCenterId: z.string(),
});

interface CreateProjectFormData {
  name: string;
  description: string;
  customerId: string;
  projectType: ProjectType;
  billingMethod: BillingMethod;
  revenueRecognition: RevenueRecognition;
  startDate: string;
  endDate: string;
  projectManager: string;
  department: string;
  contractValue: number;
  budgetedCost: number;
  currency: string;
  costCenterId: string;
}

interface CreateProjectFormProps {
  onSubmit: (
    data: Record<string, unknown>
  ) => Promise<{ ok: true; projectId: string } | { ok: false; error: string }>;
}

const typeOptions = Object.entries(projectTypeLabels).map(([value, label]) => ({ value, label }));
const billingOptions = Object.entries(billingMethodLabels).map(([value, label]) => ({ value, label }));

const revenueOptions = [
  { value: 'completed_contract', label: 'Completed Contract' },
  { value: 'percentage_of_completion', label: '% of Completion' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'time_based', label: 'Time-Based' },
] as const;

export function CreateProjectForm({ onSubmit }: CreateProjectFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { receipt, showReceipt, clearReceipt, isOpen } = useReceipt();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const [selectedCustomer, setSelectedCustomer] = useState<EntityOption | null>(null);
  const [selectedCostCenter, setSelectedCostCenter] = useState<EntityOption | null>(null);

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      customerId: '',
      projectType: 'fixed_price',
      billingMethod: 'milestone',
      revenueRecognition: 'percentage_of_completion',
      startDate: '',
      endDate: '',
      projectManager: '',
      department: '',
      contractValue: 0,
      budgetedCost: 0,
      currency: '',
      costCenterId: '',
    },
  });

  async function handleSubmit(data: CreateProjectFormData) {
    setSubmitting(true);
    setError(null);

    const result = await onSubmit({
      ...data,
      contractValue: Number(data.contractValue),
      budgetedCost: Number(data.budgetedCost),
      customerId: data.customerId || null,
      endDate: data.endDate || null,
      costCenterId: data.costCenterId || null,
    });

    setSubmitting(false);

    if (result.ok) {
      showReceipt({
        commandId: idempotencyKeyRef.current,
        idempotencyKey: idempotencyKeyRef.current,
        resultRef: result.projectId,
        completedAt: new Date().toISOString(),
      });
      idempotencyKeyRef.current = crypto.randomUUID();
    } else {
      setError(result.error);
    }
  }

  if (isOpen && receipt) {
    return (
      <ReceiptPanel
        receipt={receipt}
        title="Project Created"
        onClose={clearReceipt}
        viewHref={routes.finance.projectDetail(receipt.resultRef)}
        backHref={routes.finance.projects}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {error && (
        <div role="alert" className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name *</Label>
          <Input id="name" placeholder="e.g. Website Redesign" {...form.register('name', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectType">Project Type *</Label>
          <Select
            value={form.watch('projectType')}
            onValueChange={(v) => form.setValue('projectType', v as ProjectType, { shouldValidate: true })}
          >
            <SelectTrigger id="projectType"><SelectValue /></SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe the project scope..." rows={2} {...form.register('description')} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="billingMethod">Billing Method *</Label>
          <Select
            value={form.watch('billingMethod')}
            onValueChange={(v) => form.setValue('billingMethod', v as BillingMethod, { shouldValidate: true })}
          >
            <SelectTrigger id="billingMethod"><SelectValue /></SelectTrigger>
            <SelectContent>
              {billingOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="revenueRecognition">Revenue Recognition *</Label>
          <Select
            value={form.watch('revenueRecognition')}
            onValueChange={(v) => form.setValue('revenueRecognition', v as RevenueRecognition, { shouldValidate: true })}
          >
            <SelectTrigger id="revenueRecognition"><SelectValue /></SelectTrigger>
            <SelectContent>
              {revenueOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input id="startDate" type="date" {...form.register('startDate', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" type="date" {...form.register('endDate')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Input id="currency" placeholder="e.g. USD" maxLength={3} {...form.register('currency', { required: true })} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="contractValue">Contract Value *</Label>
          <Input id="contractValue" type="number" min="0" step="0.01" {...form.register('contractValue', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="budgetedCost">Budgeted Cost *</Label>
          <Input id="budgetedCost" type="number" min="0" step="0.01" {...form.register('budgetedCost', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label>Customer</Label>
          <EntityCombobox
            value={selectedCustomer}
            onChange={(opt) => { setSelectedCustomer(opt); form.setValue('customerId', opt?.id ?? '', { shouldValidate: true }); }}
            loadOptions={async (_q) => []}
            placeholder="Select customer…"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="projectManager">Project Manager *</Label>
          <Input id="projectManager" placeholder="Name" {...form.register('projectManager', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Input id="department" placeholder="e.g. Engineering" {...form.register('department', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label>Cost Center</Label>
          <EntityCombobox
            value={selectedCostCenter}
            onChange={(opt) => { setSelectedCostCenter(opt); form.setValue('costCenterId', opt?.id ?? '', { shouldValidate: true }); }}
            loadOptions={async (_q) => []}
            placeholder="Select cost center…"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
