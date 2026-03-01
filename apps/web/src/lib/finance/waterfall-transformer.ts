/**
 * Waterfall Data Transformer
 * 
 * Converts financial data into waterfall chart format
 */

export interface WaterfallStep {
  step: string;
  label: string;
  value: number;
  start: number;          // Cumulative before this step
  isTotal?: boolean;      // Opening/closing balances
  category: 'operating_in' | 'operating_out' | 'investing' | 'financing' | 'fx_reval' | 'total';
}

export interface CashFlowData {
  openingBalance: number;
  operatingInflows: number;
  operatingOutflows: number;
  investing: number;
  financing: number;
  fxRevaluation?: number;
  closingBalance: number;
}

/**
 * Transform cash flow data into waterfall format
 */
export function transformToWaterfall(data: CashFlowData): WaterfallStep[] {
  const steps: WaterfallStep[] = [];
  let cumulative = 0;

  // Opening balance
  steps.push({
    step: 'opening',
    label: 'Opening Cash',
    value: data.openingBalance,
    start: 0,
    isTotal: true,
    category: 'total',
  });
  cumulative = data.openingBalance;

  // Operating inflows
  if (data.operatingInflows !== 0) {
    steps.push({
      step: 'operating_in',
      label: 'Operating Inflows',
      value: data.operatingInflows,
      start: cumulative,
      category: 'operating_in',
    });
    cumulative += data.operatingInflows;
  }

  // Operating outflows
  if (data.operatingOutflows !== 0) {
    steps.push({
      step: 'operating_out',
      label: 'Operating Outflows',
      value: data.operatingOutflows,
      start: cumulative,
      category: 'operating_out',
    });
    cumulative += data.operatingOutflows;
  }

  // Investing
  if (data.investing !== 0) {
    steps.push({
      step: 'investing',
      label: 'Investing',
      value: data.investing,
      start: cumulative,
      category: 'investing',
    });
    cumulative += data.investing;
  }

  // Financing
  if (data.financing !== 0) {
    steps.push({
      step: 'financing',
      label: 'Financing',
      value: data.financing,
      start: cumulative,
      category: 'financing',
    });
    cumulative += data.financing;
  }

  // FX Revaluation (if multi-currency)
  if (data.fxRevaluation !== undefined && data.fxRevaluation !== 0) {
    steps.push({
      step: 'fx_reval',
      label: 'FX Revaluation',
      value: data.fxRevaluation,
      start: cumulative,
      category: 'fx_reval',
    });
    cumulative += data.fxRevaluation;
  }

  // Closing balance
  steps.push({
    step: 'closing',
    label: 'Closing Cash',
    value: data.closingBalance,
    start: 0,
    isTotal: true,
    category: 'total',
  });

  return steps;
}

/**
 * Calculate bridge values for waterfall (for floating bars)
 */
export function calculateWaterfallBridges(steps: WaterfallStep[]): Array<{
  label: string;
  base: number;
  value: number;
  total: number;
}> {
  let cumulative = 0;
  
  return steps.map((step) => {
    if (step.isTotal) {
      cumulative = step.value;
      return {
        label: step.label,
        base: 0,
        value: step.value,
        total: step.value,
      };
    }
    
    const base = cumulative;
    cumulative += step.value;
    
    return {
      label: step.label,
      base,
      value: step.value,
      total: cumulative,
    };
  });
}

/**
 * Validate waterfall data integrity
 */
export function validateWaterfall(data: CashFlowData): {
  isValid: boolean;
  error?: string;
} {
  const calculated = 
    data.openingBalance +
    data.operatingInflows +
    data.operatingOutflows +
    data.investing +
    data.financing +
    (data.fxRevaluation || 0);

  const difference = Math.abs(calculated - data.closingBalance);
  
  // Allow for small rounding errors (< $1)
  if (difference > 1) {
    return {
      isValid: false,
      error: `Waterfall does not balance: calculated ${calculated}, expected ${data.closingBalance}`,
    };
  }

  return { isValid: true };
}

/**
 * Format waterfall step for display
 */
export function formatWaterfallStep(step: WaterfallStep): string {
  const sign = step.value >= 0 ? '+' : '';
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(step.value));
  
  return `${step.label}: ${sign}${amount}`;
}
