import * as React from 'react';
import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import { getModuleById } from '@/lib/modules/module-definitions.server';
import { resolveKPIs } from '@/lib/kpis/kpi-registry.server';
import { getKPICatalogEntries } from '@/lib/kpis/kpi-catalog';
import { deriveShortcuts } from '@/lib/modules/derive-shortcuts';
import { KPICard } from './kpi-card';
import { ShortcutGrid } from './shortcut-grid';
import type { DashboardScope } from '@/lib/modules/types';
import type { NavGroup } from '@/lib/constants';

// ─── Dashboard Config ───────────────────────────────────────────────────────

interface DashboardConfig {
  kpiIds: string[];
  navGroups: NavGroup[];
  shortcutsFromNav: boolean;
}

// Domain dashboard configs (finance sub-domains)
const DOMAIN_CONFIGS: Record<string, DashboardConfig> = {
  'finance.ap': {
    kpiIds: ['fin.ap.total', 'fin.ap.aging', 'fin.ap.overdue', 'fin.ap.pending'],
    navGroups: [],
    shortcutsFromNav: false,
  },
  'finance.ar': {
    kpiIds: ['fin.ar.total', 'fin.ar.aging', 'fin.ar.overdue', 'fin.ar.dso'],
    navGroups: [],
    shortcutsFromNav: false,
  },
  'finance.gl': {
    kpiIds: ['fin.gl.journals', 'fin.gl.unposted', 'fin.gl.trialBalance'],
    navGroups: [],
    shortcutsFromNav: false,
  },
  'finance.banking': {
    kpiIds: ['fin.bank.balance', 'fin.bank.unreconciled'],
    navGroups: [],
    shortcutsFromNav: false,
  },
};

function getDashboardConfig(scope: DashboardScope): DashboardConfig {
  if (scope.type === 'domain') {
    return DOMAIN_CONFIGS[scope.id] ?? { kpiIds: [], navGroups: [], shortcutsFromNav: false };
  }

  const mod = getModuleById(scope.id);
  return {
    kpiIds: mod.dashboard.kpiIds,
    navGroups: mod.navGroups,
    shortcutsFromNav: mod.dashboard.shortcutsFromNav,
  };
}

// ─── DashboardPage Server Component ─────────────────────────────────────────

interface DashboardPageProps {
  /** The scope determines which KPIs and shortcuts to render. */
  scope: DashboardScope;
}

/**
 * Server component that renders a module or domain dashboard
 * with KPI cards and optional shortcuts.
 */
export async function DashboardPage({ scope }: DashboardPageProps) {
  const config = getDashboardConfig(scope);

  if (config.kpiIds.length === 0 && !config.shortcutsFromNav) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {config.kpiIds.length > 0 && (
        <Suspense fallback={<KPICardsSkeleton count={config.kpiIds.length} />}>
          <DashboardKPIs kpiIds={config.kpiIds} />
        </Suspense>
      )}

      {config.shortcutsFromNav && config.navGroups.length > 0 && (
        <ShortcutSection navGroups={config.navGroups} />
      )}
    </div>
  );
}

// ─── KPI Cards Section (async) ──────────────────────────────────────────────

async function DashboardKPIs({ kpiIds }: { kpiIds: string[] }) {
  const ctx = await getRequestContext();
  const kpiData = await resolveKPIs(kpiIds, ctx);
  const catalog = getKPICatalogEntries(kpiIds);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((data, i) => (
        <KPICard key={data.id} catalog={catalog[i] ?? catalog[0]} data={data} />
      ))}
    </div>
  );
}

// ─── Shortcuts Section ──────────────────────────────────────────────────────

function ShortcutSection({ navGroups }: { navGroups: NavGroup[] }) {
  const shortcuts = deriveShortcuts(navGroups);

  if (shortcuts.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        Features & Functions
      </h3>
      <ShortcutGrid shortcuts={shortcuts} />
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function KPICardsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: Math.min(count, 4) }, (_, i) => (
        <div
          key={`skeleton-${i}`}
          className="h-[120px] animate-pulse rounded-lg border bg-card"
        />
      ))}
    </div>
  );
}
KPICardsSkeleton.displayName = 'KPICardsSkeleton';

export type { DashboardPageProps };
