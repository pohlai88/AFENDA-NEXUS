/**
 * Report Export Engine — Enterprise-grade report serialization.
 *
 * Supports CSV and JSON export for all financial reports.
 * PDF is handled via browser `window.print()` with `@media print` styles
 * already defined in `globals.css`.
 *
 * Design decisions (enterprise best practice):
 * - **CSV**: RFC 4180 compliant, proper quoting, BOM prefix for Excel compat.
 * - **JSON**: Pretty-printed with report metadata (title, date, company).
 * - **No XLSX dep**: Avoids 500KB+ client bundle; CSV opens natively in Excel.
 * - **No PDF dep**: Browser print produces audit-quality output with print CSS.
 * - **Server-side only**: Runs in Server Actions, never ships to client bundle.
 *
 * @module report-export
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExportColumn {
  /** Machine key used to extract the value from a row object. */
  key: string;
  /** Human-readable header label. */
  header: string;
  /** Optional alignment hint (for future XLSX support). */
  align?: 'left' | 'right';
}

export interface ExportSection {
  /** Section heading (e.g., "Assets", "Revenue"). */
  title: string;
  /** Column definitions for this section. */
  columns: ExportColumn[];
  /** Data rows. Each row is a Record<key, displayValue>. */
  rows: Record<string, string | number>[];
  /** Optional footer row (e.g., totals). */
  footer?: Record<string, string | number>;
}

export interface ExportPayload {
  /** Report title (e.g., "Balance Sheet"). */
  title: string;
  /** Report subtitle or date context (e.g., "As of Dec 31, 2025"). */
  subtitle?: string;
  /** Company name for the report header. */
  companyName?: string;
  /** ISO timestamp when the export was generated. */
  generatedAt: string;
  /** One or more sections of tabular data. */
  sections: ExportSection[];
  /** Currency code for monetary values. */
  currency?: string;
}

// ─── CSV Export (RFC 4180) ───────────────────────────────────────────────────

/**
 * Escape a cell value for CSV.
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 */
function csvEscape(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serialize an `ExportPayload` to RFC 4180 CSV with UTF-8 BOM.
 *
 * The BOM prefix (`\uFEFF`) ensures Excel opens the file in UTF-8 mode
 * rather than defaulting to ANSI/Latin-1 on Windows.
 *
 * Multi-section reports are separated by a blank line and section header.
 */
export function toCSV(payload: ExportPayload): string {
  const lines: string[] = [];

  // ── Report header metadata ──
  lines.push(csvEscape(payload.title));
  if (payload.subtitle) lines.push(csvEscape(payload.subtitle));
  if (payload.companyName) lines.push(`Company:,${csvEscape(payload.companyName)}`);
  lines.push(`Generated:,${csvEscape(payload.generatedAt)}`);
  if (payload.currency) lines.push(`Currency:,${csvEscape(payload.currency)}`);
  lines.push(''); // blank line before data

  for (const section of payload.sections) {
    // Section header
    if (payload.sections.length > 1) {
      lines.push(csvEscape(section.title));
    }

    // Column headers
    lines.push(section.columns.map((c) => csvEscape(c.header)).join(','));

    // Data rows
    for (const row of section.rows) {
      lines.push(section.columns.map((c) => csvEscape(row[c.key])).join(','));
    }

    // Footer row (totals)
    if (section.footer) {
      lines.push(section.columns.map((c) => csvEscape(section.footer![c.key])).join(','));
    }

    lines.push(''); // blank line between sections
  }

  // UTF-8 BOM + content
  return '\uFEFF' + lines.join('\r\n');
}

// ─── JSON Export ────────────────────────────────────────────────────────────

/**
 * Serialize an `ExportPayload` to pretty-printed JSON with metadata.
 */
export function toJSON(payload: ExportPayload): string {
  return JSON.stringify(
    {
      meta: {
        title: payload.title,
        subtitle: payload.subtitle,
        companyName: payload.companyName,
        generatedAt: payload.generatedAt,
        currency: payload.currency,
        format: 'afenda-report-v1',
      },
      sections: payload.sections.map((s) => ({
        title: s.title,
        columns: s.columns.map((c) => ({ key: c.key, header: c.header })),
        rows: s.rows,
        totals: s.footer ?? null,
      })),
    },
    null,
    2
  );
}

// ─── Filename Generator ─────────────────────────────────────────────────────

/**
 * Generate a filesystem-safe filename for the export.
 *
 * @example
 * exportFilename('Balance Sheet', 'csv') // => "balance-sheet_2026-02-25.csv"
 */
export function exportFilename(title: string, extension: 'csv' | 'json'): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const date = new Date().toISOString().slice(0, 10);
  return `${slug}_${date}.${extension}`;
}
