'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { routes } from '@/lib/constants';
import type { startThreadAction as StartThreadAction } from '@/features/portal/actions/portal.actions';

const schema = z.object({
  subject: z.string().min(2, 'Subject must be at least 2 characters').max(200),
  initialMessageBody: z.string().min(1, 'Message is required').max(4000),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  supplierId: string;
  startThread: typeof StartThreadAction;
}

/**
 * Phase 1.2.1 CAP-MSG — Dialog form for starting a new message thread.
 */
export function PortalNewThreadDialog({ supplierId, startThread }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', initialMessageBody: '' },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    startTransition(async () => {
      const idempotencyKey = crypto.randomUUID();
      const result = await startThread(supplierId, {
        subject: values.subject,
        initialMessageBody: values.initialMessageBody,
        idempotencyKey,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setOpen(false);
      form.reset();
      router.push(routes.portal.messageThread(result.value.id));
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a New Conversation</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Invoice #1234 query" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialMessageBody"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write your message here..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                <Send className="h-4 w-4" />
                {isPending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
