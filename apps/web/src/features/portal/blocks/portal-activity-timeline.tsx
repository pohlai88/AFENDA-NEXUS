'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/erp/status-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  ShieldCheck,
  Briefcase,
  Upload,
  UserCheck,
  Ban,
  LogIn,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { PortalAuditLogList } from '../queries/portal.queries';

// ─── Constants ──────────────────────────────────────────────────────────────

const ACTION_ICONS: Record<string, React.ElementType> = {
  INSERT: FileText,
  UPDATE: Pencil,
  DELETE: Ban,
  LOGIN: LogIn,
  SUBMIT: Upload,
  APPROVE: UserCheck,
  REJECT: Ban,
  UPLOAD: Upload,
  RENEW: ShieldCheck,
  ESCALATE: Briefcase,
};

const RESOURCE_LABELS: Record<string, string> = {
  supplier: 'Profile',
  supplier_invoice: 'Invoice',
  supplier_case: 'Case',
  supplier_case_timeline: 'Case Timeline',
  supplier_document: 'Document',
  supplier_bank_account: 'Bank Account',
  supplier_compliance_item: 'Compliance',
  supplier_compliance_alert_log: 'Compliance Alert',
  supplier_dispute: 'Dispute',
  supplier_onboarding: 'Onboarding',
  supplier_message: 'Message',
};

const RESOURCE_OPTIONS = [
  { value: 'all', label: 'All Resources' },
  { value: 'supplier', label: 'Profile' },
  { value: 'supplier_invoice', label: 'Invoices' },
  { value: 'supplier_case', label: 'Cases' },
  { value: 'supplier_document', label: 'Documents' },
  { value: 'supplier_compliance_item', label: 'Compliance' },
  { value: 'supplier_bank_account', label: 'Bank Accounts' },
  { value: 'supplier_dispute', label: 'Disputes' },
  { value: 'supplier_onboarding', label: 'Onboarding' },
];

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'INSERT', label: 'Created' },
  { value: 'UPDATE', label: 'Updated' },
  { value: 'SUBMIT', label: 'Submitted' },
  { value: 'APPROVE', label: 'Approved' },
  { value: 'REJECT', label: 'Rejected' },
  { value: 'UPLOAD', label: 'Uploaded' },
  { value: 'RENEW', label: 'Renewed' },
];

function actionVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (action) {
    case 'DELETE':
    case 'REJECT':
      return 'destructive';
    case 'APPROVE':
    case 'RENEW':
      return 'default';
    case 'LOGIN':
    case 'LOGOUT':
      return 'secondary';
    default:
      return 'outline';
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

interface PortalActivityTimelineProps {
  data: PortalAuditLogList;
}

export function PortalActivityTimeline({ data }: PortalActivityTimelineProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (params: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(searchParams?.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value && value !== 'all') {
          sp.set(key, value);
        } else {
          sp.delete(key);
        }
      }
      return sp.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (key: string, value: string) => {
    const qs = createQueryString({ [key]: value, page: undefined });
    router.push(`${pathname}?${qs}`);
  };

  const handlePageChange = (newPage: number) => {
    const qs = createQueryString({ page: String(newPage) });
    router.push(`${pathname}?${qs}`);
  };

  const currentAction = searchParams?.get('action') ?? 'all';
  const currentResource = searchParams?.get('resource') ?? 'all';
  const totalPages = Math.ceil(data.total / data.limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={currentResource} onValueChange={(v) => handleFilterChange('resource', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by resource" />
          </SelectTrigger>
          <SelectContent>
            {RESOURCE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentAction} onValueChange={(v) => handleFilterChange('action', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="ml-auto text-sm text-muted-foreground">
          {data.total} {data.total === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Table */}
      {data.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No activity entries found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <caption className="sr-only">
                  Audit log — page {data.page} of {totalPages}
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((entry) => {
                    const Icon = ACTION_ICONS[entry.action] ?? FileText;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          <time dateTime={entry.occurredAt}>
                            {new Date(entry.occurredAt).toLocaleDateString('en-ZA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                            <StatusBadge
                              status={entry.action}
                              variant={actionVariant(entry.action)}
                              showIcon={false}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {RESOURCE_LABELS[entry.resource] ?? entry.resource}
                        </TableCell>
                        <TableCell className="text-sm">{entry.description}</TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          {entry.ipAddress ?? '\u2014'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => handlePageChange(data.page - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= totalPages}
              onClick={() => handlePageChange(data.page + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
