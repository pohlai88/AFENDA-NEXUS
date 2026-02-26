import { describe, it, expect } from 'vitest';
import { toCSV, toJSON, exportFilename, type ExportPayload } from '@/lib/report-export';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const singleSectionPayload: ExportPayload = {
  title: 'Trial Balance',
  subtitle: 'As of Dec 31, 2025',
  generatedAt: '2025-12-31T00:00:00.000Z',
  sections: [
    {
      title: 'Trial Balance',
      columns: [
        { key: 'code', header: 'Code', align: 'left' },
        { key: 'name', header: 'Account', align: 'left' },
        { key: 'debit', header: 'Debit', align: 'right' },
        { key: 'credit', header: 'Credit', align: 'right' },
      ],
      rows: [
        { code: '1000', name: 'Cash', debit: '50000', credit: '0' },
        { code: '2000', name: 'Accounts Payable', debit: '0', credit: '50000' },
      ],
      footer: { code: '', name: 'Totals', debit: '50000', credit: '50000' },
    },
  ],
};

const multiSectionPayload: ExportPayload = {
  title: 'Balance Sheet',
  subtitle: 'As of Dec 31, 2025',
  generatedAt: '2025-12-31T00:00:00.000Z',
  currency: 'USD',
  sections: [
    {
      title: 'Assets',
      columns: [
        { key: 'name', header: 'Account', align: 'left' },
        { key: 'balance', header: 'Balance', align: 'right' },
      ],
      rows: [{ name: 'Cash', balance: '100000' }],
      footer: { name: 'Total Assets', balance: '100000' },
    },
    {
      title: 'Liabilities',
      columns: [
        { key: 'name', header: 'Account', align: 'left' },
        { key: 'balance', header: 'Balance', align: 'right' },
      ],
      rows: [{ name: 'Loans', balance: '60000' }],
      footer: { name: 'Total Liabilities', balance: '60000' },
    },
  ],
};

// ─── toCSV ──────────────────────────────────────────────────────────────────

describe('toCSV', () => {
  it('starts with UTF-8 BOM for Excel compatibility', () => {
    const csv = toCSV(singleSectionPayload);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('includes report title and subtitle in header', () => {
    const csv = toCSV(singleSectionPayload);
    expect(csv).toContain('Trial Balance');
    expect(csv).toContain('As of Dec 31, 2025');
  });

  it('renders column headers as CSV row', () => {
    const csv = toCSV(singleSectionPayload);
    expect(csv).toContain('Code,Account,Debit,Credit');
  });

  it('renders data rows', () => {
    const csv = toCSV(singleSectionPayload);
    expect(csv).toContain('1000,Cash,50000,0');
    expect(csv).toContain('2000,Accounts Payable,0,50000');
  });

  it('renders footer row (totals)', () => {
    const csv = toCSV(singleSectionPayload);
    expect(csv).toContain(',Totals,50000,50000');
  });

  it('uses CRLF line endings per RFC 4180', () => {
    const csv = toCSV(singleSectionPayload);
    // Remove BOM for cleaner check
    const body = csv.slice(1);
    const lines = body.split('\r\n');
    expect(lines.length).toBeGreaterThan(1);
    // Should not contain bare \n (without preceding \r)
    expect(body.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('escapes values with commas in double quotes', () => {
    const payload: ExportPayload = {
      title: 'Test',
      generatedAt: '2025-01-01T00:00:00.000Z',
      sections: [
        {
          title: 'Data',
          columns: [{ key: 'val', header: 'Value' }],
          rows: [{ val: 'hello, world' }],
        },
      ],
    };
    const csv = toCSV(payload);
    expect(csv).toContain('"hello, world"');
  });

  it('escapes values with double quotes by doubling them', () => {
    const payload: ExportPayload = {
      title: 'Test',
      generatedAt: '2025-01-01T00:00:00.000Z',
      sections: [
        {
          title: 'Data',
          columns: [{ key: 'val', header: 'Value' }],
          rows: [{ val: 'say "hello"' }],
        },
      ],
    };
    const csv = toCSV(payload);
    expect(csv).toContain('"say ""hello"""');
  });

  it('renders section titles in multi-section reports', () => {
    const csv = toCSV(multiSectionPayload);
    expect(csv).toContain('Assets');
    expect(csv).toContain('Liabilities');
  });

  it('includes currency when provided', () => {
    const csv = toCSV(multiSectionPayload);
    expect(csv).toContain('Currency:,USD');
  });
});

// ─── toJSON ─────────────────────────────────────────────────────────────────

describe('toJSON', () => {
  it('produces valid JSON', () => {
    const json = toJSON(singleSectionPayload);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('includes afenda-report-v1 format in meta', () => {
    const parsed = JSON.parse(toJSON(singleSectionPayload));
    expect(parsed.meta.format).toBe('afenda-report-v1');
  });

  it('includes report title and generatedAt in meta', () => {
    const parsed = JSON.parse(toJSON(singleSectionPayload));
    expect(parsed.meta.title).toBe('Trial Balance');
    expect(parsed.meta.generatedAt).toBe('2025-12-31T00:00:00.000Z');
  });

  it('maps sections with columns, rows, and totals', () => {
    const parsed = JSON.parse(toJSON(singleSectionPayload));
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0].title).toBe('Trial Balance');
    expect(parsed.sections[0].rows).toHaveLength(2);
    expect(parsed.sections[0].totals).toEqual({
      code: '',
      name: 'Totals',
      debit: '50000',
      credit: '50000',
    });
  });

  it('sets totals to null when no footer', () => {
    const payload: ExportPayload = {
      title: 'No Footer',
      generatedAt: '2025-01-01T00:00:00.000Z',
      sections: [
        {
          title: 'Data',
          columns: [{ key: 'val', header: 'Value' }],
          rows: [{ val: 'x' }],
        },
      ],
    };
    const parsed = JSON.parse(toJSON(payload));
    expect(parsed.sections[0].totals).toBeNull();
  });

  it('is pretty-printed (indented)', () => {
    const json = toJSON(singleSectionPayload);
    expect(json).toContain('\n  ');
  });
});

// ─── exportFilename ─────────────────────────────────────────────────────────

describe('exportFilename', () => {
  it('generates slug from title with date suffix', () => {
    const filename = exportFilename('Balance Sheet', 'csv');
    expect(filename).toMatch(/^balance-sheet_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('handles json extension', () => {
    const filename = exportFilename('Trial Balance', 'json');
    expect(filename).toMatch(/\.json$/);
  });

  it('strips special characters from title', () => {
    const filename = exportFilename('IC Aging (90+ Days)', 'csv');
    expect(filename).not.toMatch(/[()+ ]/);
    expect(filename).toMatch(/^ic-aging-90-days_/);
  });

  it('trims leading/trailing hyphens', () => {
    const filename = exportFilename('---Test---', 'csv');
    expect(filename).toMatch(/^test_/);
  });
});
