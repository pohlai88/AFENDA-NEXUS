import type { OcrExtractionResult, OcrFieldEvidence } from '../ports/ocr-provider';
import type { OcrConfidenceLevel } from '../ports/ocr-job-repo';

export interface OcrScorerContext {
  readonly currencyDecimals?: number;
}

export interface OcrConfidenceScore {
  readonly level: OcrConfidenceLevel;
  readonly score: number;
  readonly issues: readonly string[];
  readonly breakdown: {
    readonly criticalFields: number;
    readonly amounts: number;
    readonly dates: number;
    readonly supplier: number;
    readonly lineItems: number;
  };
}

const CRITICAL_FIELD_WEIGHT = 0.3;
const AMOUNTS_WEIGHT = 0.25;
const DATES_WEIGHT = 0.2;
const SUPPLIER_WEIGHT = 0.15;
const LINE_ITEMS_WEIGHT = 0.1;

function scoreField(field: OcrFieldEvidence | null, minConfidence = 0.7): number {
  if (!field) return 0;
  if (!field.value || field.value.trim() === '') return 0;
  return field.confidence >= minConfidence ? 1 : field.confidence;
}

function scoreCriticalFields(result: OcrExtractionResult): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 0;
  let count = 0;

  const invoiceNumberScore = scoreField(result.invoiceNumber);
  score += invoiceNumberScore;
  count++;
  if (invoiceNumberScore < 0.7) {
    issues.push('Invoice number missing or low confidence');
  }

  const totalAmountScore = scoreField(result.totalAmount);
  score += totalAmountScore;
  count++;
  if (totalAmountScore < 0.7) {
    issues.push('Total amount missing or low confidence');
  }

  const currencyScore = scoreField(result.currencyCode);
  score += currencyScore;
  count++;
  if (currencyScore === 0) {
    issues.push('SILENT_KILLER: Currency code missing');
  }

  return { score: count > 0 ? score / count : 0, issues };
}

function scoreAmounts(
  result: OcrExtractionResult,
  _context: OcrScorerContext
): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 0;
  let count = 0;

  if (result.totalAmount) {
    const totalScore = scoreField(result.totalAmount);
    score += totalScore;
    count++;

    const amountStr = result.totalAmount.value;
    const parsed = parseFloat(amountStr);
    if (!isNaN(parsed) && parsed <= 0) {
      issues.push('Total amount is zero or negative');
    }
  }

  if (result.taxAmount) {
    const taxScore = scoreField(result.taxAmount, 0.6);
    score += taxScore;
    count++;
    if (taxScore === 0) {
      issues.push('SILENT_KILLER: Tax amount missing');
    }
  }

  return { score: count > 0 ? score / count : 0, issues };
}

function scoreDates(result: OcrExtractionResult): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 0;
  let count = 0;

  const invoiceDateScore = scoreField(result.invoiceDate);
  score += invoiceDateScore;
  count++;
  if (invoiceDateScore < 0.7) {
    issues.push('Invoice date missing or low confidence');
  }

  if (result.dueDate) {
    const dueDateScore = scoreField(result.dueDate, 0.6);
    score += dueDateScore;
    count++;
  }

  return { score: count > 0 ? score / count : 0, issues };
}

function scoreSupplier(result: OcrExtractionResult): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 0;
  let count = 0;

  const nameScore = scoreField(result.supplierName);
  score += nameScore;
  count++;
  if (nameScore < 0.7) {
    issues.push('Supplier name missing or low confidence');
  }

  if (result.supplierTaxId) {
    const taxIdScore = scoreField(result.supplierTaxId, 0.6);
    score += taxIdScore;
    count++;
  }

  if (result.supplierAddress) {
    const addressScore = scoreField(result.supplierAddress, 0.5);
    score += addressScore;
    count++;
  }

  return { score: count > 0 ? score / count : 0, issues };
}

function scoreLineItems(result: OcrExtractionResult): { score: number; issues: string[] } {
  const issues: string[] = [];

  if (!result.lineItems || result.lineItems.length === 0) {
    issues.push('No line items extracted');
    return { score: 0, issues };
  }

  let totalScore = 0;
  let itemCount = 0;

  for (const item of result.lineItems) {
    let itemScore = 0;
    let fieldCount = 0;

    if (item.description) {
      itemScore += scoreField(item.description, 0.6);
      fieldCount++;
    }

    if (item.quantity) {
      const qtyScore = scoreField(item.quantity, 0.6);
      itemScore += qtyScore;
      fieldCount++;
      if (qtyScore === 0) {
        issues.push('SILENT_KILLER: Line item quantity missing');
      }
    }

    if (item.unitPrice) {
      itemScore += scoreField(item.unitPrice, 0.6);
      fieldCount++;
    }

    if (item.amount) {
      itemScore += scoreField(item.amount, 0.7);
      fieldCount++;
    }

    if (fieldCount > 0) {
      totalScore += itemScore / fieldCount;
      itemCount++;
    }
  }

  const score = itemCount > 0 ? totalScore / itemCount : 0;
  return { score, issues };
}

export function computeOcrConfidence(
  result: OcrExtractionResult,
  context: OcrScorerContext = {}
): OcrConfidenceScore {
  const critical = scoreCriticalFields(result);
  const amounts = scoreAmounts(result, context);
  const dates = scoreDates(result);
  const supplier = scoreSupplier(result);
  const lineItems = scoreLineItems(result);

  const weightedScore =
    critical.score * CRITICAL_FIELD_WEIGHT +
    amounts.score * AMOUNTS_WEIGHT +
    dates.score * DATES_WEIGHT +
    supplier.score * SUPPLIER_WEIGHT +
    lineItems.score * LINE_ITEMS_WEIGHT;

  const allIssues = [
    ...critical.issues,
    ...amounts.issues,
    ...dates.issues,
    ...supplier.issues,
    ...lineItems.issues,
  ];

  const hasSilentKiller = allIssues.some((issue) => issue.startsWith('SILENT_KILLER:'));

  let level: OcrConfidenceLevel;
  if (hasSilentKiller || weightedScore < 0.5) {
    level = 'LOW';
  } else if (weightedScore >= 0.8) {
    level = 'HIGH';
  } else {
    level = 'MEDIUM';
  }

  return {
    level,
    score: weightedScore,
    issues: allIssues,
    breakdown: {
      criticalFields: critical.score,
      amounts: amounts.score,
      dates: dates.score,
      supplier: supplier.score,
      lineItems: lineItems.score,
    },
  };
}
