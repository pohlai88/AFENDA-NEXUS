import { axe } from 'jest-axe';
import { renderWithProviders, screen } from '../utils';
import { ReceiptPanel } from '@/components/erp/receipt-panel';
import type { CommandReceipt } from '@/lib/types';

const mockReceipt: CommandReceipt = {
  commandId: 'cmd-001',
  idempotencyKey: 'idem-1234-5678-9abc-def0',
  resultRef: 'JE-2024-0001',
  completedAt: '2024-06-15T10:30:00Z',
  auditRef: 'audit-001',
};

const defaultProps = {
  receipt: mockReceipt,
  title: 'Journal Created',
  onClose: vi.fn(),
};

describe('ReceiptPanel', () => {
  it('renders with role="status" and aria-live', () => {
    renderWithProviders(<ReceiptPanel {...defaultProps} />);
    const panel = screen.getByRole('status');
    expect(panel).toHaveAttribute('aria-live', 'polite');
  });

  it('displays receipt title', () => {
    renderWithProviders(<ReceiptPanel {...defaultProps} />);
    expect(screen.getByText('Journal Created')).toBeInTheDocument();
  });

  it('displays document ref', () => {
    renderWithProviders(<ReceiptPanel {...defaultProps} />);
    expect(screen.getByText('JE-2024-0001')).toBeInTheDocument();
  });

  it('displays audit ref when present', () => {
    renderWithProviders(<ReceiptPanel {...defaultProps} />);
    expect(screen.getByText('audit-001')).toBeInTheDocument();
  });

  it('hides audit ref when not present', () => {
    const receiptWithoutAudit = { ...mockReceipt, auditRef: undefined };
    renderWithProviders(<ReceiptPanel {...defaultProps} receipt={receiptWithoutAudit} />);
    expect(screen.queryByText('Audit ref')).not.toBeInTheDocument();
  });

  it('displays truncated idempotency key', () => {
    renderWithProviders(<ReceiptPanel {...defaultProps} />);
    // truncateId('idem-1234-5678-9abc-def0', 8) → 'idem-123…'
    expect(screen.getByText('idem-123…')).toBeInTheDocument();
  });

  it('renders dismiss button with aria-label', () => {
    renderWithProviders(<ReceiptPanel {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /dismiss receipt/i });
    expect(btn).toBeInTheDocument();
  });

  it('calls onClose when dismiss is clicked', async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(<ReceiptPanel {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /dismiss receipt/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders View Document link when viewHref is provided', () => {
    renderWithProviders(<ReceiptPanel {...defaultProps} viewHref="/journals/JE-001" />);
    const link = screen.getByRole('link', { name: /view document/i });
    expect(link).toHaveAttribute('href', '/journals/JE-001');
  });

  it('renders Back to List link when backHref is provided', () => {
    renderWithProviders(<ReceiptPanel {...defaultProps} backHref="/journals" />);
    const link = screen.getByRole('link', { name: /back to list/i });
    expect(link).toHaveAttribute('href', '/journals');
  });

  it('does not render links when hrefs are not provided', () => {
    renderWithProviders(<ReceiptPanel {...defaultProps} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <ReceiptPanel {...defaultProps} viewHref="/journals/JE-001" backHref="/journals" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
