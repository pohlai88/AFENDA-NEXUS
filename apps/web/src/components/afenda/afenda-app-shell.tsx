'use client';

import * as React from 'react';
import { useState, useCallback, useContext, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TenantProvider } from '@/providers/tenant-provider';
import { PageBreadcrumbProvider } from '@/providers/page-breadcrumb-provider';
import {
  ShortcutProvider,
  useRegisterShortcut,
  ShortcutContext,
} from '@/providers/shortcut-provider';
import { useShellPreferences } from '@/providers/shell-preferences-provider';
import { ShellPreferencesProvider } from '@/providers/shell-preferences-provider';
import { useRecentItems } from '@/hooks/use-recent-items';
import { useDateFieldShortcuts } from '@/hooks/use-date-field-shortcuts';
import { SHELL_SHORTCUTS } from '@/lib/sidebar';
import { resolveNewHref } from '@/lib/shortcuts/page-context-actions';
import { registerAction, unregisterAction } from '@/lib/search/action-registry';
import { AfendaSidebar } from './sidebar/afenda-sidebar';
import { AfendaShellHeader } from './afenda-shell-header';
import { AfendaStatusCluster } from './afenda-status-cluster';
import { ShortcutPopover } from './shortcut-popover';
import { QuickActionShortcuts } from './quick-action-shortcuts';
import { SidebarShortcutRegister } from './sidebar-shortcut-register';
import { CalculatorPopover } from './calculator-popover';
import { CONTENT_MAX_W, CONTENT_PADDING } from './shell.tokens';
import { resolveShortcutKeys } from '@/lib/shortcuts/resolve-shortcut';
import type { ShellShortcut } from './shell.tokens';
import type { TenantContext } from '@/lib/types';
import type { ClientModuleWithNav } from '@/lib/modules/types';
import type { ShellUser } from '@/lib/shell/shell-user';
import type { ShellPreferences } from '@/lib/shell/shell-preferences.types';
import type { AttentionSummary } from '@/lib/attention/attention.types';

// ─── Lazy-loaded command palette ─────────────────────────────────────────────

/** Lazy-loaded: cmdk bundle only loads on first Cmd/Ctrl+K. */
const AfendaCommandPaletteLazy = dynamic(
  () =>
    import('./afenda-command-palette').then((m) => ({
      default: m.AfendaCommandPalette,
    })),
  { ssr: false }
);

// ─── Config-Driven Navigation Shortcuts ──────────────────────────────────────

/**
 * Register navigation shortcuts from explicit ShellShortcut[] config.
 * Applies user overrides from shell preferences when present.
 */
