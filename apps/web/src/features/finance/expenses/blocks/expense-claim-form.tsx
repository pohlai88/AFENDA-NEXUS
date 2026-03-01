'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentUpload, type UploadedFile } from '@/components/erp/document-upload';
import { formatCurrency } from '@/lib/utils';
import { routes } from '@/lib/constants';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Send, Loader2, CheckCircle } from 'lucide-react';
import type { ExpenseCategory, ExpensePolicy } from '../types';
import { expenseCategoryLabels } from '../types';
import {
  createExpenseClaimAction,
  submitExpenseClaimAction,
} from '../actions/expenses.actions';

// ─── Line Item Form ──────────────────────────────────────────────────────────

interface LineItemState {
  id: string;
  expenseDate: string;
  category: ExpenseCategory;
  description: string;
  merchantName: string;
  amount: string;
  receipt: UploadedFile | null;
}

const emptyLineItem = (): LineItemState => ({
  id: `line-${crypto.randomUUID()}`,
  expenseDate: new Date().toISOString().split('T')[0] ?? '',
  category: 'other',
  description: '',
  merchantName: '',
  amount: '',
  receipt: null,
});

// ─── Main Form Component ─────────────────────────────────────────────────────

interface ExpenseClaimFormProps {
  policy: ExpensePolicy;
  employeeId?: string;
  employeeName?: string;
}

export function ExpenseClaimForm({
  policy,
  employeeId: _employeeId = 'emp-1',
  employeeName: _employeeName = 'Current User',
}: ExpenseClaimFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [periodFrom, setPeriodFrom] = useState(new Date().toISOString().split('T')[0]);
  const [periodTo, setPeriodTo] = useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = useState<LineItemState[]>([emptyLineItem()]);

  const totalAmount = lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.amount) || 0);
  }, 0);

  const addLineItem = () => {
    setLineItems([...lineItems, emptyLineItem()]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (
    id: string,
    field: keyof LineItemState,
    value: string | ExpenseCategory | UploadedFile | null
  ) => {
    setLineItems(lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Please enter a claim title';
    if (lineItems.length === 0) return 'Please add at least one expense';

    for (const item of lineItems) {
      if (!item.description.trim()) return 'All expenses must have a description';
      if (!item.merchantName.trim()) return 'All expenses must have a merchant name';
      if (!item.amount || parseFloat(item.amount) <= 0)
        return 'All expenses must have a valid amount';

      const amount = parseFloat(item.amount);
      const categoryLimit = policy.categoryLimits[item.category];
      if (amount > categoryLimit) {
        return `${expenseCategoryLabels[item.category]} expense exceeds limit of ${formatCurrency(categoryLimit, 'USD')}`;
      }

      if (amount >= policy.receiptThreshold && !item.receipt) {
        return `Receipt required for expenses over ${formatCurrency(policy.receiptThreshold, 'USD')}`;
      }
    }

    if (totalAmount > policy.monthlyLimit) {
      return `Total amount exceeds monthly limit of ${formatCurrency(policy.monthlyLimit, 'USD')}`;
    }

    return null;
  };

  const handleSave = () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    startTransition(async () => {
      const result = await createExpenseClaimAction({
        title,
        description,
        periodFrom: periodFrom ?? '',
        periodTo: periodTo ?? '',
        currency: 'USD',
      });

      if (result.ok) {
        toast.success(`Claim saved as draft`);
        router.push(routes.finance.expenses);
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const handleSubmit = () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    startTransition(async () => {
      const createResult = await createExpenseClaimAction({
        title,
        description,
        periodFrom: periodFrom ?? '',
        periodTo: periodTo ?? '',
        currency: 'USD',
      });

      if (!createResult.ok) {
        toast.error(createResult.error.message);
        return;
      }

      const submitResult = await submitExpenseClaimAction(createResult.value.resultRef ?? '');

      if (submitResult.ok) {
        toast.success('Claim submitted for approval');
        router.push(routes.finance.expenses);
      } else {
        toast.error(submitResult.error.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle>Claim Details</CardTitle>
          <CardDescription>Enter the basic information for your expense claim.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Claim Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q1 Business Travel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodFrom">Period From *</Label>
              <Input
                id="periodFrom"
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodTo">Period To *</Label>
              <Input
                id="periodTo"
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about this expense claim..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expense Items</CardTitle>
              <CardDescription>Add individual expenses with receipts.</CardDescription>
            </div>
            <Button onClick={addLineItem} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={item.id} className="grid gap-4 p-4 rounded-lg border bg-accent/20">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Expense #{index + 1}</span>
                  {lineItems.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeLineItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={item.expenseDate}
                      onChange={(e) => updateLineItem(item.id, 'expenseDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={item.category}
                      onValueChange={(v) =>
                        updateLineItem(item.id, 'category', v as ExpenseCategory)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(expenseCategoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                            <span className="text-xs text-muted-foreground ml-2">
                              (max{' '}
                              {formatCurrency(
                                policy.categoryLimits[value as ExpenseCategory],
                                'USD'
                              )}
                              )
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.amount}
                      onChange={(e) => updateLineItem(item.id, 'amount', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="What was this expense for?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Merchant *</Label>
                    <Input
                      value={item.merchantName}
                      onChange={(e) => updateLineItem(item.id, 'merchantName', e.target.value)}
                      placeholder="Vendor/merchant name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Receipt
                    {parseFloat(item.amount) >= policy.receiptThreshold && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </Label>
                  {item.receipt ? (
                    <div className="flex items-center gap-2 p-2 rounded border bg-success/10 dark:bg-success/20">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">
                        {item.receipt.file?.name ?? item.receipt.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateLineItem(item.id, 'receipt', null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <DocumentUpload
                      onUpload={async (files) => {
                        const file = files[0];
                        if (!file) return [];
                        const uploaded: UploadedFile = {
                          id: `upload-${crypto.randomUUID()}`,
                          name: file.name,
                          size: file.size,
                          type: file.type,
                          status: 'complete',
                          file,
                        };
                        updateLineItem(item.id, 'receipt', uploaded);
                        return [uploaded];
                      }}
                      maxFiles={1}
                      accept={{ 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-6">
          <div className="text-lg font-semibold">
            Total: <span className="font-mono">{formatCurrency(totalAmount, 'USD')}</span>
            {totalAmount > policy.monthlyLimit && (
              <Badge variant="destructive" className="ml-2">
                Exceeds Limit
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Draft
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit for Approval
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
