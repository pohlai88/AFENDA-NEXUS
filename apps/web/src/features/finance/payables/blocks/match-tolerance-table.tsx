'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/erp/empty-state';
import { Loader2, Plus, Settings2 } from 'lucide-react';
import {
  createMatchToleranceAction,
  updateMatchToleranceAction,
} from '../actions/match-tolerance.actions';
import type { MatchToleranceListItem } from '../queries/match-tolerance.queries';
import type { ToleranceScope } from '@afenda/contracts';

const SCOPE_LABELS: Record<ToleranceScope, string> = {
  ORG: 'Organization',
  COMPANY: 'Company',
  SITE: 'Site',
};

interface MatchToleranceTableProps {
  data: MatchToleranceListItem[];
}

export function MatchToleranceTable({ data }: MatchToleranceTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MatchToleranceListItem | null>(null);

  const [formScope, setFormScope] = useState<ToleranceScope>('ORG');
  const [formToleranceBps, setFormToleranceBps] = useState('100');
  const [formQuantityPercent, setFormQuantityPercent] = useState('0');
  const [formAutoHold, setFormAutoHold] = useState(true);

  function resetForm() {
    setFormScope('ORG');
    setFormToleranceBps('100');
    setFormQuantityPercent('0');
    setFormAutoHold(true);
    setError(null);
  }

  function handleCreate() {
    const bps = parseInt(formToleranceBps, 10);
    const qty = parseFloat(formQuantityPercent) || 0;
    if (Number.isNaN(bps) || bps < 0 || bps > 10000) {
      setError('Tolerance must be 0–10000 basis points (100 = 1%)');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createMatchToleranceAction({
        scope: formScope,
        scopeEntityId: null,
        companyId: null,
        toleranceBps: bps,
        quantityTolerancePercent: qty,
        autoHold: formAutoHold,
      });
      if (result.ok) {
        setCreateOpen(false);
        resetForm();
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleUpdate() {
    if (!editTarget) return;
    const bps = parseInt(formToleranceBps, 10);
    const qty = parseFloat(formQuantityPercent) || 0;
    if (Number.isNaN(bps) || bps < 0 || bps > 10000) {
      setError('Tolerance must be 0–10000 basis points (100 = 1%)');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateMatchToleranceAction(editTarget.id, {
        toleranceBps: bps,
        quantityTolerancePercent: qty,
        autoHold: formAutoHold,
      });
      if (result.ok) {
        setEditTarget(null);
        resetForm();
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  function openEdit(rule: MatchToleranceListItem) {
    setEditTarget(rule);
    setFormScope(rule.scope);
    setFormToleranceBps(String(rule.toleranceBps));
    setFormQuantityPercent(String(rule.quantityTolerancePercent));
    setFormAutoHold(rule.autoHold);
    setError(null);
  }

  if (data.length === 0 && !createOpen) {
    return (
      <>
        <EmptyState
          contentKey="finance.payables.matchTolerances"
          icon={Settings2}
          action={
            <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tolerance Rule
            </Button>
          }
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Match Tolerance Rule</DialogTitle>
              <DialogDescription>
                Define tolerance for PO–receipt–invoice matching. Invoices outside tolerance can be auto-held.
              </DialogDescription>
            </DialogHeader>
            <ToleranceForm
              scope={formScope}
              setScope={setFormScope}
              toleranceBps={formToleranceBps}
              setToleranceBps={setFormToleranceBps}
              quantityPercent={formQuantityPercent}
              setQuantityPercent={setFormQuantityPercent}
              autoHold={formAutoHold}
              setAutoHold={setFormAutoHold}
            />
            { error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isPending}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isPending}>
                { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <caption className="sr-only">Match tolerance rules — {data.length} rules</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Scope</TableHead>
              <TableHead>Amount Tolerance</TableHead>
              <TableHead>Qty Tolerance</TableHead>
              <TableHead>Auto-Hold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <Badge variant="outline">{SCOPE_LABELS[rule.scope]}</Badge>
                </TableCell>
                <TableCell className="font-mono">
                  {(rule.toleranceBps / 100).toFixed(2)}%
                </TableCell>
                <TableCell className="font-mono">
                  {rule.quantityTolerancePercent}%
                </TableCell>
                <TableCell>{rule.autoHold ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Match Tolerance Rule</DialogTitle>
            <DialogDescription>
              Define tolerance for PO–receipt–invoice matching. Invoices outside tolerance can be auto-held.
            </DialogDescription>
          </DialogHeader>
          <ToleranceForm
            scope={formScope}
            setScope={setFormScope}
            toleranceBps={formToleranceBps}
            setToleranceBps={setFormToleranceBps}
            quantityPercent={formQuantityPercent}
            setQuantityPercent={setFormQuantityPercent}
            autoHold={formAutoHold}
            setAutoHold={setFormAutoHold}
          />
          { error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending}>
              { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Match Tolerance Rule</DialogTitle>
            <DialogDescription>
              Update tolerance values. Scope cannot be changed after creation.
            </DialogDescription>
          </DialogHeader>
          <ToleranceForm
            scope={formScope}
            setScope={setFormScope}
            toleranceBps={formToleranceBps}
            setToleranceBps={setFormToleranceBps}
            quantityPercent={formQuantityPercent}
            setQuantityPercent={setFormQuantityPercent}
            autoHold={formAutoHold}
            setAutoHold={setFormAutoHold}
            scopeDisabled
          />
          { error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isPending}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isPending}>
              { isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ToleranceForm({
  scope,
  setScope,
  toleranceBps,
  setToleranceBps,
  quantityPercent,
  setQuantityPercent,
  autoHold,
  setAutoHold,
  scopeDisabled,
}: {
  scope: ToleranceScope;
  setScope: (s: ToleranceScope) => void;
  toleranceBps: string;
  setToleranceBps: (s: string) => void;
  quantityPercent: string;
  setQuantityPercent: (s: string) => void;
  autoHold: boolean;
  setAutoHold: (b: boolean) => void;
  scopeDisabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Scope</Label>
        <Select value={scope} onValueChange={(v) => setScope(v as ToleranceScope)} disabled={scopeDisabled}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ORG">Organization</SelectItem>
            <SelectItem value="COMPANY">Company</SelectItem>
            <SelectItem value="SITE">Site</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tolerance-bps">Amount Tolerance (basis points, 100 = 1%)</Label>
        <Input
          id="tolerance-bps"
          type="number"
          min={0}
          max={10000}
          value={toleranceBps}
          onChange={(e) => setToleranceBps(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="qty-percent">Quantity Tolerance (%)</Label>
        <Input
          id="qty-percent"
          type="number"
          min={0}
          step={0.1}
          value={quantityPercent}
          onChange={(e) => setQuantityPercent(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="auto-hold" checked={autoHold} onCheckedChange={setAutoHold} />
        <Label htmlFor="auto-hold">Auto-hold invoices over tolerance</Label>
      </div>
    </div>
  );
}
