/**
 * TX-05: SAF-T (Standard Audit File for Tax) export builder.
 * Generates SAF-T compliant JSON structure from GL and tax data.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units).
 */

export interface SaftHeader {
  readonly auditFileVersion: string;
  readonly companyId: string;
  readonly companyName: string;
  readonly taxRegistrationNumber: string;
  readonly fiscalYear: number;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly currencyCode: string;
  readonly generatedAt: Date;
}

export interface SaftAccount {
  readonly accountId: string;
  readonly accountCode: string;
  readonly accountDescription: string;
  readonly openingDebit: bigint;
  readonly openingCredit: bigint;
  readonly closingDebit: bigint;
  readonly closingCredit: bigint;
}

export interface SaftTransaction {
  readonly transactionId: string;
  readonly transactionDate: Date;
  readonly description: string;
  readonly documentRef: string;
  readonly lines: readonly SaftTransactionLine[];
}

export interface SaftTransactionLine {
  readonly accountId: string;
  readonly debitAmount: bigint;
  readonly creditAmount: bigint;
  readonly taxCode: string | null;
  readonly taxAmount: bigint;
  readonly currencyCode: string;
}

export interface SaftTaxEntry {
  readonly taxCode: string;
  readonly taxDescription: string;
  readonly taxableAmount: bigint;
  readonly taxAmount: bigint;
  readonly taxType: string;
}

export interface SaftFile {
  readonly header: SaftHeader;
  readonly accounts: readonly SaftAccount[];
  readonly transactions: readonly SaftTransaction[];
  readonly taxSummary: readonly SaftTaxEntry[];
  readonly totalDebit: bigint;
  readonly totalCredit: bigint;
  readonly transactionCount: number;
}

/**
 * Build a SAF-T compliant data structure from GL and tax data.
 * Returns a structured object that can be serialized to JSON or XML.
 */
export function buildSaftFile(
  header: SaftHeader,
  accounts: readonly SaftAccount[],
  transactions: readonly SaftTransaction[],
  taxEntries: readonly SaftTaxEntry[],
): SaftFile {
  let totalDebit = 0n;
  let totalCredit = 0n;

  for (const tx of transactions) {
    for (const line of tx.lines) {
      totalDebit += line.debitAmount;
      totalCredit += line.creditAmount;
    }
  }

  return {
    header,
    accounts,
    transactions,
    taxSummary: taxEntries,
    totalDebit,
    totalCredit,
    transactionCount: transactions.length,
  };
}

/**
 * Validate a SAF-T file for basic integrity.
 */
export interface SaftValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export function validateSaftFile(file: SaftFile): SaftValidationResult {
  const errors: string[] = [];

  if (file.totalDebit !== file.totalCredit) {
    errors.push(`Debit/credit mismatch: debit=${file.totalDebit}, credit=${file.totalCredit}`);
  }

  if (file.transactionCount === 0) {
    errors.push("No transactions in SAF-T file");
  }

  if (!file.header.taxRegistrationNumber) {
    errors.push("Missing tax registration number");
  }

  if (file.header.startDate > file.header.endDate) {
    errors.push("Start date is after end date");
  }

  for (const acct of file.accounts) {
    const openingNet = acct.openingDebit - acct.openingCredit;
    const closingNet = acct.closingDebit - acct.closingCredit;
    if (openingNet === closingNet && file.transactionCount > 0) {
      // Not necessarily an error, but worth flagging
    }
  }

  return { isValid: errors.length === 0, errors };
}
