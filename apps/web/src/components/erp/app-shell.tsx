'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ModuleRail } from './module-rail';
import { DomainPopover } from './domain-popover';
import { ShellHeader } from './shell-header';
import { ShortcutDialog } from './shortcut-dialog';
import { TenantProvider } from '@/providers/tenant-provider';
import {
  ShellPreferencesProvider,
} from '@/providers/shell-preferences-provider';
import { PageBreadcrumbProvider } from '@/providers/page-breadcrumb-provider';
import {
  ShortcutProvider,
  useRegisterShortcut,
} from '@/providers/shortcut-provider';
import { useRecentItems } from '@/hooks/use-recent-items';
import { StatusCluster } from './status-cluster';
import type { ShellPreferences } from '@/lib/shell/shell-preferences.types';
import type { TenantContext } from '@/lib/types';
import type { ClientModuleWithNav } from '@/lib/modules/types';
import type { AttentionSummary } from '@/lib/attention/attention.types';

/** Lazy-loaded: cmdk bundle only loads on first Cmd/Ctrl+K. */
const CommandPalette = dynamic(
  () => import('./command-palette').then((m) => ({ default: m.CommandPalette })),
  { ssr: false },
);

// ─── Types ───────────────────────────────────────────────────────────────────

/** User identity passed to the shell header and user menu. */
interface AppShellUser {
  name: string;
  email: string;
  image?: string | null;
}

interface AppShellProps {
  children: React.ReactNode;
  /** Seed data for the tenant (org + companies) context. */
  initialTenant?: TenantContext;
  /** Server action to switch the active company. */
  onSwitchCompany?: (companyId: string) => Promise<void>;
  /** Current authenticated user. */
  user?: AppShellUser;
  /** Server action called on sign-out. */
  logoutAction?: () => Promise<void>;
  /** Visible modules with their navigation groups. */
  modules: ClientModuleWithNav[];
  /** Server-read shell preferences (for SSR-correct initial render). */
  defaultPrefs?: ShellPreferences;
  /** Pre-resolved attention summary from server. */
  attentionSummary?: AttentionSummary;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Application shell – two-sidebar architecture:
 *
 *   LEFT  → ModuleRail  (icon-only, collapsible="icon")
 *   RIGHT → DomainPopover (popover, sidebar-10 pattern)
 *
 * The left rail uses the outer `SidebarProvider` for collapse / expand.
 * The popover has its own isolated `SidebarProvider` internally to
 * prevent context bleeding (per shadcn sidebar-10 best practice).
 */
function AppShell({
  children,
  initialTenant,
  onSwitchCompany,
  user,
  logoutAction,
  modules,
  defaultPrefs,
  attentionSummary,
}: AppShellProps) {
  return (
    <TenantProvider initialTenant={initialTenant}>
      <ShellPreferencesProvider defaultPrefs={defaultPrefs}>
        <PageBreadcrumbProvider>
          <ShortcutProvider>
            <AppShellInner
              user={user}
              logoutAction={logoutAction}
              modules={modules}
              onSwitchCompany={onSwitchCompany}
              attentionSummary={attentionSummary}
            >
              {children}
            </AppShellInner>
          </ShortcutProvider>
        </PageBreadcrumbProvider>
      </ShellPreferencesProvider>
    </TenantProvider>
  );
}

/** Inner shell that reads context from providers. */
function AppShellInner({
  children,
  user,
  logoutAction,
  modules,
  onSwitchCompany,
  attentionSummary,
}: Pick<AppShellProps, 'children' | 'user' | 'logoutAction' | 'modules' | 'onSwitchCompany' | 'attentionSummary'>) {
  const router = useRouter();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutDialogOpen, setShortcutDialogOpen] = useState(false);
  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);

  // Track recently visited pages
  useRecentItems();

  // ─── Global Shortcuts ────────────────────────────────────────────────

  useRegisterShortcut(
    'shortcut-dialog',
    '?',
    'Show keyboard shortcuts',
    useCallback(() => setShortcutDialogOpen(true), []),
  );

  useRegisterShortcut(
    'command-palette',
    'mod+k',
    'Open command palette',
    useCallback(() => setCommandPaletteOpen((o) => !o), []),
  );

  // Navigation shortcuts: g + key → navigate
  useRegisterShortcut(
    'nav-journals',
    'g j',
    'Go to Journal Entries',
    useCallback(() => router.push('/finance/journals'), [router]),
  );

  useRegisterShortcut(
    'nav-accounts',
    'g a',
    'Go to Chart of Accounts',
    useCallback(() => router.push('/finance/accounts'), [router]),
  );

  useRegisterShortcut(
    'nav-periods',
    'g p',
    'Go to Periods',
    useCallback(() => router.push('/finance/periods'), [router]),
  );

  useRegisterShortcut(
    'nav-ledgers',
    'g l',
    'Go to Ledgers',
    useCallback(() => router.push('/finance/ledgers'), [router]),
  );

  useRegisterShortcut(
    'nav-banking',
    'g b',
    'Go to Banking',
    useCallback(() => router.push('/finance/banking'), [router]),
  );

  useRegisterShortcut(
    'nav-expenses',
    'g x',
    'Go to Expenses',
    useCallback(() => router.push('/finance/expenses'), [router]),
  );

  useRegisterShortcut(
    'nav-settings',
    'g s',
    'Go to Settings',
    useCallback(() => router.push('/settings'), [router]),
  );

  useRegisterShortcut(
    'nav-dashboard',
    'g d',
    'Go to Dashboard',
    useCallback(() => router.push('/'), [router]),
  );

  return (
    <>
      {/* SidebarProvider controls the left module rail */}
      <SidebarProvider>
        {/* Skip link for keyboard / screen-reader accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>

        {/* Left — icon-only module rail */}
        <ModuleRail modules={modules} />

        {/* Content area (SidebarInset per shadcn sidebar-10) */}
        <SidebarInset>
          <ShellHeader
            user={user}
            logoutAction={logoutAction}
            onOpenCommandPalette={openCommandPalette}
            modules={modules}
            statusCluster={<StatusCluster attentionSummary={attentionSummary} />}
            domainPopover={
              <DomainPopover
                modules={modules}
                onSwitchCompany={onSwitchCompany}
              />
            }
          />
          <div className="flex flex-1 flex-col gap-4 p-6">
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Command Palette — rendered at root level (uses portal internally) */}
      <CommandPalette
        modules={modules}
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />

      {/* Shortcut Reference Dialog */}
      <ShortcutDialog
        open={shortcutDialogOpen}
        onOpenChange={setShortcutDialogOpen}
      />
    </>
  );
}

export { AppShell };
export type { AppShellProps, AppShellUser };
