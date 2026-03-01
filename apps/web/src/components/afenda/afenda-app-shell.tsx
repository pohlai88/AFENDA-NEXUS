'use client';

import * as React from 'react';
import { useState, useCallback, useContext, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TenantProvider } from '@/providers/tenant-provider';
import { PageBreadcrumbProvider } from '@/providers/page-breadcrumb-provider';
import {
  ShortcutProvider,
  useRegisterShortcut,
  ShortcutContext,
} from '@/providers/shortcut-provider';
import { ShellPreferencesProvider } from '@/providers/shell-preferences-provider';
import { useRecentItems } from '@/hooks/use-recent-items';
import { SHELL_SHORTCUTS } from '@/lib/sidebar';
import { registerAction, unregisterAction } from '@/lib/search/action-registry';
import { AfendaSidebar } from './sidebar/afenda-sidebar';
import { AfendaShellHeader } from './afenda-shell-header';
import { AfendaStatusCluster } from './afenda-status-cluster';
import { AfendaShortcutDialog } from './afenda-shortcut-dialog';
import { CalculatorPopover } from './calculator-popover';
import { CONTENT_MAX_W, CONTENT_PADDING, ACTION_BTN, ICON } from './shell.tokens';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Keyboard } from 'lucide-react';
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
  { ssr: false },
);

// ─── Config-Driven Navigation Shortcuts ──────────────────────────────────────

/**
 * Register navigation shortcuts from explicit ShellShortcut[] config.
 * No heuristics — every shortcut carries its own label.
 */
function useAfendaNavigationShortcuts(
  shortcuts: ShellShortcut[],
  router: ReturnType<typeof useRouter>,
): void {
  const ctx = useContext(ShortcutContext);
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (!ctx) return;

    const ids: string[] = [];

    for (const shortcut of shortcuts) {
      ids.push(shortcut.id);

      ctx.engine.register({
        id: shortcut.id,
        keys: shortcut.keys,
        description: `Go to ${shortcut.label}`,
        handler: () => routerRef.current.push(shortcut.href),
        scope: shortcut.scope ?? 'global',
      });
    }

    return () => {
      for (const id of ids) ctx.engine.unregister(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, shortcuts]);
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
  'children' | 'user' | 'logoutAction' | 'modules' | 'onSwitchCompany' | 'attentionSummary' | 'shortcuts'
>) {
  const router = useRouter();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutDialogOpen, setShortcutDialogOpen] = useState(false);
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
    [onSwitchCompany, router],
  );

  // Track recently visited pages
  useRecentItems();

  // ─── Global Shortcuts ────────────────────────────────────────────────

  useRegisterShortcut(
    'afenda-shortcut-dialog',
    '?',
    'Show keyboard shortcuts',
    useCallback(() => setShortcutDialogOpen(true), []),
  );

  useRegisterShortcut(
    'afenda-command-palette',
    'mod+k',
    'Open command palette',
    useCallback(() => setCommandPaletteOpen((o) => !o), []),
  );

  useRegisterShortcut(
    'afenda-calculator',
    'mod+=',
    'Open calculator',
    useCallback(() => setCalculatorOpen((o) => !o), []),
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

  // Navigation shortcuts — config-driven from ShellShortcut[]
  useAfendaNavigationShortcuts(shortcuts, router);

  return (
    <>
      {/* SidebarProvider controls the sidebar-10 sidebar */}
      <SidebarProvider>
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

        {/* Content area (SidebarInset per shadcn sidebar-10) */}
        <SidebarInset>
          <AfendaShellHeader
            user={user}
            logoutAction={logoutAction}
            onOpenCommandPalette={openCommandPalette}
            modules={modules}
            statusCluster={<AfendaStatusCluster attentionSummary={attentionSummary} />}
            calculatorSlot={
              <CalculatorPopover
                open={calculatorOpen}
                onOpenChange={setCalculatorOpen}
              />
            }
            shortcutSlot={
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2"
                    onClick={() => setShortcutDialogOpen(true)}
                    aria-label="Keyboard shortcuts"
                  >
                    <Keyboard className={ICON} aria-hidden />
                    <Kbd className="text-[10px]">?</Kbd>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Keyboard shortcuts <Kbd>?</Kbd>
                </TooltipContent>
              </Tooltip>
            }
          />
          <div className={`flex flex-1 flex-col ${CONTENT_PADDING}`}>
            <div
              id="afenda-main-content"
              tabIndex={-1}
              className={`mx-auto w-full ${CONTENT_MAX_W}`}
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
      />

      {/* Shortcut Reference Dialog */}
      <AfendaShortcutDialog
        open={shortcutDialogOpen}
        onOpenChange={setShortcutDialogOpen}
      />
    </>
  );
}

AfendaAppShell.displayName = 'AfendaAppShell';

export { AfendaAppShell };
export type { AfendaAppShellProps };
