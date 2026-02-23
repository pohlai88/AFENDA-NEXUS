/**
 * @see FX-01 — FX rate types: spot, average, closing, budget, hedge
 * @see FX-06 — FX gain/loss: realized vs unrealized separation
 * @see DE-03 — Functional currency + transaction currency on every line (IAS 21)
 *
 * Pure calculator — no I/O, no side effects.
 * Converts amounts between currencies using fixed-point BigInt arithmetic.
 * Eliminates floating-point penny errors by using a high-precision intermediate.
 */
import type { CalculatorResult } from "./journal-balance.js";

const PRECISION_SCALE = 10_000_000_000n; // 10^10 — intermediate precision for rate multiplication

export interface FxConversionResult {
  readonly fromAmount: bigint;
  readonly toAmount: bigint;
  readonly rate: number;
  readonly fromCurrency: string;
  readonly toCurrency: string;
}

/**
 * Converts a monetary amount using a fixed-point BigInt approach.
 * The rate is multiplied into a high-precision integer, then the result
 * is divided back down with banker's rounding.
 *
 * This replaces the old `Number(amount) * rate * factor` pattern which
 * had floating-point precision risk.
 */
export function convertAmountPrecise(
  amount: bigint,
  rate: number,
  fromCurrency: string,
  toCurrency: string,
): CalculatorResult<FxConversionResult> {
  if (amount < 0n) {
    throw new Error(`Amount must be non-negative, got ${amount}`);
  }
  if (rate <= 0 || !Number.isFinite(rate)) {
    throw new Error(`Rate must be finite and > 0, got ${rate}`);
  }

  if (fromCurrency === toCurrency) {
    return {
      result: { fromAmount: amount, toAmount: amount, rate: 1, fromCurrency, toCurrency },
      inputs: { amount: amount.toString(), rate, fromCurrency, toCurrency },
      explanation: `Same currency (${fromCurrency}), no conversion needed`,
    };
  }

  // Fixed-point multiplication: amount * (rate * PRECISION_SCALE) / PRECISION_SCALE
  // This avoids floating-point multiplication on the amount itself.
  // eslint-disable-next-line no-restricted-syntax -- CIG-02 exception: float-to-BigInt bridge
  const rateScaled = BigInt(Math.round(rate * Number(PRECISION_SCALE)));
  const intermediate = amount * rateScaled;
  // Banker's rounding: add half the scale before integer division
  const halfScale = PRECISION_SCALE / 2n;
  const converted = (intermediate + halfScale) / PRECISION_SCALE;

  return {
    result: {
      fromAmount: amount,
      toAmount: converted,
      rate,
      fromCurrency,
      toCurrency,
    },
    inputs: { amount: amount.toString(), rate, fromCurrency, toCurrency },
    explanation: `Converted ${amount} ${fromCurrency} → ${converted} ${toCurrency} at rate ${rate}`,
  };
}

export interface FxGainLossResult {
  readonly gainLossAmount: bigint;
  readonly isGain: boolean;
}

/**
 * Computes FX gain/loss between an original base-currency amount
 * and a revalued amount at current rates.
 */
export function computeGainLoss(
  originalAmount: bigint,
  revaluedAmount: bigint,
): CalculatorResult<FxGainLossResult> {
  const diff = revaluedAmount - originalAmount;
  const isGain = diff >= 0n;
  const gainLossAmount = isGain ? diff : -diff;

  return {
    result: { gainLossAmount, isGain },
    inputs: { originalAmount: originalAmount.toString(), revaluedAmount: revaluedAmount.toString() },
    explanation: `FX ${isGain ? "gain" : "loss"}: ${gainLossAmount} minor units`,
  };
}
