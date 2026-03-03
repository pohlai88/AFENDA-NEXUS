'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Building2,
  MapPin,
  Package,
  Settings,
  Folder,
  Search,
  User2,
} from 'lucide-react';
import type { CostCenter, CostCenterType } from '../types';
import { costCenterStatusConfig } from '../types';
import { routes } from '@/lib/constants';

const typeIcons: Record<CostCenterType, React.ElementType> = {
  department: Building2,
  project: Folder,
  location: MapPin,
  product: Package,
  service: Settings,
  other: Folder,
};

interface CostCenterNodeProps {
  costCenter: CostCenter;
  level?: number;
  onSelect?: (cc: CostCenter) => void;
}

function CostCenterNode({ costCenter, level = 0, onSelect }: CostCenterNodeProps) {
  const [isOpen, setIsOpen] = useState(level < 1);
  const hasChildren = costCenter.children && costCenter.children.length > 0;
  const Icon = typeIcons[costCenter.type];

  const budgetUsed = (costCenter.actualAmount / costCenter.budgetAmount) * 100;
  const isOverBudget = budgetUsed > 100;

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            'flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent cursor-pointer',
            level > 0 && `ml-${level * 6}`
          )}
          style={{ marginLeft: level * 24 }}
          role="button"
          tabIndex={0}
          onClick={() => onSelect?.(costCenter)}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(costCenter); } }}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}

          <div
            className={cn(
              'rounded p-1.5',
              costCenter.status === 'active' ? 'bg-primary/10' : 'bg-muted'
            )}
          >
            <Icon className="h-4 w-4 text-primary"  aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{costCenter.code}</span>
              <span className="font-medium truncate">{costCenter.name}</span>
              {costCenter.status !== 'active' && (
                <Badge
                  variant="outline"
                  className={costCenterStatusConfig[costCenter.status].color}
                >
                  {costCenterStatusConfig[costCenter.status].label}
                </Badge>
              )}
            </div>
            {costCenter.managerName && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <User2 className="h-3 w-3" />
                {costCenter.managerName}
              </div>
            )}
          </div>

          <div className="text-right space-y-1 min-w-[180px]">
            <div className="flex items-center justify-end gap-2">
              <span className={cn('font-mono text-sm', isOverBudget && 'text-destructive')}>
                {formatCurrency(costCenter.actualAmount, costCenter.currency)}
              </span>
              <span className="text-xs text-muted-foreground">
                / {formatCurrency(costCenter.budgetAmount, costCenter.currency)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Progress
                value={Math.min(budgetUsed, 100)}
                className={cn('h-1.5 w-20', isOverBudget && '[&>div]:bg-destructive')}
              />
              <span
                className={cn(
                  'text-xs',
                  isOverBudget ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {budgetUsed.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            {costCenter.children?.map((child) => (
              <CostCenterNode
                key={child.id}
                costCenter={child}
                level={level + 1}
                onSelect={onSelect}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

interface CostCenterTreeProps {
  costCenters: CostCenter[];
}

export function CostCenterTree({ costCenters }: CostCenterTreeProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleSelect = (cc: CostCenter) => {
    router.push(routes.finance.costCenterDetail(cc.id));
  };

  const filterTree = (nodes: CostCenter[], term: string): CostCenter[] => {
    if (!term) return nodes;
    const lower = term.toLowerCase();

    return nodes
      .map((node) => {
        const matchesSearch =
          node.code.toLowerCase().includes(lower) || node.name.toLowerCase().includes(lower);

        const filteredChildren = node.children ? filterTree(node.children, term) : [];

        if (matchesSearch || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      })
      .filter(Boolean) as CostCenter[];
  };

  const filteredCenters = filterTree(costCenters, search);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Cost Center Hierarchy</CardTitle>
          <Button size="sm" asChild>
            <Link href={routes.finance.costCenterNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Link>
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cost centers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredCenters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search ? 'No cost centers match your search' : 'No cost centers found'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCenters.map((cc) => (
              <CostCenterNode key={cc.id} costCenter={cc} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
