'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Siren, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import type { PortalCaseListItem } from '@/features/portal/queries/portal.queries';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  supplierId: string;
  /** Active open cases the supplier can tie an escalation to. */
  openCases: Pick<PortalCaseListItem, 'id' | 'ticketNumber' | 'subject'>[];
  triggerAction: (
    supplierId: string,
    body: { caseId: string; reason: string }
  ) => Promise<{ ok: boolean; error?: unknown }>;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Phase 1.2.2 CAP-SOS — Red SOS button shown in the supplier portal header.
 * Disabled when there are no open cases to escalate against.
 */
export function PortalSosButton({ supplierId, openCases, triggerAction }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(openCases[0]?.id ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const disabled = openCases.length === 0;

  function handleOpen() {
    setSelectedCaseId(openCases[0]?.id ?? '');
    setReason('');
    setError(null);
    setOpen(true);
  }

  function handleSubmit() {
    if (!selectedCaseId) {
      setError('Please select a case to escalate.');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Please describe the issue in at least 10 characters.');
      return;
    }

    startTransition(async () => {
      const result = await triggerAction(supplierId, {
        caseId: selectedCaseId,
        reason: reason.trim(),
      });

      if (!result.ok) {
        setError('Failed to raise escalation. Please try again.');
        return;
      }

      setOpen(false);
      router.push(routes.portal.escalations);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleOpen}
        disabled={disabled}
        title={disabled ? 'No open cases to escalate' : 'Raise breakglass escalation'}
        className="gap-1.5 font-semibold"
      >
        <Siren className="h-4 w-4" />
        SOS
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Raise Breakglass Escalation
            </DialogTitle>
            <DialogDescription>
              Use this only for urgent issues that have not been resolved through normal channels.
              Your dedicated contact will be notified immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Case selector */}
            <div className="space-y-1.5">
              <Label htmlFor="sos-case">Related Case</Label>
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger id="sos-case" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {openCases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      #{c.ticketNumber} — {c.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="sos-reason">Reason for Escalation</Label>
              <Textarea
                id="sos-reason"
                placeholder="Describe the urgent issue and what you have already tried…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">Minimum 10 characters.</p>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={isPending || reason.trim().length < 10}
              className="gap-1.5"
            >
              <Siren className="h-4 w-4" />
              {isPending ? 'Sending…' : 'Raise Escalation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
