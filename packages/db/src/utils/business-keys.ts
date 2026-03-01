/**
 * Generates stable business keys for deterministic seeding.
 * Same inputs = same keys, ensuring reproducibility.
 */

/**
 * Generates business key in format: PREFIX-0001, SUP-0042, etc.
 * @example businessKey('SUP', 1) => 'SUP-0001'
 */
export function businessKey(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

/**
 * Generates fiscal period code: 2025-01, 2025-12
 */
export function fiscalPeriodCode(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Generates chart of accounts code based on type and sequence.
 * @example accountCode('ASSET', 1) => '1001'
 */
export function accountCode(accountType: string, index: number): string {
  const prefixes: Record<string, number> = {
    ASSET: 1000,
    LIABILITY: 2000,
    EQUITY: 3000,
    REVENUE: 4000,
    EXPENSE: 5000,
  };
  return String((prefixes[accountType] || 9000) + index);
}

/**
 * Generates invoice number: INV-2025-0001
 */
export function invoiceNumber(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Generates journal number: JV-2025-0001
 */
export function journalNumber(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}
