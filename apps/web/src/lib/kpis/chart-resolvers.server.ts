import 'server-only';

// ─── Chart Resolvers (Server-Only) ──────────────────────────────────────────
//
// Async resolvers for dashboard chart data. Currently return stub data
// shaped like real domain data. Each chart displays a "Preview" badge
// until the resolver is wired to real DB queries.
//
// Pattern matches kpi-registry.server.ts: error-isolated, deterministic.
//
// TODO: Wire to real queries:
//   const ctx = await getRequestContext();
//   const client = createApiClient(ctx);
//   return client.get('/reports/cash-flow', { months: 6 });
//
// ─────────────────────────────────────────────────────────────────────────────

interface RequestContextLike {
  token?: string;
  [key: string]: unknown;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CashFlowPoint {
  month: string;
  inflow: number;
  outflow: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
}

export interface AgingBucket {
  bucket: string;
  amount: number;
}

export interface ChartData {
  cashFlow: CashFlowPoint[];
  expenses: ExpenseCategory[];
  arAging: AgingBucket[];
  /** Whether this data is preview/stub (true) or from real queries (false). */
  isPreview: boolean;
}

// ─── Stub Data ───────────────────────────────────────────────────────────────

const STUB_CASH_FLOW: CashFlowPoint[] = [
  { month: 'Sep', inflow: 124000, outflow: 98000 },
  { month: 'Oct', inflow: 156000, outflow: 112000 },
  { month: 'Nov', inflow: 142000, outflow: 128000 },
  { month: 'Dec', inflow: 189000, outflow: 145000 },
  { month: 'Jan', inflow: 167000, outflow: 134000 },
  { month: 'Feb', inflow: 178000, outflow: 142000 },
];

const STUB_EXPENSES: ExpenseCategory[] = [
  { category: 'Payroll', amount: 85000 },
  { category: 'Rent', amount: 12000 },
  { category: 'Software', amount: 8500 },
  { category: 'Travel', amount: 4200 },
  { category: 'Marketing', amount: 6800 },
  { category: 'Utilities', amount: 2100 },
];

const STUB_AR_AGING: AgingBucket[] = [
  { bucket: 'Current', amount: 45000 },
  { bucket: '1-30', amount: 22000 },
  { bucket: '31-60', amount: 8500 },
  { bucket: '61-90', amount: 3200 },
  { bucket: '90+', amount: 1800 },
];

// ─── Resolver ────────────────────────────────────────────────────────────────

/**
 * Resolve chart data for the dashboard.
 * Returns stub/preview data until wired to real DB queries.
 * Error-isolated: never throws — returns empty data on failure.
 */
export async function resolveChartData(
  _ctx?: RequestContextLike,
): Promise<ChartData> {
  try {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 80));

    // TODO: Replace with real queries:
    // const [cashFlow, expenses, arAging] = await Promise.all([
    //   client.get('/reports/cash-flow', { months: 6 }),
    //   client.get('/reports/expense-breakdown'),
    //   client.get('/reports/ar-aging'),
    // ]);

    return {
      cashFlow: STUB_CASH_FLOW,
      expenses: STUB_EXPENSES,
      arAging: STUB_AR_AGING,
      isPreview: true,
    };
  } catch {
    // Error-isolated: return empty data
    return {
      cashFlow: [],
      expenses: [],
      arAging: [],
      isPreview: true,
    };
  }
}
