import * as React from 'react';
import { deriveShortcuts } from '@/lib/modules/derive-shortcuts';
import { FeatureCard } from './feature-card';
import { getPlannedFeatures } from './roadmap-registry';
import type { NavGroup } from '@/lib/constants';
import type { AttentionItem } from '@/lib/attention/attention.types';
import type { FeatureMetricMap } from './module-map.types';
import type { ModuleId } from './roadmap-registry';

// ─── Module Map (Feature Grid) ───────────────────────────────────────────────
//
// The Module Map shows:
// 1. **Available (N)**: Active features with navigation links, live metrics, attention
// 2. **Coming Soon (N)**: Planned features from roadmap registry
//
// Key architectural invariants:
// - Uses stable `featureId` for all mapping (no URL parsing)
// - Dedupes: planned features with matching active `featureId` are excluded
// - Generic: works for Finance, AP, AR, GL, Assets with zero domain-specific logic
//
// ─────────────────────────────────────────────────────────────────────────────

interface FeatureGridProps {
  /** NavGroups for this domain (from DomainDashboardConfig). */
  navGroups: NavGroup[];
  /** Module ID for roadmap lookup (e.g., 'finance', 'ap'). */
  moduleId: string;
  /** Optional attention items with featureId mapping. */
  attentionItems?: AttentionItem[];
  /** Optional feature metrics map (featureId → { primary?, secondary? }). */
  featureMetrics?: FeatureMetricMap;
}

function FeatureGrid({ navGroups, moduleId, attentionItems, featureMetrics }: FeatureGridProps) {
  // #region agent log
  // eslint-disable-next-line no-restricted-syntax
  fetch('http://127.0.0.1:7877/ingest/5572b893-09bf-4986-bb0f-a54b06329d22',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b56243'},body:JSON.stringify({sessionId:'b56243',location:'feature-grid.tsx:34',message:'FeatureGrid entry',data:{navGroupsCount:navGroups?.length||0,moduleId,attentionCount:attentionItems?.length||0,metricsKeys:Object.keys(featureMetrics||{}).length,navGroupsSample:navGroups?.slice(0,2).map(g=>({featureId:g.featureId,title:g.title,itemsCount:g.items?.length||0}))},timestamp:Date.now(),hypothesisId:'H1,H2'})}).catch(()=>{});
  // #endregion
  
  // Derive active feature cards from nav groups
  const shortcuts = deriveShortcuts(navGroups);
  
  // #region agent log
  // eslint-disable-next-line no-restricted-syntax
  fetch('http://127.0.0.1:7877/ingest/5572b893-09bf-4986-bb0f-a54b06329d22',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b56243'},body:JSON.stringify({sessionId:'b56243',location:'feature-grid.tsx:43',message:'Shortcuts derived',data:{shortcutsCount:shortcuts.length,shortcutsSample:shortcuts.slice(0,2).map(s=>({featureId:s.featureId,title:s.title,itemsCount:s.items?.length||0}))},timestamp:Date.now(),hypothesisId:'H2,H3'})}).catch(()=>{});
  // #endregion

  // Group attention by featureId
  const attentionByFeature = new Map<string, AttentionItem[]>();
  for (const item of attentionItems ?? []) {
    if (!item.featureId) continue;
    const list = attentionByFeature.get(item.featureId) ?? [];
    list.push(item);
    attentionByFeature.set(item.featureId, list);
  }

  // Sort attention items by severity (critical first)
  for (const [featureId, items] of attentionByFeature) {
    const sorted = items.toSorted((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    attentionByFeature.set(featureId, sorted);
  }

  // Get planned features (exclude active)
  const activeFeatureIds = new Set(shortcuts.map((s) => s.featureId));
  const plannedFeatures = getPlannedFeatures(moduleId as ModuleId, activeFeatureIds);

  // #region agent log
  // eslint-disable-next-line no-restricted-syntax
  fetch('http://127.0.0.1:7877/ingest/5572b893-09bf-4986-bb0f-a54b06329d22',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b56243'},body:JSON.stringify({sessionId:'b56243',location:'feature-grid.tsx:60',message:'Before render decision',data:{shortcutsCount:shortcuts.length,plannedCount:plannedFeatures.length,willRenderActive:shortcuts.length>0,willRenderPlanned:plannedFeatures.length>0},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion

  return (
    <div className="space-y-6">
      {/* Active Features Section */}
      {shortcuts.length > 0 && (
        <section aria-labelledby="features-available">
          <h2 id="features-available" className="text-sm font-medium text-muted-foreground mb-3">
            Available ({shortcuts.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map((card) => {
              const attention = attentionByFeature.get(card.featureId);
              const highestSeverity = attention?.[0]?.severity;
              const totalCount = attention?.reduce((sum, item) => sum + item.count, 0);
              const metrics = featureMetrics?.[card.featureId];

              return (
                <FeatureCard
                  key={card.featureId}
                  model={{
                    featureId: card.featureId,
                    title: card.title,
                    description: card.description,
                    icon: card.icon,
                    variant: 'active',
                    items: card.items,
                    href: card.viewAllHref,
                  }}
                  signals={{
                    severity: highestSeverity,
                    attentionCount: totalCount,
                    metricPrimary: metrics?.primary,
                    metricSecondary: metrics?.secondary,
                    badge: card.status === 'beta' ? 'Beta' : undefined,
                  }}
                  maxLinks={5}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Planned Features Section */}
      {plannedFeatures.length > 0 && (
        <section aria-labelledby="features-planned">
          <h2 id="features-planned" className="text-sm font-medium text-muted-foreground mb-3">
            Coming Soon ({plannedFeatures.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plannedFeatures.map((feature) => (
              <FeatureCard
                key={feature.id}
                model={{
                  featureId: feature.featureId,
                  title: feature.title,
                  description: feature.description,
                  variant: 'planned',
                  roadmap: {
                    target: feature.target,
                    detail: feature.detail,
                  },
                }}
                signals={{
                  badge: feature.status === 'beta' ? 'Beta' : undefined,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

FeatureGrid.displayName = 'FeatureGrid';

export { FeatureGrid };
export type { FeatureGridProps };
