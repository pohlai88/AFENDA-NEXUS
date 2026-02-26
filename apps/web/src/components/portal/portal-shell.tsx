'use client';

import { Suspense } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { PortalSidebar, PortalSidebarSkeleton } from './portal-sidebar';
import { ThemeToggle } from '@/components/erp/theme-toggle';
import { UserMenu } from '@/components/erp/user-menu';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PortalShellProps {
  children: React.ReactNode;
  supplierName?: string;
  user?: {
    name: string;
    email: string;
    image?: string | null;
  };
  logoutAction?: () => Promise<void>;
}

export function PortalShell({ children, supplierName, user, logoutAction }: PortalShellProps) {
  return (
    <SidebarProvider>
      {/* Skip link for accessibility */}
      <a
        href="#portal-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <Sidebar collapsible="icon">
        <SidebarHeader className="gap-2 p-3">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              S
            </div>
            <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
              {supplierName ?? 'Supplier Portal'}
            </span>
          </div>
          <SidebarSeparator />
        </SidebarHeader>

        <SidebarContent>
          <Suspense fallback={<PortalSidebarSkeleton />}>
            <PortalSidebar />
          </Suspense>
        </SidebarContent>

        <SidebarFooter className="group-data-[collapsible=icon]:hidden">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Powered by <span className="font-semibold">Afenda</span>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {supplierName && (
              <span className="hidden text-sm font-medium text-muted-foreground md:inline">
                {supplierName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            <ThemeToggle />
            <UserMenu user={user} logoutAction={logoutAction} />
          </div>
        </header>

        {/* Page content */}
        <main id="portal-main-content" className="flex-1 overflow-y-auto p-6" tabIndex={-1}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
