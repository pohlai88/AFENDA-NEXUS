'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Loader2 } from 'lucide-react';
import { renewComplianceItemAction } from '../actions/portal.actions';
import { useRouter } from 'next/navigation';

interface ComplianceRenewalDialogProps {
  supplierId: string;
  itemId: string;
  itemType: string;
}

export function ComplianceRenewalDialog({
  supplierId,
  itemId,
  itemType,
}: ComplianceRenewalDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);

    const documentId = formData.get('documentId') as string;
    const newExpiryDate = formData.get('newExpiryDate') as string;
    const notes = (formData.get('notes') as string) || undefined;

    if (!documentId || !newExpiryDate) {
      setError('Document ID and expiry date are required.');
      return;
    }

    startTransition(async () => {
      const result = await renewComplianceItemAction(supplierId, itemId, {
        documentId,
        newExpiryDate,
        notes,
      });

      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Renew
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renew {itemType}</DialogTitle>
          <DialogDescription>
            Upload a new document and set the new expiry date for this compliance item.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="renewal-documentId">Document ID</Label>
            <Input
              id="renewal-documentId"
              name="documentId"
              type="text"
              placeholder="Enter document reference or upload ID"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renewal-expiryDate">New Expiry Date</Label>
            <Input
              id="renewal-expiryDate"
              name="newExpiryDate"
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renewal-notes">Notes (optional)</Label>
            <Textarea
              id="renewal-notes"
              name="notes"
              placeholder="Additional context for this renewal..."
              rows={3}
              disabled={isPending}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Submit Renewal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
