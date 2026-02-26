import { axe } from 'jest-axe';
import { renderWithProviders, screen, within } from '../utils';
import { AuditPanel } from '@/components/erp/audit-panel';
import type { AuditEntry } from '@/lib/types';

const entries: AuditEntry[] = [
  {
    id: 'ae-1',
    action: 'CREATED',
    userId: 'u-001',
    userName: 'Jane Doe',
    timestamp: new Date(Date.now() - 60_000 * 5).toISOString(), // 5m ago
    details: 'Draft journal entry created',
    correlationId: 'corr-abcd1234',
  },
  {
    id: 'ae-2',
    action: 'POSTED',
    userId: 'u-002',
    timestamp: new Date(Date.now() - 60_000 * 2).toISOString(), // 2m ago
  },
];

describe('AuditPanel', () => {
  it('renders empty message when no entries', () => {
    renderWithProviders(<AuditPanel entries={[]} />);
    expect(screen.getByText('No audit history available.')).toBeInTheDocument();
  });

  it('renders audit trail heading', () => {
    renderWithProviders(<AuditPanel entries={entries} />);
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
  });

  it('renders ordered list with aria-label', () => {
    renderWithProviders(<AuditPanel entries={entries} />);
    const list = screen.getByRole('list', { name: /audit history/i });
    expect(list).toBeInTheDocument();
    expect(list.tagName).toBe('OL');
  });

  it('renders all entry actions', () => {
    renderWithProviders(<AuditPanel entries={entries} />);
    expect(screen.getByText('CREATED')).toBeInTheDocument();
    expect(screen.getByText('POSTED')).toBeInTheDocument();
  });

  it('displays userName when available, userId otherwise', () => {
    renderWithProviders(<AuditPanel entries={entries} />);
    // First entry has userName
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    // Second entry has only userId
    expect(screen.getByText('u-002')).toBeInTheDocument();
  });

  it('displays entry details when present', () => {
    renderWithProviders(<AuditPanel entries={entries} />);
    expect(screen.getByText('Draft journal entry created')).toBeInTheDocument();
  });

  it('displays truncated correlation ID', () => {
    renderWithProviders(<AuditPanel entries={entries} />);
    // 'corr-abcd1234'.slice(0, 8) → 'corr-abc'
    expect(screen.getByText('corr-abc')).toBeInTheDocument();
  });

  it('renders time elements with relative time', () => {
    renderWithProviders(<AuditPanel entries={entries} />);
    const timeElements = screen.getAllByRole('time');
    expect(timeElements.length).toBe(2);
    // 5m ago
    expect(timeElements[0].textContent).toContain('5m ago');
    // 2m ago
    expect(timeElements[1].textContent).toContain('2m ago');
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <AuditPanel entries={entries} className="test-class" />
    );
    const el = container.querySelector('.test-class');
    expect(el).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<AuditPanel entries={entries} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
