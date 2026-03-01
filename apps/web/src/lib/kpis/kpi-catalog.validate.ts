/**
 * KPI Catalog Validation
 *
 * Ensures catalog and registry stay aligned. Run in tests or CI.
 * This file imports from kpi-registry.server — do not import from client code.
 */

import { getAllCatalogEntries } from './kpi-catalog';
import { KPI_RESOLVERS } from './kpi-registry.server';

export interface CatalogValidationResult {
  ok: boolean;
  catalogWithoutResolver: string[];
  resolverWithoutCatalog: string[];
  catalogErrors: Array<{ id: string; message: string }>;
}

/**
 * Validate catalog ↔ registry alignment.
 * - Catalog IDs without resolvers will show as error stubs in UI
 * - Resolver IDs without catalog entries are orphaned (unused)
 */
export function validateKpiCatalog(): CatalogValidationResult {
  const catalogIds = new Set(
    getAllCatalogEntries().map((e) => e.id).filter((id) => !id.startsWith('stub.')),
  );
  const resolverIds = new Set(Object.keys(KPI_RESOLVERS));

  const catalogWithoutResolver: string[] = [];
  const resolverWithoutCatalog: string[] = [];

  for (const id of catalogIds) {
    if (!resolverIds.has(id)) {
      catalogWithoutResolver.push(id);
    }
  }
  for (const id of resolverIds) {
    if (!catalogIds.has(id)) {
      resolverWithoutCatalog.push(id);
    }
  }

  const catalogErrors: Array<{ id: string; message: string }> = [];

  const VALID_TEMPLATES = [
    'value-trend',
    'value-sparkline',
    'ratio',
    'aging',
    'count-status',
    'bullet',
    'dial',
    'speedometer',
    'stub',
  ] as const;

  for (const entry of getAllCatalogEntries()) {
    if (entry.id.startsWith('stub.')) continue;

    if (!entry.template) {
      catalogErrors.push({ id: entry.id, message: 'Missing template' });
    } else if (!VALID_TEMPLATES.includes(entry.template as (typeof VALID_TEMPLATES)[number])) {
      catalogErrors.push({ id: entry.id, message: `Unknown template: ${entry.template}` });
    }
    if (!entry.format) {
      catalogErrors.push({ id: entry.id, message: 'Missing format' });
    }
    if (entry.description && entry.description.length > 250) {
      catalogErrors.push({
        id: entry.id,
        message: `Description exceeds 250 chars (${entry.description.length})`,
      });
    }
  }

  const ok =
    catalogWithoutResolver.length === 0 &&
    catalogErrors.length === 0;

  return {
    ok,
    catalogWithoutResolver,
    resolverWithoutCatalog,
    catalogErrors,
  };
}

/**
 * Get catalog entries that lack resolvers (will render as error stubs).
 */
export function getCatalogIdsWithoutResolvers(): string[] {
  return validateKpiCatalog().catalogWithoutResolver;
}
