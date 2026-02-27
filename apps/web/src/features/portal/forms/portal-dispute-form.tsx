'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { routes } from '@/lib/constants';
import { createDisputeAction } from '../actions/portal.actions';
import { Loader2 } from 'lucide-react';

interface PortalDisputeFormProps {
  supplierId: string;
}

export function PortalDisputeForm({ supplierId }: PortalDisputeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [paymentRunId, setPaymentRunId] = useState('');

  function handleSubmit() {
    setError(null);

    if (!subject || !category || !description) {
      setError('Subject, category, and description are required.');
      return;
    }

    startTransition(async () => {
      const result = await createDisputeAction(supplierId, {
        subject,
        category,
        description,
        invoiceId: invoiceId || undefined,
        paymentRunId: paymentRunId || undefined,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      router.push(routes.portal.disputeDetail(result.value.id));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dispute Details</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="disputeSubject">Subject</Label>
            <Input
              id="disputeSubject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Incorrect amount on invoice"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disputeCategory">Category</Label>
            <Input
              id="disputeCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="INCORRECT_AMOUNT"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disputeInvoiceId">Related Invoice ID (optional)</Label>
            <Input
              id="disputeInvoiceId"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="Select invoice"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disputePaymentRunId">Related Payment Run ID (optional)</Label>
            <Input
              id="disputePaymentRunId"
              value={paymentRunId}
              onChange={(e) => setPaymentRunId(e.target.value)}
              placeholder="Select payment run"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="disputeDescription">Description</Label>
            <Textarea
              id="disputeDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push(routes.portal.disputes)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Dispute
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
