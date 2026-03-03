'use client';

import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { DateCell } from '@/components/erp/date-cell';
import { Badge } from '@/components/ui/badge';
import { useMessageSse } from '@/features/portal/hooks/use-message-sse';
import type { PortalMessage, PortalMessageThread } from '@/features/portal/queries/portal.queries';
import type {
  sendMessageAction as SendMessageAction,
  markMessageReadAction as MarkReadAction,
} from '@/features/portal/actions/portal.actions';

const sendSchema = z.object({
  body: z.string().min(1, 'Message is required').max(4000),
});

type SendValues = z.infer<typeof sendSchema>;

interface Props {
  supplierId: string;
  thread: PortalMessageThread;
  initialMessages: PortalMessage[];
  userId: string;
  sendMessage: typeof SendMessageAction;
  markRead: typeof MarkReadAction;
  refreshAction: (
    supplierId: string,
    threadId: string
  ) => Promise<{ ok: boolean; value?: { items: PortalMessage[] } }>;
}

/**
 * Phase 1.2.1 CAP-MSG — Chat UI with SUPPLIER/BUYER bubble layout and read receipts.
 *
 * - SUPPLIER messages: right-aligned (bg-primary)
 * - BUYER messages: left-aligned (bg-muted)
 * - Auto-scroll to bottom on new messages
 * - SSE-driven refresh
 */
export function PortalChatThread({
  supplierId,
  thread,
  initialMessages,
  userId,
  sendMessage,
  markRead,
  refreshAction,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<PortalMessage[]>(initialMessages);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, startSend] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const form = useForm<SendValues>({
    resolver: zodResolver(sendSchema),
    defaultValues: { body: '' },
  });

  // Auto-scroll to bottom when messages change.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark unread buyer messages as read when the thread is opened.
  useEffect(() => {
    const unread = initialMessages.filter((m) => m.senderType === 'BUYER' && !m.readAt);
    for (const m of unread) {
      void markRead(supplierId, m.id, userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => {
    startRefresh(async () => {
      const result = await refreshAction(supplierId, thread.id);
      if (result.ok && result.value) {
        setMessages(result.value.items);
      }
      router.refresh();
    });
  }, [refreshAction, router, supplierId, thread.id]);

  // SSE: refresh when server pushes updates.
  useMessageSse({ supplierId, onUpdate: refresh });

  function onSend(values: SendValues) {
    setSendError(null);
    startSend(async () => {
      const idempotencyKey = crypto.randomUUID();
      const result = await sendMessage(supplierId, thread.id, {
        body: values.body,
        idempotencyKey,
      });

      if (!result.ok) {
        setSendError(result.error.message);
        return;
      }

      form.reset();
      setMessages((prev) => [...prev, result.value]);
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Thread Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{thread.subject}</h2>
          <p className="text-xs text-muted-foreground">
            Thread started <DateCell date={thread.createdAt} format="short" />
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
          className="gap-1.5"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Message Bubbles */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Send the first message below.
          </p>
        ) : (
          messages.map((msg) => {
            const isSupplier = msg.senderType === 'SUPPLIER';
            return (
              <div
                key={msg.id}
                className={cn('flex', isSupplier ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                    isSupplier
                      ? 'rounded-tr-sm bg-primary text-primary-foreground'
                      : 'rounded-tl-sm bg-muted text-foreground'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <div
                    className={cn(
                      'mt-1 flex items-center gap-1.5 text-[10px]',
                      isSupplier
                        ? 'text-primary-foreground/70 justify-end'
                        : 'text-muted-foreground'
                    )}
                  >
                    <DateCell date={msg.createdAt} format="long" />
                    {isSupplier && msg.readAt && (
                      <Badge
                        variant="outline"
                        className="border-primary-foreground/30 text-[9px] px-1 py-0 text-primary-foreground/70"
                      >
                        Read
                      </Badge>
                    )}
                    {msg.proofHash && (
                      <span className="font-mono opacity-50" title={`Proof: ${msg.proofHash}`}>
                        [{msg.proofHash.slice(0, 7)}]
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose Area */}
      <div className="border-t p-4">
        {sendError && (
          <div className="mb-2 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {sendError}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSend)} className="flex gap-2 items-end">
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      placeholder="Type a message…"
                      rows={2}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          form.handleSubmit(onSend)();
                        }
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isSending}
              className="flex-shrink-0 h-10 w-10"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </Form>
        <p className="mt-1 text-[10px] text-muted-foreground">Press Ctrl+Enter / ⌘+Enter to send</p>
      </div>
    </div>
  );
}
