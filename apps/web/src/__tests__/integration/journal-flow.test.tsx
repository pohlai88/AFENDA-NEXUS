/**
 * Integration test: Journal creation flow
 * Tests the JournalDraftForm → ReceiptPanel transition using MSW.
 */
import { renderWithProviders, screen, waitFor } from '../utils';
import { JournalDraftForm } from '@/features/finance/journals/forms/journal-draft-form';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock crypto.randomUUID with incrementing values
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  ...globalThis.crypto,
  randomUUID: () => `00000000-0000-0000-0000-${String(++uuidCounter).padStart(12, '0')}`,
});

const COMPANY_ID = '10000000-0000-0000-0000-000000000001';
const LEDGER_ID = '20000000-0000-0000-0000-000000000001';

const mockReceipt: CommandReceipt = {
  commandId: 'cmd-001',
  idempotencyKey: 'idem-key-001',
  resultRef: 'JE-2024-0001',
  completedAt: '2024-06-15T10:30:00Z',
  auditRef: 'audit-ref-001',
};

describe('JournalDraftForm', () => {
  it('renders the form with required fields', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <JournalDraftForm
        onSubmit={onSubmit}
        defaultCompanyId={COMPANY_ID}
        defaultLedgerId={LEDGER_ID}
      />
    );

    expect(document.getElementById('description')).toBeInTheDocument();
    expect(screen.getByLabelText(/posting date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create draft/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows error when debits do not equal credits', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <JournalDraftForm
        onSubmit={onSubmit}
        defaultCompanyId={COMPANY_ID}
        defaultLedgerId={LEDGER_ID}
      />
    );

    // Fill description — use the ID to avoid matching line description labels
    const descInput = document.getElementById('description') as HTMLInputElement;
    await user.type(descInput, 'Test journal');

    // Fill line 1: debit 100
    const debitInputs = screen.getAllByLabelText(/debit/i);
    await user.clear(debitInputs[0]!);
    await user.type(debitInputs[0]!, '100');

    // Fill line 1 account code
    const accountInputs = screen.getAllByLabelText(/account code/i);
    await user.type(accountInputs[0]!, '1000');
    await user.type(accountInputs[1]!, '2000');

    // Leave credit at 0 — unbalanced
    await user.click(screen.getByRole('button', { name: /create draft/i }));

    // The form should show a balance error via validation or the handleSubmit check
    await waitFor(() => {
      const alerts = screen.queryAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('shows receipt panel on successful submission', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      ok: true,
      value: mockReceipt,
    } as ApiResult<CommandReceipt>);

    const { user } = renderWithProviders(
      <JournalDraftForm
        onSubmit={onSubmit}
        defaultCompanyId={COMPANY_ID}
        defaultLedgerId={LEDGER_ID}
      />
    );

    // Fill required fields — use ID to avoid matching line description labels
    const descInput = document.getElementById('description') as HTMLInputElement;
    await user.type(descInput, 'Test journal');

    const accountInputs = screen.getAllByLabelText(/account code/i);
    await user.type(accountInputs[0]!, '1000');
    await user.type(accountInputs[1]!, '2000');

    const debitInputs = screen.getAllByLabelText(/debit/i);
    await user.clear(debitInputs[0]!);
    await user.type(debitInputs[0]!, '100');

    const creditInputs = screen.getAllByLabelText(/credit/i);
    await user.clear(creditInputs[1]!);
    await user.type(creditInputs[1]!, '100');

    await user.click(screen.getByRole('button', { name: /create draft/i }));

    // After successful submission, receipt panel should appear
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    expect(screen.getByText('Journal Created Successfully')).toBeInTheDocument();
    expect(screen.getByText('JE-2024-0001')).toBeInTheDocument();
  });

  it('shows error message on failed submission', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Period is closed',
        statusCode: 422,
      },
    } as ApiResult<CommandReceipt>);

    const { user } = renderWithProviders(
      <JournalDraftForm
        onSubmit={onSubmit}
        defaultCompanyId={COMPANY_ID}
        defaultLedgerId={LEDGER_ID}
      />
    );

    const descInput3 = document.getElementById('description') as HTMLInputElement;
    await user.type(descInput3, 'Test journal');

    const accountInputs = screen.getAllByLabelText(/account code/i);
    await user.type(accountInputs[0]!, '1000');
    await user.type(accountInputs[1]!, '2000');

    const debitInputs = screen.getAllByLabelText(/debit/i);
    await user.clear(debitInputs[0]!);
    await user.type(debitInputs[0]!, '100');

    const creditInputs = screen.getAllByLabelText(/credit/i);
    await user.clear(creditInputs[1]!);
    await user.type(creditInputs[1]!, '100');

    await user.click(screen.getByRole('button', { name: /create draft/i }));

    await waitFor(() => {
      expect(screen.getByText('Period is closed')).toBeInTheDocument();
    });
  });

  it('cancel link navigates to journals list', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <JournalDraftForm
        onSubmit={onSubmit}
        defaultCompanyId={COMPANY_ID}
        defaultLedgerId={LEDGER_ID}
      />
    );

    const cancelLink = screen.getByRole('link', { name: /cancel/i });
    expect(cancelLink).toHaveAttribute('href', '/finance/journals');
  });
});
