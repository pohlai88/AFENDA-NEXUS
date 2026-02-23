"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { TenantSwitcher } from "./tenant-switcher";
import { CompanySwitcher } from "./company-switcher";
import { PeriodIndicator } from "./period-indicator";
import { PanelLeftClose, PanelLeft } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-200",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
        aria-label="Application sidebar"
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!sidebarCollapsed && (
            <span className="text-lg font-bold tracking-tight">Afenda</span>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Tenant/Company context */}
        {!sidebarCollapsed && (
          <div className="space-y-2 border-b px-3 py-3">
            <TenantSwitcher />
            <CompanySwitcher />
            <PeriodIndicator />
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav collapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <div />
          <div className="flex items-center gap-4">
            {/* Future: command palette trigger, notifications, user menu */}
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
