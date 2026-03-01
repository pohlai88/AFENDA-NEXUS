'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { adminTenantAction } from '../actions';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  planTier: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  DEACTIVATED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function TenantsTable({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAction(tenantId: string, action: 'suspend' | 'reactivate') {
    setError(null);
    setPendingId(tenantId);
    startTransition(async () => {
      const result = await adminTenantAction(tenantId, action);
      setPendingId(null);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? 'Action failed');
      }
    });
  }

  return (
    <div className="space-y-4">
      { error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}

      <Table>
        <TableCaption className="sr-only">Platform tenants</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No tenants found.
              </TableCell>
            </TableRow>
          )}
          {tenants.map((t) => {
            const isProcessing = isPending && pendingId === t.id;
            return (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{t.slug}</TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[t.status] ?? ''}>{t.status}</Badge>
                </TableCell>
                <TableCell className="text-sm">{t.planTier}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(t.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {t.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(t.id, 'suspend')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Suspend'}
                    </Button>
                  ) : t.status === 'SUSPENDED' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(t.id, 'reactivate')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reactivate'}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
