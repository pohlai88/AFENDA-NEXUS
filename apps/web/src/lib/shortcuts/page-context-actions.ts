/**
 * @module page-context-actions
 *
 * Route-to-action map for contextual keyboard shortcuts.
 * When user presses "n" (New) on a list page, navigate to the create page.
 */

import { routes } from '@/lib/constants';

/**
 * Path prefix → create href.
 * Longest match wins; entries are checked in order (longer prefixes first).
 */
const ROUTE_TO_CREATE: Array<{ prefix: string; href: string }> = [
  // Finance — list pages with "New" action
  { prefix: '/finance/journals', href: routes.finance.journalNew },
  { prefix: '/finance/accounts', href: routes.finance.accountNew },
  { prefix: '/finance/accounts-payable/payables', href: routes.finance.payableNew },
  { prefix: '/finance/receivables', href: routes.finance.receivableNew },
  { prefix: '/finance/expenses', href: routes.finance.expenseNew },
  { prefix: '/finance/ledgers', href: routes.finance.ledgerNew },
  { prefix: '/finance/recurring', href: routes.finance.recurringNew },
  { prefix: '/finance/fixed-assets', href: routes.finance.fixedAssetNew },
  { prefix: '/finance/intangibles', href: routes.finance.intangibleNew },
  { prefix: '/finance/projects', href: routes.finance.projectNew },
  { prefix: '/finance/cost-centers', href: routes.finance.costCenterNew },
  { prefix: '/finance/fx-rates', href: routes.finance.fxRateNew },
  { prefix: '/finance/intercompany', href: routes.finance.icTransactionNew },
  { prefix: '/finance/treasury/forecasts', href: routes.finance.cashForecastNew },
  { prefix: '/finance/treasury/covenants', href: routes.finance.covenantNew },
  { prefix: '/finance/tax/codes', href: routes.finance.taxCodeNew },
  { prefix: '/finance/receivables/dunning', href: routes.finance.dunningNew },
  { prefix: '/finance/fixed-assets/depreciation-runs', href: routes.finance.depreciationRunNew },
  { prefix: '/finance/cost-centers/drivers', href: routes.finance.costDriverNew },
  { prefix: '/finance/cost-centers/allocations', href: routes.finance.allocationNew },
  { prefix: '/finance/accounts-payable/payables/suppliers', href: routes.finance.supplierNew },
  { prefix: '/finance/accounts-payable/payables/payment-runs', href: routes.finance.paymentRunNew },
];

/**
 * Resolve the "New" (create) href for the current pathname.
 * Returns the create route if the current page has one, otherwise null.
 */
export function resolveNewHref(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, '') || '/';
  let best: { prefix: string; href: string } | null = null;

  for (const entry of ROUTE_TO_CREATE) {
    const prefix = entry.prefix.replace(/\/$/, '') || '/';
    if (normalized === prefix || normalized.startsWith(`${prefix  }/`)) {
      if (!best || prefix.length > best.prefix.length) {
        best = entry;
      }
    }
  }

  return best?.href ?? null;
}
