'use client';

import * as React from 'react';
import { CheckCircle, X, ExternalLink, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime, truncateId } from '@/lib/format';
import type { CommandReceipt } from '@/lib/types';

interface ReceiptPanelProps {
  /** The command receipt data. */
  receipt: CommandReceipt;
  /** Success heading text. */
  title: string;
  /** Called when the panel is dismissed. */
  onClose: () => void;
  /** Link to view the created document. */
  viewHref?: string;
  /** Link to navigate back to the list. */
  backHref?: string;
  className?: string;
}

function ReceiptPanel({
  receipt,
  title,
  onClose,
  viewHref,
  backHref,
  className,
}: ReceiptPanelProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('rounded-lg border border-success/30 bg-success/10 p-6', className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-success-foreground">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-success hover:bg-success/20"
          aria-label="Dismiss receipt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-success">Document</dt>
          <dd className="font-mono text-success-foreground">{receipt.resultRef}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-success">Completed at</dt>
          <dd className="text-success-foreground">{formatDateTime(receipt.completedAt)}</dd>
        </div>
        {receipt.auditRef && (
          <div className="flex justify-between">
            <dt className="text-success">Audit ref</dt>
            <dd className="font-mono text-success-foreground">{receipt.auditRef}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-success">Idempotency key</dt>
          <dd className="font-mono text-success-foreground">
            {truncateId(receipt.idempotencyKey)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        {viewHref && (
          <a
            href={viewHref}
            className="inline-flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-xs font-medium text-success-foreground hover:bg-success/90"
          >
            <ExternalLink className="h-3 w-3" />
            View Document
          </a>
        )}
        {backHref && (
          <a
            href={backHref}
            className="inline-flex items-center gap-1 rounded-md border border-success/30 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/20"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to List
          </a>
        )}
      </div>
    </div>
  );
}
ReceiptPanel.displayName = 'ReceiptPanel';

export { ReceiptPanel };
export type { ReceiptPanelProps };
