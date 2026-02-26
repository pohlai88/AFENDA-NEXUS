'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { portalNavigationItems } from '@/lib/constants';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Receipt,
  Banknote,
  FolderOpen,
  MessageSquareWarning,
  GitMerge,
  ShieldCheck,
  Settings,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Receipt,
  Banknote,
  FolderOpen,
  MessageSquareWarning,
  GitMerge,
  ShieldCheck,
  Settings,
};

function PortalNavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? Receipt;
  return <Icon className={cn('h-4 w-4', className)} />;
}

export function PortalSidebarSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Portal</SidebarGroupLabel>
      <SidebarMenu>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <SidebarMenuItem key={i}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Supplier Portal</SidebarGroupLabel>
      <SidebarMenu>
        {portalNavigationItems.map((item) => {
          const isActive =
            item.href === '/portal' ? pathname === '/portal' : pathname.startsWith(item.href);

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                <Link href={item.href}>
                  <PortalNavIcon name={item.icon} />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
