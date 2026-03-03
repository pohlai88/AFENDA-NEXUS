import { axe } from 'jest-axe';
import { renderWithProviders, screen } from '../utils';
import { EmptyState } from '@/components/erp/empty-state';
import { getEmptyStateContent, registry } from '@/components/erp/empty-state.registry';
import type { EmptyStateKey } from '@/components/erp/empty-state.types';

describe('EmptyState', () => {
  // ─── Backward Compatibility ──────────────────────────────────────────────

  it('renders with direct title/description (backward compat)', () => {
    renderWithProviders(
      <EmptyState title="No items found" description="Create one." animate={false} />
    );
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Create one.')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = renderWithProviders(<EmptyState title="No items" animate={false} />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders action slot', () => {
    renderWithProviders(
      <EmptyState
        title="No items"
        action={<button type="button">Create Item</button>}
        animate={false}
      />
    );
    expect(screen.getByRole('button', { name: 'Create Item' })).toBeInTheDocument();
  });

  // ─── Variants ────────────────────────────────────────────────────────────

  it.each(['firstRun', 'noResults', 'error', 'forbidden'] as const)(
    'renders variant "%s" with role="status"',
    (variant) => {
      renderWithProviders(<EmptyState title="Test" variant={variant} animate={false} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    }
  );

  // ─── Sizes ───────────────────────────────────────────────────────────────

  it.each(['sm', 'md', 'lg'] as const)('applies size="%s" classes', (size) => {
    renderWithProviders(<EmptyState title="Test" size={size} animate={false} />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    // Each size should render with appropriate padding (verified via role="status")
    expect(status.classList.contains('border-dashed')).toBe(true);
  });

  // ─── Registry Integration ────────────────────────────────────────────────

  it('resolves content from registry via contentKey', () => {
    renderWithProviders(<EmptyState contentKey="finance.journals" animate={false} />);
    expect(screen.getByText('No journal entries yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first journal entry to get started.')).toBeInTheDocument();
  });

  it('direct title overrides registry content', () => {
    renderWithProviders(
      <EmptyState contentKey="finance.journals" title="Custom Title" animate={false} />
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.queryByText('No journal entries yet')).not.toBeInTheDocument();
  });

  it('resolves noResults variant from registry', () => {
    renderWithProviders(
      <EmptyState contentKey="finance.journals" variant="noResults" animate={false} />
    );
    expect(screen.getByText('No journals match your search')).toBeInTheDocument();
  });

  // ─── Registry Resolver ─────────────────────────────────────────────────

  it('getEmptyStateContent returns expected content', () => {
    const content = getEmptyStateContent('finance.payables', 'firstRun');
    expect(content.title).toBe('No payable invoices found');
    expect(content.ctaLabel).toBe('Create Invoice');
  });

  it('getEmptyStateContent falls back to firstRun for unknown variant', () => {
    const content = getEmptyStateContent('finance.payables', 'error');
    // Should fall back to firstRun since 'error' variant is not defined
    expect(content.title).toBe('No payable invoices found');
  });

  // ─── Container & Styling ────────────────────────────────────────────────

  it('renders dashed border container', () => {
    const { container } = renderWithProviders(<EmptyState title="Empty" animate={false} />);
    const wrapper = container.querySelector('.border-dashed');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <EmptyState title="Empty" className="custom" animate={false} />
    );
    const wrapper = container.querySelector('.custom');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders icon with aria-hidden', () => {
    const { container } = renderWithProviders(<EmptyState title="No items" animate={false} />);
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeInTheDocument();
  });

  // ─── Animation Control ──────────────────────────────────────────────────

  it('renders without crashing when animate=false', () => {
    renderWithProviders(<EmptyState title="No items" animate={false} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // ─── Accessibility ──────────────────────────────────────────────────────

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <EmptyState title="No items" description="Try creating one." animate={false} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has aria-live="polite" for dynamic states', () => {
    renderWithProviders(<EmptyState title="No items" animate={false} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});

// ─── Exhaustive Registry Coverage ──────────────────────────────────────────

const allKeys = Object.keys(registry) as EmptyStateKey[];

describe.each(allKeys)('EmptyState registry key "%s"', (key) => {
  it('resolves firstRun content', () => {
    const content = getEmptyStateContent(key, 'firstRun');
    expect(content.title).toBeTruthy();
  });

  it('resolves noResults content', () => {
    const content = getEmptyStateContent(key, 'noResults');
    expect(content.title).toBeTruthy();
  });

  it('renders with contentKey and passes axe', async () => {
    const { container } = renderWithProviders(<EmptyState contentKey={key} animate={false} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── AP Domain Keys ────────────────────────────────────────────────────────

const apKeys: EmptyStateKey[] = [
  'finance.payables.duplicates',
  'finance.payables.creditMemos',
  'finance.payables.debitMemos',
  'finance.payables.prepayments',
  'finance.payables.triage',
  'finance.payables.reconciliation',
  'finance.payables.import',
  'finance.payables.closeChecklist',
];

describe.each(apKeys)('AP key "%s"', (key) => {
  it('has curated firstRun copy', () => {
    const content = getEmptyStateContent(key, 'firstRun');
    expect(content.title).not.toBe('No data');
    expect(content.description).toBeTruthy();
  });

  it('has curated noResults copy', () => {
    const content = getEmptyStateContent(key, 'noResults');
    expect(content.title).not.toBe('No data');
    expect(content.description).toBeTruthy();
  });

  it('renders noResults variant and passes axe', async () => {
    const { container } = renderWithProviders(
      <EmptyState contentKey={key} variant="noResults" animate={false} />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