function useAfendaNavigationShortcuts(
  shortcuts: ShellShortcut[],
  router: ReturnType<typeof useRouter>,
  overrides?: Record<string, string> | null
): void {
  const ctx = useContext(ShortcutContext);
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (!ctx) return;

    const ids: string[] = [];

    for (const shortcut of shortcuts) {
      ids.push(shortcut.id);
      const keys = resolveShortcutKeys(shortcut.id, shortcut.keys, overrides);

      ctx.engine.register({
        id: shortcut.id,
        keys,
        description: `Go to ${shortcut.label}`,
        handler: () => routerRef.current.push(shortcut.href),
        scope: shortcut.scope ?? 'global',
      });
    }

    return () => {
      for (const id of ids) ctx.engine.unregister(id);
    };
  }, [ctx, shortcuts, overrides]);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AfendaAppShellProps {
  children: React.ReactNode;
  /** Seed data for the tenant (org + companies) context. */
  initialTenant?: TenantContext;
  /** Server action to switch the active company. */
  onSwitchCompany?: (companyId: string) => Promise<void>;
  /** Current authenticated user. */
  user?: ShellUser;
  /** Server action called on sign-out. */
  logoutAction?: () => Promise<void>;
  /** Visible modules with their navigation groups. */
  modules: ClientModuleWithNav[];
  /** Server-read shell preferences (for SSR-correct initial render). */
  defaultPrefs?: ShellPreferences;
  /** Pre-resolved attention summary from server. */
  attentionSummary?: AttentionSummary;
  /**
   * Config-driven navigation shortcuts.
   * Defaults to SHELL_SHORTCUTS from sidebar-config if not provided.
   */
  shortcuts?: ShellShortcut[];
  /**
   * Company-scoped cookie key for shell preferences.
   * Built server-side via `buildShellCookieKey(tenantId, userId, companyId)`.
   * Prevents preference leakage across companies in multi-company setups.
   */
  prefsCookieKey?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * AfendaAppShell — the primary application shell.
 *
 * Sidebar-10 architecture:
 *   LEFT → AfendaSidebar (collapsible="icon", 3 categories: ERP, Boardroom, Configuration)
 *
 * Wraps children with all required providers:
 * TenantProvider → ShellPreferencesProvider → PageBreadcrumbProvider → ShortcutProvider
 */
function AfendaAppShell({
  children,
  initialTenant,
  onSwitchCompany,
  user,
  logoutAction,
  modules,
  defaultPrefs,
  attentionSummary,
  shortcuts,
  prefsCookieKey,
}: AfendaAppShellProps) {
  return (
    <TenantProvider initialTenant={initialTenant}>
      <ShellPreferencesProvider defaultPrefs={defaultPrefs} cookieKey={prefsCookieKey}>
        <PageBreadcrumbProvider>
          <ShortcutProvider>
            <AfendaAppShellInner
              user={user}
              logoutAction={logoutAction}
              modules={modules}
              onSwitchCompany={onSwitchCompany}
              attentionSummary={attentionSummary}
              shortcuts={shortcuts}
            >
              {children}
            </AfendaAppShellInner>
          </ShortcutProvider>
        </PageBreadcrumbProvider>
      </ShellPreferencesProvider>
    </TenantProvider>
  );
}

/** Inner shell that reads context from providers. */
function AfendaAppShellInner({
  children,
  user,
  logoutAction,
  modules,
  onSwitchCompany,
  attentionSummary,
  shortcuts: shortcutsProp,
}: Pick<
  AfendaAppShellProps,
  | 'children'
  | 'user'
  | 'logoutAction'
  | 'modules'
  | 'onSwitchCompany'
  | 'attentionSummary'
  | 'shortcuts'
>) {
  const router = useRouter();
  const pathname = usePathname();
  const { prefs } = useShellPreferences();
  const overrides = prefs.shortcutOverrides ?? null;
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutPopoverOpen, setShortcutPopoverOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);

  // Resolve shortcuts — prop overrides default SHELL_SHORTCUTS
  const shortcuts = shortcutsProp ?? SHELL_SHORTCUTS;

  // Wrap onSwitchCompany with router.refresh() so RSC data reloads
  const handleSwitchCompany = useCallback(
    async (companyId: string) => {
      if (onSwitchCompany) {
        await onSwitchCompany(companyId);
      }
      router.refresh();
    },
    [onSwitchCompany, router]
  );

  // Track recently visited pages
  useRecentItems();

  // Date field shortcuts (t=Today, y=Yesterday, m=Month-end) — focus-bound
  useDateFieldShortcuts();

  // ─── Global Shortcuts (with user overrides) ────────────────────────────

  useRegisterShortcut(
    'afenda-shortcut-dialog',
    resolveShortcutKeys('afenda-shortcut-dialog', 'mod+/', overrides),
    'Show keyboard shortcuts',
    useCallback(() => setShortcutPopoverOpen(true), [])
  );

  useRegisterShortcut(
    'afenda-command-palette',
    resolveShortcutKeys('afenda-command-palette', 'mod+k', overrides),
    'Open command palette',
    useCallback(() => setCommandPaletteOpen((o) => !o), [])
  );

  useRegisterShortcut(
    'afenda-calculator',
    resolveShortcutKeys('afenda-calculator', 'mod+=', overrides),
    'Open calculator',
    useCallback(() => setCalculatorOpen((o) => !o), [])
  );

  // Register calculator action with handler for command palette
  useEffect(() => {
    registerAction({
      id: 'open-calculator',
      title: 'Open Calculator',
      icon: 'Calculator',
      category: 'utility',
      shortcut: 'Ctrl+=',
      handler: () => setCalculatorOpen(true),
    });
    return () => unregisterAction('open-calculator');
  }, []);

  // Navigation shortcuts — config-driven from ShellShortcut[] (with overrides)
  useAfendaNavigationShortcuts(shortcuts, router, overrides);

  // Contextual "n" (New) — navigate to create page based on current route
  useRegisterShortcut(
    'page-new',
    'n',
    'New (contextual)',
    useCallback(() => {
      const href = resolveNewHref(pathname ?? '');
      if (href) router.push(href);
    }, [pathname, router]),
    'global'
  );

  return (
    <>
      {/* Quick Action shortcuts (Ctrl+Q, Ctrl+1…9) — registered with engine for shortcut dialog */}
      <QuickActionShortcuts />

      {/* SidebarProvider controls the sidebar-10 sidebar */}
      <SidebarProvider keyboardShortcut="external">
        <SidebarShortcutRegister />
        {/* Skip link for keyboard / screen-reader accessibility */}
        <a
          href="#afenda-main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>

        {/* Left — sidebar-10 with config-driven categories */}
        <AfendaSidebar
          modules={modules}
          onSwitchCompany={handleSwitchCompany}
          attentionSummary={attentionSummary}
        />

        {/* Content area (SidebarInset per shadcn sidebar-10) — flex vertical, vertical scroll only */}
        <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-x-hidden">
          <AfendaShellHeader
            user={user}
            logoutAction={logoutAction}
            onOpenCommandPalette={openCommandPalette}
            commandPaletteShortcutKeys={resolveShortcutKeys(
              'afenda-command-palette',
              'mod+k',
              overrides
            )}
            modules={modules}
            statusCluster={<AfendaStatusCluster attentionSummary={attentionSummary} />}
            calculatorSlot={
              <CalculatorPopover open={calculatorOpen} onOpenChange={setCalculatorOpen} />
            }
            shortcutSlot={
              <ShortcutPopover
                open={shortcutPopoverOpen}
                onOpenChange={setShortcutPopoverOpen}
                shortcutTriggerKeys={resolveShortcutKeys(
                  'afenda-shortcut-dialog',
                  'mod+/',
                  overrides
                )}
              />
            }
          />
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden ${CONTENT_PADDING}`}
            style={{ overscrollBehavior: 'y contain' }}
          >
            <div
              id="afenda-main-content"
              tabIndex={-1}
              className={`mx-auto min-w-0 w-full ${CONTENT_MAX_W}`}
            >
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Command Palette — rendered at root level (uses portal internally) */}
      <AfendaCommandPaletteLazy
        modules={modules}
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onOpenShortcuts={() => setShortcutPopoverOpen(true)}
      />
    </>
  );
}

AfendaAppShell.displayName = 'AfendaAppShell';

export { AfendaAppShell };
export type { AfendaAppShellProps };
