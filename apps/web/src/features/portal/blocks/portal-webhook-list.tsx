'use client';

/**
 * SP-7015: Portal Webhook Subscription List (CAP-API)
 *
 * Client component — renders the webhook subscription table with inline
 * pause / resume / delete and secret-rotation actions.
 * The signing secret dialog is shown once on creation and never again.
 */
import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { MoreHorizontal, Plus, Copy, Check, AlertTriangle, Webhook } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WebhookStatus = 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'DELETED';

export interface WebhookSubscription {
  id: string;
  label: string;
  endpointUrl: string;
  eventTypes: readonly string[];
  status: WebhookStatus;
  failureCount: number;
  lastDeliveredAt: string | null;
  lastFailedAt: string | null;
  createdAt: string;
}

// ─── Event type labels ────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  'invoice.submitted': 'Invoice Submitted',
  'invoice.status_changed': 'Invoice Status Changed',
  'payment.sent': 'Payment Sent',
  'payment.returned': 'Payment Returned',
  'case.created': 'Case Created',
  'case.status_changed': 'Case Status Changed',
  'case.message_received': 'Case Message Received',
  'escalation.triggered': 'Escalation Triggered',
  'escalation.resolved': 'Escalation Resolved',
  'compliance.expiring': 'Compliance Expiring',
  'compliance.expired': 'Compliance Expired',
  'announcement.published': 'Announcement Published',
};

const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS);

// ─── Status badge ─────────────────────────────────────────────────────────────

function WebhookStatusBadge({ status }: { status: WebhookStatus }) {
  const variants: Record<WebhookStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ACTIVE: 'default',
    PAUSED: 'secondary',
    SUSPENDED: 'destructive',
    DELETED: 'outline',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

// ─── Copy-to-clipboard button ─────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy to clipboard">
      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

// ─── Secret reveal dialog (shown once after creation) ─────────────────────────

function SecretDialog({ secret, onClose }: { secret: string; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Signing Secret — Save This Now</DialogTitle>
          <DialogDescription>
            This secret is shown only once. Copy and store it securely. You will not be able to
            retrieve it again.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-md bg-muted p-3 font-mono text-sm break-all">
          <span className="flex-1 select-all">{secret}</span>
          <CopyButton value={secret} />
        </div>
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Use this secret to verify webhook payloads via the{' '}
            <code className="rounded bg-warning/20 px-1">X-Afenda-Signature</code> header
            (HMAC-SHA256).
          </span>
        </div>
        <Button onClick={onClose} className="w-full">
          I have saved the secret
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create webhook form dialog ───────────────────────────────────────────────

function CreateWebhookDialog({
  supplierId,
  onCreated,
  onClose,
}: {
  supplierId: string;
  onCreated: (sub: WebhookSubscription, secret: string) => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await fetch(`/api/portal/suppliers/${supplierId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, endpointUrl, eventTypes: selectedEvents }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Failed to create webhook subscription.');
        return;
      }
      const { signingSecret, ...subscription } = data;
      onCreated(subscription as WebhookSubscription, signingSecret as string);
      onClose();
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Webhook Subscription</DialogTitle>
          <DialogDescription>
            Afenda will send a signed POST request to your endpoint when selected events occur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wh-label">Label</Label>
            <Input
              id="wh-label"
              placeholder="My production webhook"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wh-url">Endpoint URL (HTTPS)</Label>
            <Input
              id="wh-url"
              type="url"
              placeholder="Enter your HTTPS endpoint URL"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Events to subscribe to</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ALL_EVENT_TYPES.map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedEvents.includes(type)}
                    onCheckedChange={(checked) =>
                      setSelectedEvents(
                        checked
                          ? [...selectedEvents, type]
                          : selectedEvents.filter((t) => t !== type)
                      )
                    }
                  />
                  {EVENT_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending || !label.trim() || !endpointUrl.trim() || selectedEvents.length === 0
            }
          >
            {isPending ? 'Creating…' : 'Create Webhook'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PortalWebhookListProps {
  supplierId: string;
  initialSubscriptions: readonly WebhookSubscription[];
}

export function PortalWebhookList({ supplierId, initialSubscriptions }: PortalWebhookListProps) {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([
    ...initialSubscriptions,
  ] as WebhookSubscription[]);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingSecret, setPendingSecret] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreated = (sub: WebhookSubscription, secret: string) => {
    setSubscriptions((prev) => [sub, ...prev]);
    setPendingSecret(secret);
  };

  const patchWebhook = (id: string, action: 'pause' | 'resume' | 'rotate') => {
    startTransition(async () => {
      const res = await fetch(`/api/portal/suppliers/${supplierId}/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Action failed.');
        return;
      }
      if (action === 'rotate') {
        setPendingSecret(data.newSigningSecret as string);
      } else {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? (data as WebhookSubscription) : s))
        );
      }
    });
  };

  const deleteWebhook = (id: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/portal/suppliers/${supplierId}/webhooks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error?.message ?? 'Failed to delete webhook.');
        return;
      }
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Webhook subscription deleted.');
    });
  };

  const active = subscriptions.filter((s) => s.status !== 'DELETED');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Webhook Subscriptions</h2>
          <p className="text-sm text-muted-foreground">
            {active.length} / 10 subscription{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} disabled={active.length >= 10}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Webhook className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm font-medium">No webhook subscriptions</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a webhook to receive real-time event notifications.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
            Add Webhook
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <caption className="sr-only">Webhook subscriptions</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Delivered</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.label}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                    {sub.endpointUrl}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {sub.eventTypes.length} event{sub.eventTypes.length !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <WebhookStatusBadge status={sub.status} />
                    {sub.failureCount > 0 && (
                      <span className="ml-1.5 text-xs text-destructive">
                        ({sub.failureCount} failure{sub.failureCount !== 1 ? 's' : ''})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sub.lastDeliveredAt
                      ? formatDistanceToNow(new Date(sub.lastDeliveredAt), { addSuffix: true })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isPending}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {sub.status === 'ACTIVE' ? (
                          <DropdownMenuItem onClick={() => patchWebhook(sub.id, 'pause')}>
                            Pause
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => patchWebhook(sub.id, 'resume')}>
                            Resume
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => patchWebhook(sub.id, 'rotate')}>
                          Rotate Secret
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteWebhook(sub.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showCreate && (
        <CreateWebhookDialog
          supplierId={supplierId}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}

      {pendingSecret && (
        <SecretDialog secret={pendingSecret} onClose={() => setPendingSecret(null)} />
      )}
    </div>
  );
}
