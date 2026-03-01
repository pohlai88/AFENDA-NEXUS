/**
 * Dashboard Contract - Defines minimum data requirements for all dashboard charts.
 * 
 * This contract ensures that seeded data will populate all dashboard visualizations.
 * If any requirement isn't met, the seed operation will fail with specific details.
 */

export interface DashboardContract {
  liquidityWaterfall: {
    minMonths: 6;
    requiredCategories: ['operating', 'investing', 'financing'];
    minMovements: 10;
  };
  dsoTrend: {
    minMonths: 6;
    minInvoices: 30;
    minReceipts: 20;
    requiredAgingBuckets: ['current', '30', '60', '90+'];
  };
  budgetVariance: {
    minMonths: 6;
    minAccounts: 10;
    requireBothBudgetAndActual: true;
  };
  assetPortfolio: {
    minCategories: 3;
    minAssets: 15;
    requireNbvChanges: true;
  };
  taxLiability: {
    minMonths: 6;
    requiredTaxTypes: ['output', 'input', 'net'];
  };
  workingCapital: {
    minMonths: 6;
    requireCurrentAssets: true;
    requireCurrentLiabilities: true;
  };
  financialRatios: {
    currentRatio: { min: 1.2; max: 3.0 };
    dso: { min: 30; max: 90 };
    debtToEquity: { min: 0.2; max: 1.5 };
  };
  cashFlowSankey: {
    minMonths: 6;
    requiredCategories: ['operating', 'investing', 'financing'];
    minFlows: 10;
  };
}

/**
 * Default contract requirements.
 * Adjust these based on your dashboard's actual needs.
 */
export const DEFAULT_CONTRACT: DashboardContract = {
  liquidityWaterfall: {
    minMonths: 6,
    requiredCategories: ['operating', 'investing', 'financing'],
    minMovements: 10,
  },
  dsoTrend: {
    minMonths: 6,
    minInvoices: 30,
    minReceipts: 20,
    requiredAgingBuckets: ['current', '30', '60', '90+'],
  },
  budgetVariance: {
    minMonths: 6,
    minAccounts: 10,
    requireBothBudgetAndActual: true,
  },
  assetPortfolio: {
    minCategories: 3,
    minAssets: 15,
    requireNbvChanges: true,
  },
  taxLiability: {
    minMonths: 6,
    requiredTaxTypes: ['output', 'input', 'net'],
  },
  workingCapital: {
    minMonths: 6,
    requireCurrentAssets: true,
    requireCurrentLiabilities: true,
  },
  financialRatios: {
    currentRatio: { min: 1.2, max: 3.0 },
    dso: { min: 30, max: 90 },
    debtToEquity: { min: 0.2, max: 1.5 },
  },
  cashFlowSankey: {
    minMonths: 6,
    requiredCategories: ['operating', 'investing', 'financing'],
    minFlows: 10,
  },
};
