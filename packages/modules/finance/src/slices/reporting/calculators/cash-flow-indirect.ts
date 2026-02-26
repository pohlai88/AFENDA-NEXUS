/**
 * @see CF-01 — Indirect method cash flow derivation from trial balance
 * @see IAS-7  — Statement of Cash Flows
 *
 * Pure calculator — no I/O, no side effects.
 * Derives a cash flow statement using the indirect method:
 *   Net Income
 *   + Non-cash adjustments (depreciation, amortization)
 *   + Working capital changes (Δ receivables, Δ payables, Δ inventory)
 *   = Operating Cash Flow
 *   + Investing activities (Δ fixed assets, Δ investments)
 *   + Financing activities (Δ debt, Δ equity, dividends)
 *   = Net Cash Flow
 */
import type { AccountType } from '../../../shared/types.js';
import type { CalculatorResult } from '../../../shared/types.js';

export interface TrialBalanceMovement {
  readonly accountId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly accountSubType: CashFlowSubType;
  readonly openingBalanceMinor: bigint;
  readonly closingBalanceMinor: bigint;
  readonly currency: string;
}

export type CashFlowSubType =
  | 'cash'
  | 'receivable'
  | 'inventory'
  | 'prepaid'
  | 'fixed_asset'
  | 'intangible_asset'
  | 'investment'
  | 'payable'
  | 'accrued_liability'
  | 'short_term_debt'
  | 'long_term_debt'
  | 'equity_common'
  | 'equity_retained'
  | 'revenue'
  | 'cost_of_sales'
  | 'operating_expense'
  | 'depreciation'
  | 'amortization'
  | 'interest_expense'
  | 'tax_expense'
  | 'other_income'
  | 'other_expense'
  | 'dividend'
  | 'other';

export interface CashFlowSection {
  readonly label: string;
  readonly lines: readonly CashFlowLine[];
  readonly totalMinor: bigint;
}

export interface CashFlowLine {
  readonly accountId: string;
  readonly accountCode: string;
  readonly description: string;
  readonly amountMinor: bigint;
}

export interface IndirectCashFlowResult {
  readonly netIncome: bigint;
  readonly nonCashAdjustments: CashFlowSection;
  readonly workingCapitalChanges: CashFlowSection;
  readonly operatingCashFlow: bigint;
  readonly investingActivities: CashFlowSection;
  readonly financingActivities: CashFlowSection;
  readonly netCashFlow: bigint;
  readonly openingCash: bigint;
  readonly closingCash: bigint;
  readonly currency: string;
}

const NON_CASH_SUBTYPES: ReadonlySet<CashFlowSubType> = new Set(['depreciation', 'amortization']);

const WORKING_CAPITAL_SUBTYPES: ReadonlySet<CashFlowSubType> = new Set([
  'receivable',
  'inventory',
  'prepaid',
  'payable',
  'accrued_liability',
]);

const INVESTING_SUBTYPES: ReadonlySet<CashFlowSubType> = new Set([
  'fixed_asset',
  'intangible_asset',
  'investment',
]);

const FINANCING_SUBTYPES: ReadonlySet<CashFlowSubType> = new Set([
  'short_term_debt',
  'long_term_debt',
  'equity_common',
  'dividend',
]);

function movement(m: TrialBalanceMovement): bigint {
  return m.closingBalanceMinor - m.openingBalanceMinor;
}

function buildSection(
  label: string,
  movements: readonly TrialBalanceMovement[],
  subtypes: ReadonlySet<CashFlowSubType>,
  signFn: (m: TrialBalanceMovement) => bigint
): CashFlowSection {
  const matching = movements.filter((m) => subtypes.has(m.accountSubType));
  const lines: CashFlowLine[] = matching.map((m) => ({
    accountId: m.accountId,
    accountCode: m.accountCode,
    description: m.accountName,
    amountMinor: signFn(m),
  }));
  const totalMinor = lines.reduce((sum, l) => sum + l.amountMinor, 0n);
  return { label, lines, totalMinor };
}

/**
 * Derives a cash flow statement (indirect method) from trial balance movements.
 *
 * Sign conventions:
 * - Asset increases are cash outflows (negative)
 * - Liability/equity increases are cash inflows (positive)
 * - Revenue is positive, expense is negative (for net income)
 * - Non-cash expenses (depreciation) are added back
 */
export function deriveCashFlowIndirect(
  movements: readonly TrialBalanceMovement[]
): CalculatorResult<IndirectCashFlowResult> {
  if (movements.length === 0) {
    throw new Error('At least one trial balance movement required');
  }

  const currency = movements[0]!.currency;

  // Net income = revenue - expenses (all P&L accounts)
  let netIncome = 0n;
  for (const m of movements) {
    if (m.accountType === 'REVENUE' || m.accountSubType === 'other_income') {
      netIncome += movement(m);
    } else if (
      m.accountType === 'EXPENSE' ||
      m.accountSubType === 'cost_of_sales' ||
      m.accountSubType === 'operating_expense' ||
      m.accountSubType === 'interest_expense' ||
      m.accountSubType === 'tax_expense' ||
      m.accountSubType === 'other_expense'
    ) {
      netIncome -= movement(m);
    }
  }

  // Non-cash adjustments: add back depreciation/amortization
  const nonCashAdjustments = buildSection(
    'Non-Cash Adjustments',
    movements,
    NON_CASH_SUBTYPES,
    (m) => movement(m) // positive = add back
  );

  // Working capital changes: asset increase = outflow, liability increase = inflow
  const workingCapitalChanges = buildSection(
    'Changes in Working Capital',
    movements,
    WORKING_CAPITAL_SUBTYPES,
    (m) => {
      if (m.accountType === 'ASSET') return -movement(m); // asset increase = cash outflow
      return movement(m); // liability increase = cash inflow
    }
  );

  const operatingCashFlow =
    netIncome + nonCashAdjustments.totalMinor + workingCapitalChanges.totalMinor;

  // Investing: asset purchases are outflows
  const investingActivities = buildSection(
    'Investing Activities',
    movements,
    INVESTING_SUBTYPES,
    (m) => -movement(m) // asset increase = cash outflow
  );

  // Financing: debt/equity increases are inflows, dividends are outflows
  const financingActivities = buildSection(
    'Financing Activities',
    movements,
    FINANCING_SUBTYPES,
    (m) => {
      if (m.accountSubType === 'dividend') return -movement(m);
      return movement(m); // debt/equity increase = inflow
    }
  );

  const netCashFlow =
    operatingCashFlow + investingActivities.totalMinor + financingActivities.totalMinor;

  // Cash accounts
  const cashAccounts = movements.filter((m) => m.accountSubType === 'cash');
  const openingCash = cashAccounts.reduce((sum, m) => sum + m.openingBalanceMinor, 0n);
  const closingCash = cashAccounts.reduce((sum, m) => sum + m.closingBalanceMinor, 0n);

  return {
    result: {
      netIncome,
      nonCashAdjustments,
      workingCapitalChanges,
      operatingCashFlow,
      investingActivities,
      financingActivities,
      netCashFlow,
      openingCash,
      closingCash,
      currency,
    },
    inputs: { movementCount: movements.length, currency },
    explanation: `Indirect cash flow: net income=${netIncome}, operating=${operatingCashFlow}, investing=${investingActivities.totalMinor}, financing=${financingActivities.totalMinor}, net=${netCashFlow}`,
  };
}
