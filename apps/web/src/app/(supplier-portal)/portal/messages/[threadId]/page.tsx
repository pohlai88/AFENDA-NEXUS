import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getRequestContext } from '@/lib/auth';
import {
  getPortalSupplier,
  getPortalMessageThreads,
  getPortalMessages,
} from '@/features/portal/queries/portal.queries';
import {
  getMessagesAction,
  sendMessageAction,
  markMessageReadAction,
} from '@/features/portal/actions/portal.actions';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { AlertTriangle } from 'lucide-react';
import { routes } from '@/lib/constants';
import { PortalChatThread } from '@/features/portal/blocks/portal-chat-thread';
import type { RequestContext } from '@afenda/core';

interface Props {
  params: Promise<{ threadId: string }>;
}

/**
 * Phase 1.2.1 CAP-MSG — Supplier Portal: Individual message thread / chat view.
 * Route: /portal/messages/[threadId]
 */

async function MessageThreadPageContent({
  ctx,
  threadId,
}: {
  ctx: RequestContext;
  threadId: string;
}) {
  const supplierResult = await getPortalSupplier(ctx);
  if (!supplierResult.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">Unable to load supplier profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">{supplierResult.error.message}</p>
      </div>
    );
  }

  const supplier = supplierResult.value;

  // Fetch threads to find this specific thread.
  const threadsResult = await getPortalMessageThreads(ctx, supplier.supplierId, {
    includeArchived: true,
  });
  const thread = threadsResult.ok
    ? threadsResult.value.items.find((t) => t.id === threadId)
    : undefined;

  if (!thread) {
    notFound();
  }

  const messagesResult = await getPortalMessages(ctx, supplier.supplierId, threadId);
  const messages = messagesResult.ok ? messagesResult.value.items : [];

  // Server action adapters for the client component.
  async function refreshMessages(sid: string, tid: string) {
    'use server';
    return getMessagesAction(sid, tid);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-0">
      <PageHeader
        title={thread.subject}
        description="Message thread"
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Messages', href: routes.portal.messages },
          { label: thread.subject },
        ]}
      />

      <div className="flex-1 rounded-lg border overflow-hidden min-h-0">
        <PortalChatThread
          supplierId={supplier.supplierId}
          thread={thread}
          initialMessages={messages}
          userId={ctx.userId ?? ''}
          sendMessage={sendMessageAction}
          markRead={markMessageReadAction}
          refreshAction={refreshMessages}
        />
      </div>
    </div>
  );
}

export default async function PortalMessageThreadPage({ params }: Props) {
  const { threadId } = await params;
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <MessageThreadPageContent ctx={ctx} threadId={threadId} />
    </Suspense>
  );
}
