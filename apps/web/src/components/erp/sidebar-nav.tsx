'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { financeNavigationGroups, type NavGroup, type NavItem } from '@/lib/constants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Scale,
  List,
  Calendar,
  BarChart3,
  Settings,
  ChevronRight,
  ArrowLeftRight,
  ArrowRightLeft,
  RefreshCw,
  Receipt,
  HandCoins,
  CheckCircle,
  CreditCard,
  Shield,
  Landmark,
  FileSpreadsheet,
  GitMerge,
  Settings2,
  FileCheck,
  Hash,
  FileSignature,
  Award,
  Package,
  Building,
  TrendingDown,
  Sparkles,
  Trash2,
  Wallet,
  User,
  Users,
  FolderKanban,
  PieChart,
  Workflow,
  Vault,
  TrendingUp,
  FileWarning,
  Network,
  Calculator,
  ShieldCheck,
  Key,
  AlertCircle,
  Banknote,
  Umbrella,
  Clock,
  GitBranch,
  Building2,
  MinusCircle,
  Star,
  Target,
  Home,
} from 'lucide-react';

// ─── Icon Map ────────────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  FileText,
  Scale,
  List,
  Calendar,
  BarChart3,
  Settings,
  ArrowLeftRight,
  ArrowRightLeft,
  RefreshCw,
  Receipt,
  HandCoins,
  CheckCircle,
  CreditCard,
  Shield,
  Landmark,
  FileSpreadsheet,
  GitMerge,
  Settings2,
  FileCheck,
  Hash,
  FileSignature,
  Award,
  Package,
  Building,
  TrendingDown,
  Sparkles,
  Trash2,
  Wallet,
  User,
  Users,
  FolderKanban,
  PieChart,
  Workflow,
  Vault,
  TrendingUp,
  FileWarning,
  Network,
  Calculator,
  ShieldCheck,
  Key,
  AlertCircle,
  Banknote,
  Umbrella,
  Clock,
  GitBranch,
  Building2,
  MinusCircle,
  Star,
  Target,
  Home,
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? FileText;
  return <Icon className={cn('h-4 w-4', className)} />;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function SidebarNavSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {[1, 2, 3, 4, 5].map((i) => (
          <SidebarMenuItem key={i}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

// ─── Badge Counts Context ────────────────────────────────────────────────────

interface ApprovalBadgeCounts {
  approvals?: number;
  expenses?: number;
}

// ─── Finance Navigation (Grouped) ────────────────────────────────────────────

interface FinanceSidebarNavProps {
  badgeCounts?: ApprovalBadgeCounts;
}

export function FinanceSidebarNav({ badgeCounts }: FinanceSidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      {financeNavigationGroups.map((group) => (
        <NavGroupSection
          key={group.title}
          group={group}
          pathname={pathname}
          badgeCounts={badgeCounts}
        />
      ))}
    </>
  );
}

function NavGroupSection({
  group,
  pathname,
  badgeCounts,
}: {
  group: NavGroup;
  pathname: string;
  badgeCounts?: ApprovalBadgeCounts;
}) {
  const isActive = group.items.some((item) => pathname.startsWith(item.href));

  if (group.collapsible) {
    return (
      <SidebarGroup>
        <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
          <div>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1 -mx-2 flex items-center gap-2">
                <NavIcon name={group.icon} className="h-3.5 w-3.5" />
                <span className="flex-1">{group.title}</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu className="mt-1">
                {group.items.map((item) => (
                  <NavMenuItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    badgeCounts={badgeCounts}
                  />
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        <NavIcon name={group.icon} className="h-3.5 w-3.5" />
        {group.title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => (
          <NavMenuItem
            key={item.href}
            item={item}
            pathname={pathname}
            badgeCounts={badgeCounts}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavMenuItem({
  item,
  pathname,
  badgeCounts,
}: {
  item: NavItem;
  pathname: string;
  badgeCounts?: ApprovalBadgeCounts;
}) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  const badgeCount = getBadgeCount(item.href, badgeCounts);

  if (item.children && item.children.length > 0) {
    return (
      <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={isActive}>
              <NavIcon name={item.icon} />
              <span>{item.title}</span>
              {badgeCount > 0 && (
                <Badge
                  variant={item.badgeVariant ?? 'secondary'}
                  className="ml-auto h-5 min-w-5 justify-center px-1.5 text-xs"
                >
                  {badgeCount}
                </Badge>
              )}
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                    <Link href={child.href}>
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <Link href={item.href}>
          <NavIcon name={item.icon} />
          <span>{item.title}</span>
          {badgeCount > 0 && (
            <Badge
              variant={item.badgeVariant ?? 'secondary'}
              className="ml-auto h-5 min-w-5 justify-center px-1.5 text-xs"
            >
              {badgeCount}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function getBadgeCount(href: string, counts?: ApprovalBadgeCounts): number {
  if (!counts) return 0;

  if (href.includes('/approvals')) return counts.approvals ?? 0;
  if (href.includes('/expenses')) return counts.expenses ?? 0;

  return 0;
}

// ─── Main App Navigation (Legacy) ────────────────────────────────────────────

import { navigationConfig } from '@/lib/constants';

export function SidebarNav() {
  const pathname = usePathname();

  // Check if we're in the finance section
  const isFinanceSection = pathname.startsWith('/finance');

  if (isFinanceSection) {
    return <FinanceSidebarNav />;
  }

  // Default navigation for non-finance sections
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {navigationConfig.map((item) =>
          item.children ? (
            <LegacyNavGroup key={item.title} item={item} pathname={pathname} />
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                <Link href={item.href}>
                  <NavIcon name={item.icon} />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function LegacyNavGroup({
  item,
  pathname,
}: {
  item: (typeof navigationConfig)[number];
  pathname: string;
}) {
  const isActive = item.children?.some((c) => pathname.startsWith(c.href)) ?? false;

  return (
    <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive}>
            <NavIcon name={item.icon} />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children?.map((child) => (
              <SidebarMenuSubItem key={child.title}>
                <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                  <Link href={child.href}>
                    <span>{child.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
