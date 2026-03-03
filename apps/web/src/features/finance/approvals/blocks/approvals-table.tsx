'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type ColumnDef } from '@/components/erp/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PromptDialog } from '@/components/erp/prompt-dialog';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import {
  FileText,
  Receipt,
  HandCoins,
  Wallet,
  ArrowLeftRight,
  Trash2,
  CheckCircle,
  XCircle,
  Forward,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { ApprovalItem, ApprovalDocumentType, SLAStatus } from '../types';
import { documentTypeLabels, slaStatusConfig } from '../types';
import { approveItems, rejectItems } from '../actions/approvals.actions';
import { toast } from 'sonner';
import { routes } from '@/lib/constants';

// ─── Icon Map ────────────────────────────────────────────────────────────────

const documentIconMap: Record<ApprovalDocumentType, React.ElementType> = {
  JOURNAL: FileText,
  AP_INVOICE: Receipt,
  AR_INVOICE: HandCoins,
  EXPENSE_CLAIM: Wallet,
  PURCHASE_ORDER: Receipt,
  PAYMENT: Receipt,
  IC_TRANSACTION: ArrowLeftRight,
  ASSET_DISPOSAL: Trash2,
  BUDGET_TRANSFER: ArrowLeftRight,
};

// ─── SLA Badge ───────────────────────────────────────────────────────────────

function SLABadge({ status, hoursRemaining }: { status: SLAStatus; hoursRemaining: number }) {
  const config = slaStatusConfig[status];
  const Icon = status === 'BREACHED' ? AlertTriangle : status === 'AT_RISK' ? Clock : CheckCircle;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3"  aria-hidden="true" />
      {status === 'BREACHED' ? (
        <span>{Math.abs(hoursRemaining)}h overdue</span>
      ) : (
        <span>{hoursRemaining}h</span>
      )}
    </Badge>
  );
}

// ─── Columns ─────────────────────────────────────────────────────────────────

function createColumns(): ColumnDef<ApprovalItem>[] {
  return [
    {
      id: 'documentType',
      header: 'Type',
      accessorFn: (row) => {
        const Icon = documentIconMap[row.documentType] ?? FileText;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground"  aria-hidden="true" />
            <span className="text-xs text-muted-foreground">
              {documentTypeLabels[row.documentType]}
            </span>
          </div>
        );
      },
      sortable: true,
      sortFn: (a, b) => a.documentType.localeCompare(b.documentType),
    },
    {
      id: 'document',
      header: 'Document',
      accessorFn: (row) => (
        <div>
          <div className="font-medium">{row.documentNumber}</div>
          <div className="text-sm text-muted-foreground line-clamp-1">{row.description}</div>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.documentNumber.localeCompare(b.documentNumber),
    },
    {
      id: 'amount',
      header: 'Amount',
      className: 'text-right',
      accessorFn: (row) => (
        <div className="text-right font-tabular-nums">
          {formatCurrency(row.amount, row.currency)}
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.amount - b.amount,
    },
    {
      id: 'requestedBy',
      header: 'Requested By',
      accessorFn: (row) => (
        <div>
          <div>{row.requestedByName}</div>
          <div className="text-xs text-muted-foreground">{formatRelativeTime(row.requestedAt)}</div>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.requestedByName.localeCompare(b.requestedByName),
    },
    {
      id: 'workflow',
      header: 'Step',
      accessorFn: (row) => (
        <div className="text-center">
          <span className="text-sm font-medium">
            {row.stepNumber}/{row.totalSteps}
          </span>
        </div>
      ),
    },
    {
      id: 'sla',
      header: 'SLA',
      accessorFn: (row) => (
        <SLABadge status={row.slaStatus} hoursRemaining={row.slaHoursRemaining} />
      ),
      sortable: true,
      sortFn: (a, b) => a.slaHoursRemaining - b.slaHoursRemaining,
    },
  ];
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

interface BulkActionsProps {
  selectedIds: Set<string>;
  onClear: () => void;
}

function BulkActions({ selectedIds, onClear }: BulkActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveItems({ itemIds: Array.from(selectedIds) });
      if (result.ok) {
        toast.success(result.data.message);
        onClear();
        router.refresh();
      } else {
        toast.error('error' in result ? String(result.error) : 'Unknown error');
      }
    });
  };

  const handleReject = (comment: string) => {
    startTransition(async () => {
      const result = await rejectItems({ itemIds: Array.from(selectedIds), comment });
      if (result.ok) {
        toast.success(result.data.message);
        onClear();
        router.refresh();
      } else {
        toast.error('error' in result ? String(result.error) : 'Unknown error');
      }
    });
  };

  return (
    <>
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="default"
        onClick={handleApprove}
        disabled={isPending}
        className="gap-1"
      >
        <CheckCircle className="h-4 w-4" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setRejectOpen(true)}
        disabled={isPending}
        className="gap-1"
      >
        <XCircle className="h-4 w-4" />
        Reject
      </Button>
      <Button size="sm" variant="ghost" disabled={isPending} className="gap-1">
        <Forward className="h-4 w-4" />
        Delegate
      </Button>
    </div>

      <PromptDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Items"
        description="Please provide a reason for rejection."
        inputLabel="Reason"
        placeholder="Enter rejection reason…"
        submitLabel="Reject"
        onSubmit={handleReject}
      />
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface ApprovalsTableProps {
  items: ApprovalItem[];
  pagination?: {
    page: number;
    totalPages: number;
    searchParams?: Record<string, string | undefined>;
  };
  loading?: boolean;
}

export function ApprovalsTable({ items, pagination, loading }: ApprovalsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const columns = createColumns();

  const handleRowClick = (item: ApprovalItem) => {
    // Navigate to the source document
    const documentRoutes: Record<ApprovalDocumentType, string> = {
      JOURNAL: routes.finance.journalDetail(item.documentId),
      AP_INVOICE: routes.finance.payableDetail(item.documentId),
      AR_INVOICE: routes.finance.receivableDetail(item.documentId),
      EXPENSE_CLAIM: routes.finance.expenseDetail(item.documentId),
      PURCHASE_ORDER: `/purchasing/orders/${item.documentId}`,
      PAYMENT: routes.finance.paymentDetail(item.documentId),
      IC_TRANSACTION: routes.finance.icTransactionDetail(item.documentId),
      ASSET_DISPOSAL: routes.finance.assetDisposalDetail(item.documentId),
      BUDGET_TRANSFER: routes.finance.budgetTransferDetail(item.documentId),
    };
    router.push(documentRoutes[item.documentType]);
  };

  return (
    <DataTable
      columns={columns}
      data={items}
      keyFn={(item) => item.id}
      onRowClick={handleRowClick}
      loading={loading}
      loadingRows={5}
      emptyState={{ key: 'finance.approvals' }}
      selectable
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      bulkActions={
        <BulkActions selectedIds={selectedIds} onClear={() => setSelectedIds(new Set())} />
      }
      searchPlaceholder="Search approvals..."
      searchFn={(item, query) => {
        const q = query.toLowerCase();
        return (
          item.documentNumber.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.requestedByName.toLowerCase().includes(q) ||
          documentTypeLabels[item.documentType].toLowerCase().includes(q)
        );
      }}
      pagination={
        pagination
          ? {
              page: pagination.page,
              totalPages: pagination.totalPages,
              baseUrl: routes.finance.approvals,
              searchParams: pagination.searchParams,
            }
          : undefined
      }
    />
  );
}
