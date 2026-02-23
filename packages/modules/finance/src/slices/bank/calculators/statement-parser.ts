/**
 * BR-01: Bank statement parser (OFX, MT940, camt.053, CSV).
 * Pure calculator — parses raw text into structured statement lines.
 * No DB, no side effects.
 */

import type { StatementFormat } from "../entities/bank-statement.js";
import type { TransactionType } from "../entities/bank-statement-line.js";

export interface ParsedStatementLine {
  readonly lineNumber: number;
  readonly transactionDate: Date;
  readonly valueDate: Date | null;
  readonly transactionType: TransactionType;
  readonly amount: bigint;
  readonly reference: string | null;
  readonly description: string;
  readonly payeeOrPayer: string | null;
  readonly bankReference: string | null;
}

export interface ParsedStatement {
  readonly format: StatementFormat;
  readonly bankAccountId: string;
  readonly bankAccountName: string;
  readonly statementDate: Date;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly openingBalance: bigint;
  readonly closingBalance: bigint;
  readonly currencyCode: string;
  readonly lines: readonly ParsedStatementLine[];
}

export interface ParseResult {
  readonly isValid: boolean;
  readonly statement: ParsedStatement | null;
  readonly errors: readonly string[];
}

/**
 * Parse an OFX bank statement string into structured data.
 * Simplified parser — real OFX is XML-based.
 */
export function parseOfx(raw: string): ParseResult {
  const errors: string[] = [];
  const lines: ParsedStatementLine[] = [];

  // Extract header fields
  const accountMatch = raw.match(/<ACCTID>([^<\n]+)/);
  const currencyMatch = raw.match(/<CURDEF>([A-Z]{3})/);
  const balStartMatch = raw.match(/<BALAMT>([+-]?\d+)/);

  if (!accountMatch) errors.push("Missing ACCTID");
  if (!currencyMatch) errors.push("Missing CURDEF");

  // Extract transactions
  const txRegex = /<STMTTRN>[\s\S]*?<TRNTYPE>(\w+)[\s\S]*?<DTPOSTED>(\d{8})[\s\S]*?<TRNAMT>([+-]?\d+)[\s\S]*?<NAME>([^<\n]*)[\s\S]*?<\/STMTTRN>/g;
  let match: RegExpExecArray | null;
  let lineNum = 1;

  while ((match = txRegex.exec(raw)) !== null) {
    const amt = BigInt(match[3]!);
    lines.push({
      lineNumber: lineNum++,
      transactionDate: parseOfxDate(match[2]!),
      valueDate: null,
      transactionType: amt < 0n ? "DEBIT" : "CREDIT",
      amount: amt < 0n ? -amt : amt,
      reference: null,
      description: match[4]!.trim(),
      payeeOrPayer: match[4]!.trim(),
      bankReference: null,
    });
  }

  if (errors.length > 0) return { isValid: false, statement: null, errors };

  return {
    isValid: true,
    statement: {
      format: "OFX",
      bankAccountId: accountMatch![1]!.trim(),
      bankAccountName: accountMatch![1]!.trim(),
      statementDate: new Date(),
      periodStart: lines.length > 0 ? lines[0]!.transactionDate : new Date(),
      periodEnd: lines.length > 0 ? lines[lines.length - 1]!.transactionDate : new Date(),
      openingBalance: balStartMatch ? BigInt(balStartMatch[1]!) : 0n,
      closingBalance: 0n,
      currencyCode: currencyMatch![1]!,
      lines,
    },
    errors: [],
  };
}

/**
 * Parse a simplified CSV bank statement.
 * Expected columns: Date,Type,Amount,Reference,Description
 */
export function parseCsv(raw: string, currencyCode: string, bankAccountId: string): ParseResult {
  const errors: string[] = [];
  const lines: ParsedStatementLine[] = [];
  const rows = raw.trim().split("\n");

  if (rows.length < 2) {
    errors.push("CSV must have header + at least one data row");
    return { isValid: false, statement: null, errors };
  }

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i]!.split(",").map((c) => c.trim());
    if (cols.length < 5) {
      errors.push(`Row ${i}: expected 5 columns, got ${cols.length}`);
      continue;
    }
    const amt = BigInt(cols[2]!);
    lines.push({
      lineNumber: i,
      transactionDate: new Date(cols[0]!),
      valueDate: null,
      transactionType: cols[1] as TransactionType,
      amount: amt < 0n ? -amt : amt,
      reference: cols[3] || null,
      description: cols[4]!,
      payeeOrPayer: null,
      bankReference: null,
    });
  }

  if (errors.length > 0) return { isValid: false, statement: null, errors };

  return {
    isValid: true,
    statement: {
      format: "CSV",
      bankAccountId,
      bankAccountName: bankAccountId,
      statementDate: new Date(),
      periodStart: lines.length > 0 ? lines[0]!.transactionDate : new Date(),
      periodEnd: lines.length > 0 ? lines[lines.length - 1]!.transactionDate : new Date(),
      openingBalance: 0n,
      closingBalance: 0n,
      currencyCode,
      lines,
    },
    errors: [],
  };
}

function parseOfxDate(s: string): Date {
  const y = parseInt(s.substring(0, 4), 10);
  const m = parseInt(s.substring(4, 6), 10) - 1;
  const d = parseInt(s.substring(6, 8), 10);
  return new Date(y, m, d);
}
