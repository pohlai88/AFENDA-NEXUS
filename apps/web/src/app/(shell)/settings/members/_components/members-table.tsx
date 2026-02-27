'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveOrganization } from '@/lib/auth-client';
import { updateMemberRoleAction, removeMemberAction } from '@/lib/member-actions';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2 } from 'lucide-react';

const ROLE_OPTIONS = ['owner', 'admin', 'accountant', 'clerk', 'viewer', 'member'] as const;

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  accountant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  clerk: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  member: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

interface Member {
  id: string;
  userId: string;
  role: string;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export function MembersTable({ currentUserId }: { currentUserId: string }) {
  const { data: activeOrg } = useActiveOrganization();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const members: Member[] = (activeOrg as unknown as { members?: Member[] })?.members ?? [];

  function handleRoleChange(memberId: string, newRole: string) {
    setError(null);
    setPendingId(memberId);
    startTransition(async () => {
      const result = await updateMemberRoleAction({ memberId, role: newRole });
      setPendingId(null);
      if (!result.ok) {
        setError(result.error ?? 'Failed to update role');
      } else {
        router.refresh();
      }
    });
  }

  function handleRemove(memberId: string) {
    setError(null);
    setPendingId(memberId);
    startTransition(async () => {
      const result = await removeMemberAction({ memberId });
      setPendingId(null);
      if (!result.ok) {
        setError(result.error ?? 'Failed to remove member');
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      <Table>
        <TableCaption className="sr-only">Organization members</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="col-actions">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                No members found.
              </TableCell>
            </TableRow>
          )}
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            const isProcessing = isPending && pendingId === member.id;

            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {member.user.name}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">{member.user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {member.role === 'owner' ? (
                    <Badge className={ROLE_COLORS.owner}>Owner</Badge>
                  ) : (
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value)}
                      disabled={isProcessing}
                    >
                      <SelectTrigger
                        className="w-[140px]"
                        aria-label={`Change role for ${member.user.name}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.filter((r) => r !== 'owner').map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {member.role !== 'owner' && !isCurrentUser && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(member.id)}
                      disabled={isProcessing}
                      aria-label={`Remove ${member.user.name}`}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
