/**
 * SR-07: Financial ratio / KPI calculator.
 * Pure calculator — computes liquidity, profitability, leverage,
 * and efficiency ratios from balance sheet and income statement data.
 *
 * All monetary inputs are bigint (minor units). Ratios are returned as
 * basis points (×10000) for BigInt precision, or as days (integer).
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface RatioInput {
  // Balance sheet items (at period end)
  readonly currentAssets: bigint;
  readonly currentLiabilities: bigint;
  readonly inventory: bigint;
  readonly cash: bigint;
  readonly totalAssets: bigint;
  readonly totalLiabilities: bigint;
  readonly totalEquity: bigint;
  readonly tradeReceivables: bigint;
  readonly tradePayables: bigint;

  // Income statement items (for the period)
  readonly revenue: bigint;
  readonly costOfSales: bigint;
  readonly grossProfit: bigint;
  readonly operatingProfit: bigint;
  readonly netProfit: bigint;
  readonly interestExpense: bigint;
  readonly depreciation: bigint;

  // Optional: prior period for trend
  readonly daysInPeriod?: number;
}

export interface RatioResult {
  readonly liquidity: LiquidityRatios;
  readonly profitability: ProfitabilityRatios;
  readonly leverage: LeverageRatios;
  readonly efficiency: EfficiencyRatios;
  readonly altmanZScore: bigint | null;
}

export interface LiquidityRatios {
  /** Current Assets / Current Liabilities (×10000) */
  readonly currentRatio: bigint;
  /** (Current Assets - Inventory) / Current Liabilities (×10000) */
  readonly quickRatio: bigint;
  /** Cash / Current Liabilities (×10000) */
  readonly cashRatio: bigint;
}

export interface ProfitabilityRatios {
  /** Gross Profit / Revenue (×10000) */
  readonly grossMargin: bigint;
  /** Operating Profit / Revenue (×10000) */
  readonly operatingMargin: bigint;
  /** Net Profit / Revenue (×10000) */
  readonly netMargin: bigint;
  /** Net Profit / Total Assets (×10000) */
  readonly returnOnAssets: bigint;
  /** Net Profit / Total Equity (×10000) */
  readonly returnOnEquity: bigint;
  /** Operating Profit / (Total Assets - Current Liabilities) (×10000) */
  readonly returnOnCapitalEmployed: bigint;
}

export interface LeverageRatios {
  /** Total Liabilities / Total Equity (×10000) */
  readonly debtToEquity: bigint;
  /** Operating Profit / Interest Expense (×10000) */
  readonly interestCoverage: bigint;
  /** (Operating Profit + Depreciation) / Interest Expense (×10000) */
  readonly debtServiceCoverage: bigint;
}

export interface EfficiencyRatios {
  /** (Trade Receivables / Revenue) × Days in Period */
  readonly receivableDays: bigint;
  /** (Trade Payables / Cost of Sales) × Days in Period */
  readonly payableDays: bigint;
  /** (Inventory / Cost of Sales) × Days in Period */
  readonly inventoryDays: bigint;
  /** Receivable Days + Inventory Days - Payable Days */
  readonly cashConversionCycle: bigint;
}

function safeDiv(numerator: bigint, denominator: bigint, scale: bigint = 10000n): bigint {
  if (denominator === 0n) return 0n;
  return (numerator * scale) / denominator;
}

/**
 * Computes comprehensive financial ratios from balance sheet and income statement data.
 */
export function computeFinancialRatios(input: RatioInput): CalculatorResult<RatioResult> {
  const days = BigInt(input.daysInPeriod ?? 365);

  // Liquidity
  const currentRatio = safeDiv(input.currentAssets, input.currentLiabilities);
  const quickRatio = safeDiv(input.currentAssets - input.inventory, input.currentLiabilities);
  const cashRatio = safeDiv(input.cash, input.currentLiabilities);

  // Profitability
  const grossMargin = safeDiv(input.grossProfit, input.revenue);
  const operatingMargin = safeDiv(input.operatingProfit, input.revenue);
  const netMargin = safeDiv(input.netProfit, input.revenue);
  const returnOnAssets = safeDiv(input.netProfit, input.totalAssets);
  const returnOnEquity = safeDiv(input.netProfit, input.totalEquity);
  const capitalEmployed = input.totalAssets - input.currentLiabilities;
  const returnOnCapitalEmployed = safeDiv(input.operatingProfit, capitalEmployed);

  // Leverage
  const debtToEquity = safeDiv(input.totalLiabilities, input.totalEquity);
  const interestCoverage = safeDiv(input.operatingProfit, input.interestExpense);
  const debtServiceCoverage = safeDiv(
    input.operatingProfit + input.depreciation,
    input.interestExpense
  );

  // Efficiency (in days)
  const receivableDays = input.revenue > 0n ? (input.tradeReceivables * days) / input.revenue : 0n;
  const payableDays =
    input.costOfSales > 0n ? (input.tradePayables * days) / input.costOfSales : 0n;
  const inventoryDays = input.costOfSales > 0n ? (input.inventory * days) / input.costOfSales : 0n;
  const cashConversionCycle = receivableDays + inventoryDays - payableDays;

  // Altman Z-Score (original manufacturing model, simplified)
  // Z = 1.2×A + 1.4×B + 3.3×C + 0.6×D + 1.0×E
  // Where: A = Working Capital / Total Assets
  //        B = Retained Earnings / Total Assets (approx: equity / total assets)
  //        C = EBIT / Total Assets
  //        D = Equity / Total Liabilities
  //        E = Revenue / Total Assets
  // All in basis points ×10000, then divided by 10000 at the end
  let altmanZScore: bigint | null = null;
  if (input.totalAssets > 0n && input.totalLiabilities > 0n) {
    const workingCapital = input.currentAssets - input.currentLiabilities;
    const a = safeDiv(workingCapital, input.totalAssets); // ×10000
    const b = safeDiv(input.totalEquity, input.totalAssets); // ×10000
    const c = safeDiv(input.operatingProfit, input.totalAssets); // ×10000
    const d = safeDiv(input.totalEquity, input.totalLiabilities); // ×10000
    const e = safeDiv(input.revenue, input.totalAssets); // ×10000

    // Z × 10000 = 1.2×A + 1.4×B + 3.3×C + 0.6×D + 1.0×E
    // Using integer math: multiply coefficients by 10 to avoid decimals
    // Z × 100000 = 12×A + 14×B + 33×C + 6×D + 10×E
    // Then divide by 10 to get Z × 10000
    altmanZScore = (12n * a + 14n * b + 33n * c + 6n * d + 10n * e) / 10n;
  }

  return {
    result: {
      liquidity: { currentRatio, quickRatio, cashRatio },
      profitability: {
        grossMargin,
        operatingMargin,
        netMargin,
        returnOnAssets,
        returnOnEquity,
        returnOnCapitalEmployed,
      },
      leverage: { debtToEquity, interestCoverage, debtServiceCoverage },
      efficiency: { receivableDays, payableDays, inventoryDays, cashConversionCycle },
      altmanZScore,
    },
    inputs: {
      totalAssets: input.totalAssets.toString(),
      revenue: input.revenue.toString(),
      daysInPeriod: input.daysInPeriod ?? 365,
    },
    explanation:
      `Financial ratios: current=${currentRatio}, ROE=${returnOnEquity}, D/E=${debtToEquity}, CCC=${cashConversionCycle}d${ 
      altmanZScore !== null ? `, Z-score=${altmanZScore}` : ''}`,
  };
}
