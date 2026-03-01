/**
 * Financial Ratio Calculators
 * 
 * Canonical formulas for financial ratios
 * Note: These are CLIENT-SIDE utilities for display only
 * Business logic should live in the API/metrics layer
 */

/**
 * Current Ratio = Current Assets / Current Liabilities
 * Measures short-term liquidity
 */
export function calculateCurrentRatio(currentAssets: number, currentLiabilities: number): number {
  if (currentLiabilities === 0) return 0;
  return currentAssets / currentLiabilities;
}

/**
 * Quick Ratio (Acid Test) = (Current Assets - Inventory) / Current Liabilities
 * More conservative liquidity measure
 */
export function calculateQuickRatio(
  currentAssets: number,
  inventory: number,
  currentLiabilities: number
): number {
  if (currentLiabilities === 0) return 0;
  return (currentAssets - inventory) / currentLiabilities;
}

/**
 * Days Sales Outstanding (DSO) = (Accounts Receivable / Revenue) × Days
 * Average collection period
 */
export function calculateDSO(
  accountsReceivable: number,
  revenue: number,
  daysInPeriod: number = 365
): number {
  if (revenue === 0) return 0;
  return (accountsReceivable / revenue) * daysInPeriod;
}

/**
 * Days Payable Outstanding (DPO) = (Accounts Payable / COGS) × Days
 * Average payment period
 */
export function calculateDPO(
  accountsPayable: number,
  cogs: number,
  daysInPeriod: number = 365
): number {
  if (cogs === 0) return 0;
  return (accountsPayable / cogs) * daysInPeriod;
}

/**
 * Days Inventory Outstanding (DIO) = (Inventory / COGS) × Days
 * Average inventory holding period
 */
export function calculateDIO(
  inventory: number,
  cogs: number,
  daysInPeriod: number = 365
): number {
  if (cogs === 0) return 0;
  return (inventory / cogs) * daysInPeriod;
}

/**
 * Cash Conversion Cycle = DSO + DIO - DPO
 * Days from paying suppliers to collecting from customers
 */
export function calculateCashConversionCycle(dso: number, dio: number, dpo: number): number {
  return dso + dio - dpo;
}

/**
 * Debt-to-Equity Ratio = Total Debt / Total Equity
 * Measures financial leverage
 */
export function calculateDebtToEquity(totalDebt: number, totalEquity: number): number {
  if (totalEquity === 0) return 0;
  return totalDebt / totalEquity;
}

/**
 * Debt Service Coverage Ratio = EBITDA / Debt Service
 * Ability to service debt from operations
 */
export function calculateDebtServiceCoverage(ebitda: number, debtService: number): number {
  if (debtService === 0) return 0;
  return ebitda / debtService;
}

/**
 * Return on Assets (ROA) = Net Income / Total Assets
 * Profitability relative to assets
 */
export function calculateROA(netIncome: number, totalAssets: number): number {
  if (totalAssets === 0) return 0;
  return netIncome / totalAssets;
}

/**
 * Return on Equity (ROE) = Net Income / Total Equity
 * Profitability relative to shareholder equity
 */
export function calculateROE(netIncome: number, totalEquity: number): number {
  if (totalEquity === 0) return 0;
  return netIncome / totalEquity;
}

/**
 * Working Capital = Current Assets - Current Liabilities
 * Short-term operational liquidity
 */
export function calculateWorkingCapital(currentAssets: number, currentLiabilities: number): number {
  return currentAssets - currentLiabilities;
}

/**
 * Budget Variance Percentage = (Actual - Budget) / Budget
 * Variance as percentage of budget
 */
export function calculateBudgetVariance(actual: number, budget: number): number {
  if (budget === 0) return 0;
  return ((actual - budget) / budget) * 100;
}

/**
 * Determine if variance is favorable based on account type
 * Revenue: over budget = favorable
 * Expense: under budget = favorable
 */
export function isVarianceFavorable(
  actual: number,
  budget: number,
  accountType: 'revenue' | 'expense'
): boolean {
  const variance = actual - budget;
  return accountType === 'revenue' ? variance > 0 : variance < 0;
}

/**
 * Hedge Effectiveness Ratio = Change in Hedging Instrument / Change in Hedged Item
 * Must be 80-125% to qualify for hedge accounting
 */
export function calculateHedgeEffectiveness(
  hedgingInstrumentChange: number,
  hedgedItemChange: number
): number {
  if (hedgedItemChange === 0) return 0;
  return Math.abs(hedgingInstrumentChange / hedgedItemChange) * 100;
}

/**
 * Check if hedge effectiveness is within acceptable range (80-125%)
 */
export function isHedgeEffective(effectivenessRatio: number): boolean {
  return effectivenessRatio >= 80 && effectivenessRatio <= 125;
}
