import { axe } from 'jest-axe';
import { renderWithProviders, screen, userEvent } from '../utils';
import { PostingPreview, type PostingPreviewData } from '@/components/erp/posting-preview';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const balancedData: PostingPreviewData = {
  ledgerName: 'General Ledger',
  periodName: '2025 P1',
  currency: 'USD',
  lines: [
    { accountCode: '5010', accountName: 'Depreciation Expense', debit: 1200, credit: 0 },
    { accountCode: '1500', accountName: 'Accumulated Depreciation', debit: 0, credit: 1200 },
  ],
};

const unbalancedData: PostingPreviewData = {
  ledgerName: 'AP Ledger',
  periodName: '2025 P2',
  currency: 'EUR',
  lines: [
    { accountCode: '2000', accountName: 'Payables', debit: 1000, credit: 0 },
    { accountCode: '5100', accountName: 'Expense', debit: 0, credit: 999 },
  ],
};

const dataWithWarnings: PostingPreviewData = {
  ...balancedData,
  warnings: ['Period is about to close', 'Large balance detected'],
};

const multiLineData: PostingPreviewData = {
  ledgerName: 'IC Ledger',
  periodName: '2025 P3',
  currency: 'GBP',
  lines: [
    { accountCode: '1100', accountName: 'Cash', debit: 500, credit: 0, description: 'Transfer out', costCenter: 'CC-01' },
    { accountCode: '2100', accountName: 'IC Receivable', debit: 300, credit: 0, description: 'Mirror entry' },
    { accountCode: '4000', accountName: 'Revenue', debit: 0, credit: 800, costCenter: 'CC-02' },
  ],
};

