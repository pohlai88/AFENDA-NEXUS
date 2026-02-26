'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Briefcase,
  Edit,
  MoreHorizontal,
  ChevronLeft,
  Calendar,
  User2,
  Building2,
  Calculator,
  Receipt,
  DollarSign,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  Archive,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { updateProjectStatus, calculateWIP } from '../actions/projects.actions';
import type {
  Project,
  ProjectCost,
  ProjectBilling,
  ProjectMilestone,
  WIPCalculation,
  ProjectStatus,
  CostType,
  MilestoneStatus,
} from '../types';
import {
  projectStatusConfig,
  projectTypeLabels,
  billingMethodLabels,
  costTypeLabels,
  milestoneStatusConfig,
} from '../types';
import { routes } from '@/lib/constants';

// ─── Header ──────────────────────────────────────────────────────────────────

interface ProjectHeaderProps {
  project: Project;
}

function ProjectHeader({ project }: ProjectHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: ProjectStatus) => {
    startTransition(async () => {
      const result = await updateProjectStatus(project.id, status);
      if (result.ok) {
        toast.success(`Project status updated to ${projectStatusConfig[status].label}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleCalculateWIP = () => {
    startTransition(async () => {
      const result = await calculateWIP(project.id);
      if (result.ok) {
        toast.success(`WIP calculated: ${formatCurrency(result.wipAmount, project.currency)}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={routes.finance.projects}
            className="hover:text-foreground flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Projects
          </Link>
          <span>/</span>
          <span>{project.projectNumber}</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <Badge className={projectStatusConfig[project.status].color}>
            {projectStatusConfig[project.status].label}
          </Badge>
        </div>
        {project.customerName && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{project.customerName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleCalculateWIP} disabled={isPending}>
          <Calculator className="mr-2 h-4 w-4" />
          Calculate WIP
        </Button>
        <Button asChild variant="outline">
          <Link href={routes.finance.projectBilling(project.id)}>
            <Receipt className="mr-2 h-4 w-4" />
            Create Billing
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={routes.finance.projectEdit(project.id)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusChange('active')} disabled={isPending}>
              <Play className="mr-2 h-4 w-4" />
              Set Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('on_hold')} disabled={isPending}>
              <Pause className="mr-2 h-4 w-4" />
              Put On Hold
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('completed')} disabled={isPending}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Completed
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleStatusChange('cancelled')}
              disabled={isPending}
              className="text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Value Summary ───────────────────────────────────────────────────────────

interface ValueSummaryProps {
  project: Project;
  wip?: WIPCalculation;
}

function ValueSummary({ project, wip }: ValueSummaryProps) {
  const isOverBudget = project.actualCost > project.budgetedCost;
  const budgetVariance = project.budgetedCost - project.actualCost;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-muted-foreground">Contract Value</span>
            <div className="text-lg font-bold">
              {project.projectType === 'time_materials' || project.projectType === 'internal'
                ? '—'
                : formatCurrency(project.contractValue, project.currency)}
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Budgeted Cost</span>
            <div className="text-lg font-bold">
              {formatCurrency(project.budgetedCost, project.currency)}
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-muted-foreground">Actual Cost</span>
            <div className={cn('text-lg font-bold', isOverBudget && 'text-destructive')}>
              {formatCurrency(project.actualCost, project.currency)}
            </div>
            <span className={cn('text-xs', isOverBudget ? 'text-destructive' : 'text-success')}>
              {isOverBudget ? 'Over' : 'Under'} by{' '}
              {formatCurrency(Math.abs(budgetVariance), project.currency)}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Profit Margin</span>
            <div
              className={cn(
                'text-lg font-bold',
                project.profitMargin >= 25
                  ? 'text-success'
                  : project.profitMargin >= 15
                    ? 'text-warning'
                    : 'text-destructive'
              )}
            >
              {project.profitMargin.toFixed(1)}%
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-muted-foreground">Billed</span>
            <div className="text-lg font-bold">
              {formatCurrency(project.billedAmount, project.currency)}
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Unbilled</span>
            <div className="text-lg font-bold text-warning">
              {formatCurrency(project.unbilledAmount, project.currency)}
            </div>
          </div>
        </div>

        {wip && (
          <>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">WIP Balance</span>
              <div className="text-lg font-bold">
                {formatCurrency(wip.wipBalance, project.currency)}
              </div>
              <span className="text-xs text-muted-foreground">
                Earned: {formatCurrency(wip.earnedRevenue, project.currency)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Project Details ─────────────────────────────────────────────────────────

interface ProjectDetailsProps {
  project: Project;
}

function ProjectDetails({ project }: ProjectDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Project Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Type</span>
            <div className="font-medium">{projectTypeLabels[project.projectType]}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Billing Method</span>
            <div className="font-medium">{billingMethodLabels[project.billingMethod]}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Project Manager</span>
            <div className="font-medium flex items-center gap-1">
              <User2 className="h-3.5 w-3.5" />
              {project.projectManager}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Department</span>
            <div className="font-medium">{project.department}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Start Date</span>
            <div className="font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(project.startDate)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">End Date</span>
            <div className="font-medium">{project.endDate ? formatDate(project.endDate) : '—'}</div>
          </div>
          {project.costCenterCode && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Cost Center</span>
              <div className="font-medium">{project.costCenterCode}</div>
            </div>
          )}
        </div>

        {project.description && (
          <>
            <Separator />
            <div>
              <span className="text-sm text-muted-foreground">Description</span>
              <p className="text-sm mt-1">{project.description}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Progress Card ───────────────────────────────────────────────────────────

interface ProgressCardProps {
  project: Project;
}

function ProgressCard({ project }: ProgressCardProps) {
  const isOverBudget = project.actualCost > project.budgetedCost;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Completion</span>
            <span className="text-sm font-medium">{project.percentComplete}%</span>
          </div>
          <Progress value={project.percentComplete} className="h-3" />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Budget Used</span>
            <span className={cn('text-sm font-medium', isOverBudget && 'text-destructive')}>
              {((project.actualCost / project.budgetedCost) * 100).toFixed(0)}%
            </span>
          </div>
          <Progress
            value={(project.actualCost / project.budgetedCost) * 100}
            className={cn('h-3', isOverBudget && '[&>div]:bg-destructive')}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Billed</span>
            <span className="text-sm font-medium">
              {project.contractValue > 0
                ? ((project.billedAmount / project.contractValue) * 100).toFixed(0)
                : 0}
              %
            </span>
          </div>
          <Progress
            value={
              project.contractValue > 0 ? (project.billedAmount / project.contractValue) * 100 : 0
            }
            className="h-3"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Costs Tab ───────────────────────────────────────────────────────────────

interface CostsTabProps {
  costs: ProjectCost[];
  currency: string;
}

function CostsTab({ costs, currency }: CostsTabProps) {
  const costsByType = costs.reduce(
    (acc, cost) => {
      acc[cost.costType] = (acc[cost.costType] || 0) + cost.totalCost;
      return acc;
    },
    {} as Record<CostType, number>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Costs</h3>
        <Button asChild size="sm">
          <Link href="#add-cost">Add Cost</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(costsByType).map(([type, amount]) => (
          <Card key={type}>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">
                {costTypeLabels[type as CostType]}
              </div>
              <div className="text-lg font-bold">{formatCurrency(amount, currency)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {costs.map((cost) => (
                <div key={cost.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{cost.description}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline">{costTypeLabels[cost.costType]}</Badge>
                      <span>{formatDate(cost.date)}</span>
                      {cost.employeeName && <span>• {cost.employeeName}</span>}
                      {cost.vendorName && <span>• {cost.vendorName}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium">
                      {formatCurrency(cost.totalCost, currency)}
                    </div>
                    {cost.isBillable && (
                      <Badge variant={cost.isBilled ? 'secondary' : 'outline'} className="text-xs">
                        {cost.isBilled ? 'Billed' : 'Billable'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Billings Tab ────────────────────────────────────────────────────────────

interface BillingsTabProps {
  billings: ProjectBilling[];
  currency: string;
}

function BillingsTab({ billings, currency }: BillingsTabProps) {
  const totalBilled = billings.reduce((sum, b) => sum + b.amount, 0);
  const paidAmount = billings
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
    pending: { label: 'Pending', color: 'bg-warning/15 text-warning' },
    invoiced: { label: 'Invoiced', color: 'bg-info/15 text-info' },
    paid: { label: 'Paid', color: 'bg-success/15 text-success' },
    cancelled: { label: 'Cancelled', color: 'bg-destructive/15 text-destructive' },
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Billings</h3>
        <Button asChild size="sm">
          <Link href="#create-billing">Create Billing</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Billed</div>
            <div className="text-lg font-bold">{formatCurrency(totalBilled, currency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Paid</div>
            <div className="text-lg font-bold text-success">
              {formatCurrency(paidAmount, currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Outstanding</div>
            <div className="text-lg font-bold text-warning">
              {formatCurrency(totalBilled - paidAmount, currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {billings.map((billing) => (
                <div key={billing.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{billing.billingNumber}</div>
                    <div className="text-sm">{billing.description}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{formatDate(billing.billingDate)}</span>
                      {billing.milestoneName && <span>• {billing.milestoneName}</span>}
                      {billing.invoiceNumber && <span>• {billing.invoiceNumber}</span>}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-mono font-medium">
                      {formatCurrency(billing.amount, currency)}
                    </div>
                    <Badge className={statusConfig[billing.status]?.color}>
                      {statusConfig[billing.status]?.label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Milestones Tab ──────────────────────────────────────────────────────────

interface MilestonesTabProps {
  milestones: ProjectMilestone[];
  currency: string;
}

function MilestonesTab({ milestones, currency }: MilestonesTabProps) {
  const completedCount = milestones.filter((m) => m.status === 'completed').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Milestones</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {milestones.length} completed
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="#add-milestone">Add Milestone</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone, index) => (
          <Card key={milestone.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'rounded-full p-2',
                    milestone.status === 'completed'
                      ? 'bg-success/10 text-success'
                      : milestone.status === 'in_progress'
                        ? 'bg-info/10 text-info'
                        : milestone.status === 'delayed'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground'
                  )}
                >
                  {milestone.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : milestone.status === 'delayed' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{milestone.name}</div>
                    <Badge className={milestoneStatusConfig[milestone.status].color}>
                      {milestoneStatusConfig[milestone.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">
                      Due: {formatDate(milestone.dueDate)}
                    </span>
                    {milestone.completedDate && (
                      <span className="text-success">
                        Completed: {formatDate(milestone.completedDate)}
                      </span>
                    )}
                    <span className="font-mono">
                      {formatCurrency(milestone.billingAmount, currency)}
                    </span>
                    <span className="text-muted-foreground">
                      {milestone.percentageWeight}% weight
                    </span>
                  </div>
                  {milestone.deliverables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {milestone.deliverables.map((d, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface ProjectDetailProps {
  project: Project;
  costs: ProjectCost[];
  billings: ProjectBilling[];
  milestones: ProjectMilestone[];
  wip?: WIPCalculation;
}

export function ProjectDetail({ project, costs, billings, milestones, wip }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="costs">Costs ({costs.length})</TabsTrigger>
          <TabsTrigger value="billings">Billings ({billings.length})</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({milestones.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <ValueSummary project={project} wip={wip} />
            <ProjectDetails project={project} />
            <ProgressCard project={project} />
          </div>
        </TabsContent>

        <TabsContent value="costs" className="mt-6">
          <CostsTab costs={costs} currency={project.currency} />
        </TabsContent>

        <TabsContent value="billings" className="mt-6">
          <BillingsTab billings={billings} currency={project.currency} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <MilestonesTab milestones={milestones} currency={project.currency} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
