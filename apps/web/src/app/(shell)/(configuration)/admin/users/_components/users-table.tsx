'use client';

import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/erp';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminUserAction } from '../actions';

interface UserEntry {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
}

export function UsersTable({ users: initialUsers }: { users: UserEntry[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAction(userId: string, action: 'ban' | 'unban') {
    setError(null);
    startTransition(async () => {
      const result = await adminUserAction(userId, action);
      if (!result.ok) {
        setError(result.error ?? 'Action failed');
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: action === 'unban' } : u))
      );
    });
  }

  if (users.length === 0) {
    return <EmptyState contentKey="admin.users" size="sm" />;
  }

  return (
    <div className="space-y-2">
      { error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Table>
        <TableCaption className="sr-only">Platform users</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-mono text-xs">{user.email}</TableCell>
              <TableCell>{user.displayName}</TableCell>
              <TableCell className="font-mono text-xs">{user.tenantId.slice(0, 8)}</TableCell>
              <TableCell>
                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                  {user.isActive ? 'Active' : 'Banned'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                {user.isActive ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => handleAction(user.id, 'ban')}
                  >
                    Ban
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleAction(user.id, 'unban')}
                  >
                    Unban
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
