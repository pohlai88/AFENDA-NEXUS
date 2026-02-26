'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DataTable, type Column } from '@/components/erp/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Landmark, Building2, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { IntercompanyLoan, ICLoanStatus, ICLoanType } from '../types';
import { icLoanStatusConfig, icLoanTypeLabels } from '../types';
import { routes } from '@/lib/constants';

function StatusBadge({ status }: { status: ICLoanStatus }) {
  const config = icLoanStatusConfig[status];
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: ICLoanType }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {icLoanTypeLabels[type]}
    </Badge>
  );
}

function ArmLengthIndicator({ isCompliant }: { isCompliant: boolean }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs',
        isCompliant ? 'text-success' : 'text-warning'
      )}
    >
      {isCompliant ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Arm's Length
        </>
      ) : (
        <>
          <AlertTriangle className="h-3.5 w-3.5" />
          Review
        </>
      )}
    </span>
  );
}

interface ICLoansTableProps {
  loans: IntercompanyLoan[];
}

export function ICLoansTable({ loans }: ICLoansTableProps) {
  const router = useRouter();

  const columns: Column<IntercompanyLoan>[] = [
    {
      key: 'loanNumber',
      header: 'Loan #',
      sortable: true,
      render: (loan) => (
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-medium">{loan.loanNumber}</span>
        </div>
      ),
    },
    {
      key: 'lenderEntityName',
      header: 'Lender → Borrower',
      render: (loan) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="truncate max-w-[100px]">{loan.lenderEntityName}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="truncate max-w-[100px]">{loan.borrowerEntityName}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (loan) => <TypeBadge type={loan.type} />,
    },
    {
      key: 'principal',
      header: 'Principal',
      align: 'right',
      sortable: true,
      render: (loan) => (
        <span className="font-mono">{formatCurrency(loan.principal, loan.currency)}</span>
      ),
    },
    {
      key: 'outstandingBalance',
      header: 'Outstanding',
      align: 'right',
      sortable: true,
      render: (loan) => (
        <span className="font-mono">{formatCurrency(loan.outstandingBalance, loan.currency)}</span>
      ),
    },
    {
      key: 'interestRate',
      header: 'Rate',
      align: 'right',
      render: (loan) => (
        <div className="text-right">
          <div className="font-mono">{loan.interestRate.toFixed(2)}%</div>
          <div className="text-xs text-muted-foreground">
            {loan.rateType === 'fixed' ? 'Fixed' : `${loan.referenceRate} +${loan.spread}%`}
          </div>
        </div>
      ),
    },
    {
      key: 'accruedInterest',
      header: 'Accrued',
      align: 'right',
      render: (loan) => (
        <span className="font-mono text-warning">
          {formatCurrency(loan.accruedInterest, loan.currency)}
        </span>
      ),
    },
    {
      key: 'maturityDate',
      header: 'Maturity',
      sortable: true,
      render: (loan) => <span className="text-sm">{formatDate(loan.maturityDate)}</span>,
    },
    {
      key: 'isArmLength',
      header: 'Transfer Pricing',
      render: (loan) => <ArmLengthIndicator isCompliant={loan.isArmLength} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (loan) => <StatusBadge status={loan.status} />,
    },
  ];

  const handleRowClick = (loan: IntercompanyLoan) => {
    router.push(routes.finance.treasuryLoanDetail(loan.id));
  };

  return (
    <DataTable
      data={loans}
      columns={columns}
      searchPlaceholder="Search loans..."
      searchKeys={['loanNumber', 'lenderEntityName', 'borrowerEntityName']}
      onRowClick={handleRowClick}
      emptyState={{
        icon: Building2,
        title: 'No intercompany loans',
        description: 'Set up intercompany loan tracking for transfer pricing compliance.',
        action: (
          <Button asChild>
            <Link href={routes.finance.treasuryLoanNew}>
              <Plus className="mr-2 h-4 w-4" />
              New IC Loan
            </Link>
          </Button>
        ),
      }}
      actions={
        <Button asChild>
          <Link href={routes.finance.treasuryLoanNew}>
            <Plus className="mr-2 h-4 w-4" />
            New IC Loan
          </Link>
        </Button>
      }
    />
  );
}
