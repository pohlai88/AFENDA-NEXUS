"use client";

import { CheckCircle, X, ExternalLink, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime, truncateId } from "@/lib/format";
import type { CommandReceipt } from "@/lib/types";

interface ReceiptPanelProps {
  receipt: CommandReceipt;
  title: string;
  onClose: () => void;
  viewHref?: string;
  backHref?: string;
  className?: string;
}

export function ReceiptPanel({
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
      className={cn(
        "rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            {title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900"
          aria-label="Dismiss receipt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-emerald-600 dark:text-emerald-400">Document</dt>
          <dd className="font-mono text-emerald-800 dark:text-emerald-200">
            {receipt.resultRef}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-emerald-600 dark:text-emerald-400">Completed at</dt>
          <dd className="text-emerald-800 dark:text-emerald-200">
            {formatDateTime(receipt.completedAt)}
          </dd>
        </div>
        {receipt.auditRef && (
          <div className="flex justify-between">
            <dt className="text-emerald-600 dark:text-emerald-400">Audit ref</dt>
            <dd className="font-mono text-emerald-800 dark:text-emerald-200">
              {receipt.auditRef}
            </dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-emerald-600 dark:text-emerald-400">Idempotency key</dt>
          <dd className="font-mono text-emerald-800 dark:text-emerald-200">
            {truncateId(receipt.idempotencyKey)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        {viewHref && (
          <a
            href={viewHref}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <ExternalLink className="h-3 w-3" />
            View Document
          </a>
        )}
        {backHref && (
          <a
            href={backHref}
            className="inline-flex items-center gap-1 rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to List
          </a>
        )}
      </div>
    </div>
  );
}
