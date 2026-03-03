'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, RefreshCw, Inbox, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DateCell } from '@/components/erp/date-cell';
import { useMessageSse } from '@/features/portal/hooks/use-message-sse';
import { routes } from '@/lib/constants';
import type { PortalMessageThread } from '@/features/portal/queries/portal.queries';

interface Props {
  supplierId: string;
  initialThreads: PortalMessageThread[];
  initialHasMore: boolean;
  onNewThread?: () => void;
  refreshAction: (supplierId: string) => Promise<{
    ok: boolean;
    value?: { items: PortalMessageThread[]; hasMore: boolean };
  }>;
}

/**
 * Phase 1.2.1 CAP-MSG — Thread list with SSE-driven refresh and unread badges.
 */
export function PortalMessageThreadList({
  supplierId,
  initialThreads,
  initialHasMore: _initialHasMore,
  onNewThread,
  refreshAction,
}: Props) {
  const router = useRouter();
  const [threads, setThreads] = useState<PortalMessageThread[]>(initialThreads);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      const result = await refreshAction(supplierId);
      if (result.ok && result.value) {
        setThreads(result.value.items);
      }
      // Also re-validate RSC cache.
      router.refresh();
    });
  }, [refreshAction, router, supplierId]);

  // SSE: push-refresh when the server emits a message event.
  useMessageSse({ supplierId, onUpdate: refresh });

  if (threads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-sm font-medium">No messages yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Start a new conversation with your buyer contact.
        </p>
        {onNewThread && (
          <Button onClick={onNewThread} className="mt-4" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            New Message
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{threads.length} thread(s)</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isPending}
          className="gap-1.5"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {threads.map((thread) => {
        const unread = thread.supplierUnreadCount;
        return (
          <button
            key={thread.id}
            type="button"
            className="w-full text-left"
            onClick={() => router.push(routes.portal.messageThread(thread.id))}
          >
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-start justify-between gap-3 py-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {unread > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p
                      className={cn(
                        'truncate text-sm',
                        unread > 0 ? 'font-semibold' : 'font-medium'
                      )}
                    >
                      {thread.subject}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {thread.lastMessageBy && (
                        <Badge variant="outline" className="text-[10px]">
                          {thread.lastMessageBy === 'SUPPLIER' ? 'You' : 'Buyer'}
                        </Badge>
                      )}
                      {thread.lastMessageAt && (
                        <DateCell date={thread.lastMessageAt} format="short" />
                      )}
                    </div>
                  </div>
                </div>
                {unread > 0 && <Badge className="flex-shrink-0 text-xs">{unread} new</Badge>}
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────

export function PortalMessageThreadListError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h2 className="mt-4 text-lg font-semibold">Unable to load messages</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
