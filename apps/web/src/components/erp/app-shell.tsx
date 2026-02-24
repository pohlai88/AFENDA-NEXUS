"use client";

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
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./sidebar-nav";
import { TenantSwitcher } from "./tenant-switcher";
import { CompanySwitcher } from "./company-switcher";
import { PeriodIndicator } from "./period-indicator";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { TenantProvider } from "@/providers/tenant-provider";
import { UserMenu } from "./user-menu";
import type { TenantContext } from "@/lib/types";

interface AppShellProps {
  children: React.ReactNode;
  initialTenant?: TenantContext;
  logoutAction?: () => Promise<void>;
}

export function AppShell({ children, initialTenant, logoutAction }: AppShellProps) {
  return (
    <TenantProvider initialTenant={initialTenant}>
      <SidebarProvider>
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>

        <Sidebar collapsible="icon">
          <SidebarHeader className="gap-2 p-3">
            <div className="flex items-center gap-2 px-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                A
              </div>
              <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
                Afenda
              </span>
            </div>
            <SidebarSeparator />
            <div className="space-y-2 group-data-[collapsible=icon]:hidden">
              <TenantSwitcher />
              <CompanySwitcher />
              <PeriodIndicator />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarNav />
          </SidebarContent>

          <SidebarFooter className="group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">⌘B</kbd>
              <span>Toggle sidebar</span>
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
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden h-8 w-64 justify-start text-sm text-muted-foreground md:flex"
                onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              >
                <Search className="mr-2 h-4 w-4" />
                <span>Search...</span>
                <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
              <ThemeToggle />
              <UserMenu logoutAction={logoutAction} />
            </div>
            <CommandPalette />
          </header>

          {/* Page content */}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto p-6"
            tabIndex={-1}
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TenantProvider>
  );
}