const confirmFn = vi.fn(async () => {});

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('PostingPreview', () => {
  beforeEach(() => {
    confirmFn.mockClear();
  });

  it('renders ledger name, period, and currency badges', () => {
    renderWithProviders(<PostingPreview data={balancedData} onConfirm={confirmFn} />);
    expect(screen.getByText('General Ledger')).toBeInTheDocument();
    expect(screen.getByText('2025 P1')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('renders all journal lines with account code and name', () => {
    renderWithProviders(<PostingPreview data={balancedData} onConfirm={confirmFn} />);
    expect(screen.getByText('5010')).toBeInTheDocument();
    expect(screen.getByText('Depreciation Expense')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('Accumulated Depreciation')).toBeInTheDocument();
  });

  it('shows total line count', () => {
    renderWithProviders(<PostingPreview data={balancedData} onConfirm={confirmFn} />);
    expect(screen.getByText(/Total \(2 lines\)/)).toBeInTheDocument();
  });

  it('shows balanced indicator (checkmark) when debits equal credits', () => {
    const { container } = renderWithProviders(
      <PostingPreview data={balancedData} onConfirm={confirmFn} />,
    );
    // CheckCircle icon with class text-success
    const checkIcon = container.querySelector('.text-success');
    expect(checkIcon).toBeInTheDocument();
  });

  it('shows out-of-balance alert when debits ≠ credits', () => {
    renderWithProviders(<PostingPreview data={unbalancedData} onConfirm={confirmFn} />);
    const alert = screen.getByText(/out of balance/i);
    expect(alert).toBeInTheDocument();
  });

  it('disables confirm button when journal is out of balance', () => {
    renderWithProviders(<PostingPreview data={unbalancedData} onConfirm={confirmFn} />);
    const btn = screen.getByRole('button', { name: /post to ledger/i });
    expect(btn).toBeDisabled();
  });

  it('enables confirm button when journal is balanced', () => {
    renderWithProviders(<PostingPreview data={balancedData} onConfirm={confirmFn} />);
    const btn = screen.getByRole('button', { name: /post to ledger/i });
    expect(btn).toBeEnabled();
  });

  // ─── Warnings ───────────────────────────────────────────────────────

  it('renders warning alerts', () => {
    renderWithProviders(<PostingPreview data={dataWithWarnings} onConfirm={confirmFn} />);
    expect(screen.getByText('Period is about to close')).toBeInTheDocument();
    expect(screen.getByText('Large balance detected')).toBeInTheDocument();
  });

  it('renders warnings with role="alert" for accessibility', () => {
    renderWithProviders(<PostingPreview data={dataWithWarnings} onConfirm={confirmFn} />);
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(2);
  });

  // ─── Compact Mode ─────────────────────────────────────────────────

  it('hides description and cost center columns in compact mode', () => {
    renderWithProviders(
      <PostingPreview data={multiLineData} onConfirm={confirmFn} compact />,
    );
    // In compact, the Description column header should not be visible
    expect(screen.queryByText('Description')).not.toBeInTheDocument();
    expect(screen.queryByText('Cost Center')).not.toBeInTheDocument();
  });

  it('shows description and cost center columns in default mode', () => {
    renderWithProviders(
      <PostingPreview data={multiLineData} onConfirm={confirmFn} />,
    );
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Cost Center')).toBeInTheDocument();
  });

  // ─── Custom Props ─────────────────────────────────────────────────

  it('renders custom title and description', () => {
    renderWithProviders(
      <PostingPreview
        data={balancedData}
        onConfirm={confirmFn}
        title="Depreciation Posting Preview"
        description="Review depreciation entries before posting."
      />,
    );
    expect(screen.getByText('Depreciation Posting Preview')).toBeInTheDocument();
    expect(screen.getByText('Review depreciation entries before posting.')).toBeInTheDocument();
  });

  it('renders custom confirm label', () => {
    renderWithProviders(
      <PostingPreview
        data={balancedData}
        onConfirm={confirmFn}
        confirmLabel="Execute Allocation"
      />,
    );
    expect(screen.getByRole('button', { name: 'Execute Allocation' })).toBeInTheDocument();
  });

  // ─── Confirm Dialog ───────────────────────────────────────────────

  it('opens confirmation dialog on confirm click', async () => {
    const { user } = renderWithProviders(
      <PostingPreview data={balancedData} onConfirm={confirmFn} />,
    );
    await user.click(screen.getByRole('button', { name: /post to ledger/i }));
    expect(screen.getByText('Confirm Posting')).toBeInTheDocument();
    expect(screen.getByText(/You are about to post 2 journal lines/)).toBeInTheDocument();
  });

  it('calls onConfirm when dialog confirmed', async () => {
    const { user } = renderWithProviders(
      <PostingPreview data={balancedData} onConfirm={confirmFn} />,
    );
    await user.click(screen.getByRole('button', { name: /post to ledger/i }));
    // The confirm button inside AlertDialog
    const confirmBtns = screen.getAllByRole('button', { name: /post to ledger/i });
    await user.click(confirmBtns[confirmBtns.length - 1]);
    expect(confirmFn).toHaveBeenCalledTimes(1);
  });

  it('renders footer text indicating line count and ledger name', () => {
    renderWithProviders(<PostingPreview data={balancedData} onConfirm={confirmFn} />);
    expect(
      screen.getByText(/Will post 2 lines to ledger "General Ledger"/),
    ).toBeInTheDocument();
  });

  it('uses singular "line" for single-line posting', () => {
    const single: PostingPreviewData = {
      ...balancedData,
      lines: [{ accountCode: '1000', accountName: 'Cash', debit: 100, credit: 100 }],
    };
    renderWithProviders(<PostingPreview data={single} onConfirm={confirmFn} />);
    expect(screen.getByText(/Will post 1 line to ledger/)).toBeInTheDocument();
  });

  // ─── Table Structure ──────────────────────────────────────────────

  it('renders table with caption for screen readers', () => {
    const { container } = renderWithProviders(
      <PostingPreview data={balancedData} onConfirm={confirmFn} />,
    );
    const caption = container.querySelector('caption');
    expect(caption).toBeInTheDocument();
    expect(caption?.textContent).toBe('Posting preview lines');
  });

  it('renders debit/credit header columns', () => {
    renderWithProviders(<PostingPreview data={balancedData} onConfirm={confirmFn} />);
    expect(screen.getByText('Debit')).toBeInTheDocument();
    expect(screen.getByText('Credit')).toBeInTheDocument();
  });

  // ─── Accessibility ────────────────────────────────────────────────

  it('has no accessibility violations (balanced)', async () => {
    const { container } = renderWithProviders(
      <PostingPreview data={balancedData} onConfirm={confirmFn} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations (with warnings)', async () => {
    const { container } = renderWithProviders(
      <PostingPreview data={dataWithWarnings} onConfirm={confirmFn} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
