'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DataTable, type Column } from '@/components/erp/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Briefcase, User2 } from 'lucide-react';
import type { Project, ProjectStatus, ProjectType } from '../types';
import { projectStatusConfig, projectTypeLabels } from '../types';
import { routes } from '@/lib/constants';

function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = projectStatusConfig[status];
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: ProjectType }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {projectTypeLabels[type]}
    </Badge>
  );
}

function ProjectProgress({ percent, overBudget }: { percent: number; overBudget?: boolean }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <Progress
        value={percent}
        className={cn('h-2 flex-1', overBudget && '[&>div]:bg-destructive')}
      />
      <span
        className={cn(
          'text-xs font-mono',
          overBudget ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        {percent}%
      </span>
    </div>
  );
}

function MarginIndicator({ margin }: { margin: number }) {
  const color =
    margin >= 25
      ? 'text-success'
      : margin >= 15
        ? 'text-warning dark:text-warning'
        : margin >= 0
          ? 'text-warning dark:text-warning'
          : 'text-destructive';

  return <span className={cn('font-mono text-sm', color)}>{margin.toFixed(1)}%</span>;
}

interface ProjectsTableProps {
  projects: Project[];
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export function ProjectsTable({ projects, pagination }: ProjectsTableProps) {
  const router = useRouter();

  const columns: Column<Project>[] = [
    {
      key: 'projectNumber',
      header: 'Project #',
      sortable: true,
      render: (project) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{project.projectNumber}</span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (project) => (
        <div className="max-w-[200px]">
          <div className="font-medium truncate">{project.name}</div>
          {project.customerName && (
            <div className="text-xs text-muted-foreground truncate">{project.customerName}</div>
          )}
        </div>
      ),
    },
    {
      key: 'projectType',
      header: 'Type',
      render: (project) => <TypeBadge type={project.projectType} />,
    },
    {
      key: 'projectManager',
      header: 'Manager',
      render: (project) => (
        <div className="flex items-center gap-1.5">
          <User2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">{project.projectManager}</span>
        </div>
      ),
    },
    {
      key: 'contractValue',
      header: 'Contract Value',
      align: 'right',
      sortable: true,
      render: (project) => (
        <span className="font-mono">
          {project.projectType === 'time_materials' || project.projectType === 'internal'
            ? '—'
            : formatCurrency(project.contractValue, project.currency)}
        </span>
      ),
    },
    {
      key: 'actualCost',
      header: 'Actual Cost',
      align: 'right',
      render: (project) => (
        <span
          className={cn(
            'font-mono',
            project.actualCost > project.budgetedCost && 'text-destructive'
          )}
        >
          {formatCurrency(project.actualCost, project.currency)}
        </span>
      ),
    },
    {
      key: 'billedAmount',
      header: 'Billed',
      align: 'right',
      render: (project) => (
        <div className="text-right">
          <div className="font-mono">{formatCurrency(project.billedAmount, project.currency)}</div>
          {project.unbilledAmount > 0 && (
            <div className="text-xs text-muted-foreground">
              +{formatCurrency(project.unbilledAmount, project.currency)} unbilled
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'percentComplete',
      header: 'Progress',
      render: (project) => (
        <ProjectProgress
          percent={project.percentComplete}
          overBudget={project.actualCost > project.budgetedCost}
        />
      ),
    },
    {
      key: 'profitMargin',
      header: 'Margin',
      align: 'right',
      sortable: true,
      render: (project) =>
        project.projectType === 'internal' ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <MarginIndicator margin={project.profitMargin} />
        ),
    },
    {
      key: 'endDate',
      header: 'End Date',
      sortable: true,
      render: (project) =>
        project.endDate ? (
          <span className="text-sm">{formatDate(project.endDate)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (project) => <StatusBadge status={project.status} />,
    },
  ];

  const handleRowClick = (project: Project) => {
    router.push(routes.finance.projectDetail(project.id));
  };

  return (
    <DataTable
      data={projects}
      columns={columns}
      searchPlaceholder="Search projects..."
      searchKeys={['projectNumber', 'name', 'customerName', 'projectManager']}
      onRowClick={handleRowClick}
      emptyState={{
        key: 'finance.projects',
        icon: Briefcase,
        action: (
          <Button asChild>
            <Link href={routes.finance.projectNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        ),
      }}
      pageSize={pagination?.perPage}
      actions={
        <Button asChild>
          <Link href={routes.finance.projectNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      }
    />
  );
}
