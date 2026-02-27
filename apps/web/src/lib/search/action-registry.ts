import type { SearchAction } from './search.types';

// ─── Action Registry ─────────────────────────────────────────────────────────
//
// Central registry for quick actions rendered in the command palette.
// Actions are registered with an id, title, icon, optional scope,
// and either a handler (inline execution) or href (navigation).
//
// ─────────────────────────────────────────────────────────────────────────────

/** Mutable registry of quick actions. */
const actions = new Map<string, SearchAction>();

/**
 * Register a quick action. Overwrites any existing action with the same id.
 */
export function registerAction(action: SearchAction): void {
  actions.set(action.id, action);
}

/**
 * Unregister a quick action.
 */
export function unregisterAction(id: string): void {
  actions.delete(id);
}

/**
 * Get all registered actions. Optionally filtered by active module scope.
 */
export function getActions(activeModuleId?: string): SearchAction[] {
  const all = Array.from(actions.values());
  if (!activeModuleId) return all;
  return all.filter((a) => !a.scope || a.scope === activeModuleId);
}

/**
 * Fuzzy-search actions by title. Case-insensitive substring match.
 */
export function searchActions(query: string, activeModuleId?: string): SearchAction[] {
  const q = query.toLowerCase().trim();
  if (!q) return getActions(activeModuleId);

  return getActions(activeModuleId).filter((a) =>
    a.title.toLowerCase().includes(q),
  );
}

// ─── Default Actions ─────────────────────────────────────────────────────────
//
// Pre-registered actions available from app start. Navigation-based actions
// use `href`. In-app actions (theme/density) use `handler` and are registered
// at runtime by the ShellPreferencesProvider / DisplayCluster.
//

const DEFAULT_ACTIONS: SearchAction[] = [
  {
    id: 'new-journal-entry',
    title: 'New Journal Entry',
    icon: 'FilePlus2',
    shortcut: 'g n j',
    scope: 'finance',
    href: '/finance/journals/new',
  },
  {
    id: 'new-invoice',
    title: 'New Invoice',
    icon: 'FileText',
    scope: 'finance',
    href: '/finance/payables/new',
  },
  {
    id: 'new-supplier',
    title: 'New Supplier',
    icon: 'UserPlus',
    scope: 'finance',
    href: '/finance/payables/suppliers/new',
  },
  {
    id: 'new-expense',
    title: 'New Expense Claim',
    icon: 'Receipt',
    scope: 'finance',
    href: '/finance/expenses/new',
  },
  {
    id: 'new-budget',
    title: 'New Budget',
    icon: 'PiggyBank',
    scope: 'finance',
    href: '/finance/budgets/new',
  },
  {
    id: 'open-keyboard-shortcuts',
    title: 'Open Keyboard Shortcuts',
    icon: 'Keyboard',
    shortcut: '?',
  },
];

// Register defaults on module load
for (const action of DEFAULT_ACTIONS) {
  registerAction(action);
}
