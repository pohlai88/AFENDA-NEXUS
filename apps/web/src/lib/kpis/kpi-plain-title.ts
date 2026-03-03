// ─── Algorithmic plain-language title generator ─────────────────────────────
// Transforms financial/ERP jargon into plain English titles.
// Rules are applied in order: jargon phrases → abbreviation expansion → pattern cleanup.
// Falls back to `description` (truncated) when no rules match.

/** Full phrase → plain replacement (checked first, case-insensitive). */
const JARGON_MAP: [RegExp, string][] = [
  [/\bAccounts Payable\b/i, 'Money owed'],
  [/\bAccounts Receivable\b/i, 'Money to receive'],
  [/\bTotal Payables\b/i, 'Money owed'],
  [/\bTotal Receivables\b/i, 'Money to receive'],
  [/\bCash Position\b/i, 'Cash in bank'],
  [/\bBank Balance\b/i, 'Cash in bank'],
  [/\bCash Forecast\b/i, 'Cash forecast'],
  [/\bNet Income\b/i, 'Profit'],
  [/\bTrial Balance\b/i, 'Debits & credits check'],
  [/\bDays Sales Outstanding\b/i, 'Days to collect payment'],
  [/\bCovenant Breaches?\b/i, 'Loan rule violations'],
  [/\bBudget Variance\b/i, 'Over\/under budget'],
  [/\bGoodwill Balance\b/i, 'Acquisition value'],
  [/\bPending Eliminations?\b/i, 'Internal adjustments pending'],
  [/\bPending Allocations?\b/i, 'Costs to distribute'],
  [/\bPending Approval\b/i, 'Awaiting approval'],
  [/\bPending Disposals?\b/i, 'Assets being retired'],
  [/\bPending Returns?\b/i, 'Tax filings due'],
  [/\bOverdue Invoices?\b/i, 'Bills past due'],
  [/\bUnreconciled Items?\b/i, 'Unmatched bank items'],
  [/\bUnposted Journals?\b/i, 'Entries not yet posted'],
  [/\bOpen Claims?\b/i, 'Expense claims open'],
  [/\bOpen Provisions?\b/i, 'Set-aside amounts'],
  [/\bOpen IC Transactions?\b/i, 'Intercompany transactions open'],
  [/\bActive Leases?\b/i, 'Leases in effect'],
  [/\bActive Hedges?\b/i, 'Risk protections'],
  [/\bActive Loans?\b/i, 'Outstanding loans'],
  [/\bActive Projects?\b/i, 'Projects in progress'],
  [/\bActive Cost Centers?\b/i, 'Cost centers in use'],
  [/\bActive Tax Codes?\b/i, 'Tax codes in use'],
  [/\bActive Tenants?\b/i, 'Active organizations'],
  [/\bGroup Entities\b/i, 'Group companies'],
  [/\bTotal Fixed Assets?\b/i, 'Asset value'],
  [/\bFixed Assets?\b/i, 'Asset value'],
  [/\bPayment Terms?\b/i, 'Payment term templates'],
  [/\bMatch Tolerances?\b/i, 'Invoice matching rules'],
  [/\bBalance Sheet\b/i, 'What we own & owe'],
  [/\bIncome Statement\b/i, 'Revenue & expenses'],
  [/\bCash Flow\b/i, 'Cash in & out'],
  [/\bRecent Activity\b/i, 'What happened recently'],
  [/\bDiscount Savings\b/i, 'Discounts captured'],
  [/\bTotal Users?\b/i, 'Total users'],
  [/\bComing Soon\b/i, 'Coming soon'],
];

/** Abbreviation → expansion (applied after jargon check). */
const ABBREVIATION_MAP: Record<string, string> = {
  AP: 'Payables',
  AR: 'Receivables',
  GL: 'Ledger',
  IC: 'Intercompany',
  WHT: 'Withholding Tax',
  DSO: 'Days to Collect',
  TP: 'Transfer Pricing',
  IFRS: 'Intl. Reporting Standards',
};

/** Parenthesized suffixes → plain form. */
const SUFFIX_PATTERNS: [RegExp, string][] = [
  [/\(MTD\)/gi, 'this month'],
  [/\(QTD\)/gi, 'this quarter'],
  [/\(YTD\)/gi, 'this year'],
  [/\(30d\)/gi, '(30 days)'],
];

/**
 * Convert a KPI title to plain language algorithmically.
 *
 * Pipeline (all three stages run in order):
 *  1. Suffix cleanup — e.g. "(MTD)" → "this month"
 *  2. Jargon phrase match — first matching phrase wins
 *  3. Abbreviation expansion — expand standalone uppercase abbreviations
 * Fallbacks:
 *  4. Description (truncated to ~40 chars)
 *  5. Original title (unchanged)
 */
export function toPlainTitle(title: string, description?: string): string {
  let result = title;
  let matched = false;

  // 1. Suffix cleanup (e.g. "(MTD)" → "this month", "(30d)" → "(30 days)")
  for (const [pattern, replacement] of SUFFIX_PATTERNS) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (result !== before) matched = true;
  }

  // 2. Jargon phrase match — first hit wins, then stop checking jargon
  for (const [pattern, replacement] of JARGON_MAP) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement);
      matched = true;
      break; // one jargon phrase is enough; avoid chaining replacements
    }
  }

  // 3. Abbreviation expansion (always runs — a title can have both a suffix and an abbreviation)
  for (const [abbr, expansion] of Object.entries(ABBREVIATION_MAP)) {
    const re = new RegExp(`\\b${abbr}\\b`, 'g');
    if (re.test(result)) {
      re.lastIndex = 0;
      result = result.replace(re, expansion);
      matched = true;
    }
  }

  if (matched) {
    return cleanUp(result);
  }

  // 4. Fall back to description (truncated)
  if (description) {
    return truncateDescription(description);
  }

  // 5. Return original title
  return title;
}

/** Clean up whitespace and capitalize first letter. */
function cleanUp(s: string): string {
  const trimmed = s.replace(/\s+/g, ' ').trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Truncate description to a short phrase suitable for a card title. */
function truncateDescription(desc: string): string {
  // Take content before the first comma, semicolon, or period
  const clause = desc.split(/[,;.]/)[0]?.trim() ?? desc.trim();
  if (clause.length <= 40) return clause;
  // Truncate at last space before 40 chars
  const truncated = clause
    .slice(0, 40)
    .replace(/\s\S*$/, '')
    .trim();
  return truncated || clause.slice(0, 40);
}
