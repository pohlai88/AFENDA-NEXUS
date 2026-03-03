'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/erp/data-table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { routes } from '@/lib/constants';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Download,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  User,
} from 'lucide-react';
import type { WHTCertificate, WHTCertificateStatus, WHTType } from '../types';
import { whtStatusConfig } from '../types';
import {
  issueWHTCertificate,
  downloadWHTCertificatePDF,
  bulkIssueWHTCertificates,
} from '../actions/tax.actions';

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WHTCertificateStatus }) {
  const config = whtStatusConfig[status];
  return <Badge className={config.color}>{config.label}</Badge>;
}

// ─── Type Badge ──────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: WHTType }) {
  const isPayable = type === 'payable';
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1',
        isPayable ? 'border-destructive/30 text-destructive' : 'border-success/30 text-success'
      )}
    >
      {isPayable ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
      {isPayable ? 'Payable' : 'Receivable'}
    </Badge>
  );
}

// ─── Columns ─────────────────────────────────────────────────────────────────

const columns: Column<WHTCertificate>[] = [
  {
    key: 'certificateNumber',
    header: 'Certificate #',
    sortable: true,
    render: (cert) => <span className="font-mono font-medium">{cert.certificateNumber}</span>,
  },
  {
    key: 'type',
    header: 'Type',
    sortable: true,
    render: (cert) => <TypeBadge type={cert.type} />,
  },
  {
    key: 'party',
    header: 'Party',
    sortable: true,
    render: (cert) => {
      const name = cert.type === 'payable' ? cert.vendorName : cert.customerName;
      const Icon = cert.type === 'payable' ? Building2 : User;
      return (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground"  aria-hidden="true" />
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-xs text-muted-foreground font-mono">{cert.taxId}</div>
          </div>
        </div>
      );
    },
  },
  {
    key: 'issueDate',
    header: 'Issue Date',
    sortable: true,
    render: (cert) => formatDate(cert.issueDate),
  },
  {
    key: 'grossAmount',
    header: 'Gross Amount',
    sortable: true,
    className: 'text-right',
    render: (cert) => (
      <span className="font-mono">{formatCurrency(cert.grossAmount, cert.currency)}</span>
    ),
  },
  {
    key: 'taxRate',
    header: 'Rate',
    className: 'text-right',
    render: (cert) => <span className="font-mono">{cert.taxRate}%</span>,
  },
  {
    key: 'taxAmount',
    header: 'Tax Amount',
    sortable: true,
    className: 'text-right',
    render: (cert) => (
      <span className="font-mono font-medium">{formatCurrency(cert.taxAmount, cert.currency)}</span>
    ),
  },
  {
    key: 'incomeType',
    header: 'Income Type',
    render: (cert) => cert.incomeType,
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (cert) => <StatusBadge status={cert.status} />,
  },
];

// ─── Bulk Actions ────────────────────────────────────────────────────────────

interface BulkActionsProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
}

function BulkActions({ selectedIds, onClearSelection }: BulkActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleBulkIssue = () => {
    startTransition(async () => {
      const result = await bulkIssueWHTCertificates(Array.from(selectedIds));

      if (result.ok) {
        toast.success(`Issued ${result.data.issuedCount} certificates`);
        onClearSelection();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
      <Button size="sm" onClick={handleBulkIssue} disabled={isPending}>
        <Send className="mr-2 h-4 w-4" />
        Issue Selected
      </Button>
    </div>
  );
}

// ─── Action Cell ──────────────────────────────────────────────────────────────

function ActionCell({ cert }: { cert: WHTCertificate }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleIssue = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const result = await issueWHTCertificate(cert.id);
      if (result.ok) {
        toast.success('Certificate issued');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await downloadWHTCertificatePDF(cert.id);
    if (result.ok) {
      window.open(result.data.url, '_blank');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {cert.status === 'draft' ? (
        <Button size="sm" variant="outline" onClick={handleIssue} disabled={isPending}>
          <Send className="mr-1 h-3 w-3" />
          Issue
        </Button>
      ) : (
        <Button size="sm" variant="ghost" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ─── WHT Certificates Table ──────────────────────────────────────────────────

interface WHTCertificatesTableProps {
  certificates: WHTCertificate[];
}

export function WHTCertificatesTable({ certificates }: WHTCertificatesTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleRowClick = (cert: WHTCertificate) => {
    router.push(`${routes.finance.tax}/wht/${cert.id}`);
  };

  const actionsColumn: Column<WHTCertificate> = {
    key: 'actions',
    header: '',
    className: 'w-[120px]',
    render: (cert) => <ActionCell cert={cert} />,
  };

  const allColumns = [...columns, actionsColumn];

  return (
    <DataTable
      data={certificates}
      columns={allColumns}
      keyField="id"
      onRowClick={handleRowClick}
      selectable
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      searchable
      searchPlaceholder="Search certificates..."
      emptyState={{
        key: 'finance.tax.whtCerts',
        icon: FileText,
        action: {
          label: 'Create Certificate',
          href: `${routes.finance.tax}/wht/new`,
        },
      }}
      actions={
        selectedIds.size > 0 ? (
          <BulkActions
            selectedIds={selectedIds}
            onClearSelection={() => setSelectedIds(new Set())}
          />
        ) : (
          <Button asChild>
            <Link href={`${routes.finance.tax}/wht/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Certificate
            </Link>
          </Button>
        )
      }
    />
  );
}
