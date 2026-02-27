import { axe } from 'jest-axe';
import { renderWithProviders, screen } from '../utils';
import {
  LoadingSkeleton,
  TableSkeleton,
  DetailSkeleton,
  FormSkeleton,
  ReportSkeleton,
  StatementSkeleton,
  DashboardSkeleton,
  CardsSkeleton,
  SettingsSkeleton,
  TabbedTableSkeleton,
  ApprovalSkeleton,
  SplitPaneSkeleton,
} from '@/components/erp/loading-skeleton';

const ALL_VARIANTS = [
  'table',
  'detail',
  'form',
  'report',
  'statement',
  'dashboard',
  'cards',
  'settings',
  'tabbed-table',
  'approval',
  'split-pane',
] as const;

// ─── Accessibility ──────────────────────────────────────────────────────────

describe('LoadingSkeleton · accessibility', () => {
  it.each(ALL_VARIANTS)('variant="%s" has no axe violations', async (variant) => {
    const { container } = renderWithProviders(<LoadingSkeleton variant={variant} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it.each(ALL_VARIANTS)('variant="%s" has role="status"', (variant) => {
    renderWithProviders(<LoadingSkeleton variant={variant} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it.each(ALL_VARIANTS)('variant="%s" has sr-only loading text', (variant) => {
    renderWithProviders(<LoadingSkeleton variant={variant} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toHaveClass('sr-only');
  });

  it.each(ALL_VARIANTS)('variant="%s" has an aria-label', (variant) => {
    renderWithProviders(<LoadingSkeleton variant={variant} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label');
  });

  it.each(ALL_VARIANTS)('variant="%s" has aria-busy="true"', (variant) => {
    renderWithProviders(<LoadingSkeleton variant={variant} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it.each(ALL_VARIANTS)('variant="%s" has aria-live="polite"', (variant) => {
    renderWithProviders(<LoadingSkeleton variant={variant} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});

// ─── Variant rendering ─────────────────────────────────────────────────────

describe('LoadingSkeleton · variants', () => {
  it('defaults to "detail" variant', () => {
    renderWithProviders(<LoadingSkeleton />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading details');
  });

  it('renders table variant', () => {
    renderWithProviders(<LoadingSkeleton variant="table" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading table');
  });

  it('renders form variant', () => {
    renderWithProviders(<LoadingSkeleton variant="form" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading form');
  });

  it('renders report variant', () => {
    renderWithProviders(<LoadingSkeleton variant="report" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading report');
  });

  it('renders statement variant', () => {
    renderWithProviders(<LoadingSkeleton variant="statement" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading statement');
  });

  it('renders dashboard variant', () => {
    renderWithProviders(<LoadingSkeleton variant="dashboard" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading dashboard');
  });

  it('renders cards variant', () => {
    renderWithProviders(<LoadingSkeleton variant="cards" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders settings variant', () => {
    renderWithProviders(<LoadingSkeleton variant="settings" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading settings');
  });

  it('renders tabbed-table variant', () => {
    renderWithProviders(<LoadingSkeleton variant="tabbed-table" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading module');
  });

  it('renders approval variant', () => {
    renderWithProviders(<LoadingSkeleton variant="approval" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading approvals');
  });

  it('renders split-pane variant', () => {
    renderWithProviders(<LoadingSkeleton variant="split-pane" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading workspace');
  });
});

// ─── Named exports render identically to variant ────────────────────────────

describe('LoadingSkeleton · named exports', () => {
  it('TableSkeleton matches variant="table"', () => {
    const { container: a } = renderWithProviders(<TableSkeleton />);
    const { container: b } = renderWithProviders(<LoadingSkeleton variant="table" />);
    expect(a.innerHTML).toEqual(b.innerHTML);
  });

  it('DetailSkeleton matches variant="detail"', () => {
    const { container: a } = renderWithProviders(<DetailSkeleton />);
    const { container: b } = renderWithProviders(<LoadingSkeleton variant="detail" />);
    expect(a.innerHTML).toEqual(b.innerHTML);
  });

  it('FormSkeleton matches variant="form"', () => {
    const { container: a } = renderWithProviders(<FormSkeleton />);
    const { container: b } = renderWithProviders(<LoadingSkeleton variant="form" />);
    expect(a.innerHTML).toEqual(b.innerHTML);
  });

  it('ReportSkeleton matches variant="report"', () => {
    const { container: a } = renderWithProviders(<ReportSkeleton />);
    const { container: b } = renderWithProviders(<LoadingSkeleton variant="report" />);
    expect(a.innerHTML).toEqual(b.innerHTML);
  });

  it('StatementSkeleton matches variant="statement"', () => {
    const { container: a } = renderWithProviders(<StatementSkeleton />);
    const { container: b } = renderWithProviders(<LoadingSkeleton variant="statement" />);
    expect(a.innerHTML).toEqual(b.innerHTML);
  });

  it('DashboardSkeleton matches variant="dashboard"', () => {
    const { container: a } = renderWithProviders(<DashboardSkeleton />);
    const { container: b } = renderWithProviders(<LoadingSkeleton variant="dashboard" />);
    expect(a.innerHTML).toEqual(b.innerHTML);
  });

  it('CardsSkeleton matches variant="cards"', () => {
    const { container: a } = renderWithProviders(<CardsSkeleton />);
    const { container: b } = renderWithProviders(<LoadingSkeleton variant="cards" />);
    expect(a.innerHTML).toEqual(b.innerHTML);
  });

  it('SettingsSkeleton matches variant="settings"', () => {
    const { container: a } = renderWithProviders(<SettingsSkeleton />);
    const { container: b } = renderWithProviders(<LoadingSkeleton variant="settings" />);
    expect(a.innerHTML).toEqual(b.innerHTML);
  });

  it('TabbedTableSkeleton matches variant="tabbed-table"', () => {
    const { container: a } = renderWithProviders(<TabbedTableSkeleton />);
    const { container: b } = renderWithProviders(<LoadingSkeleton variant="tabbed-table" />);
    expect(a.innerHTML).toEqual(b.innerHTML);
  });

  it('ApprovalSkeleton matches variant="approval"', () => {
    const { container: a } = renderWithProviders(<ApprovalSkeleton />);
    const { container: b } = renderWithProviders(<LoadingSkeleton variant="approval" />);
    expect(a.innerHTML).toEqual(b.innerHTML);
  });

  it('SplitPaneSkeleton matches variant="split-pane"', () => {
    const { container: a } = renderWithProviders(<SplitPaneSkeleton />);
    const { container: b } = renderWithProviders(<LoadingSkeleton variant="split-pane" />);
    expect(a.innerHTML).toEqual(b.innerHTML);
  });
});

// ─── Props ──────────────────────────────────────────────────────────────────

describe('LoadingSkeleton · props', () => {
  it('forwards className to root element', () => {
    renderWithProviders(<LoadingSkeleton className="custom-test-class" />);
    expect(screen.getByRole('status')).toHaveClass('custom-test-class');
  });

  it('TableSkeleton respects rows and cols', () => {
    const { container } = renderWithProviders(<TableSkeleton rows={3} cols={2} />);
    // 3 data rows + 1 header row = 4 row containers with border-b
    // Each data row has 2 skeleton cells
    const dataCells = container.querySelectorAll('.border-b .h-4.w-24');
    // cols in header (2) + cols * rows in body (2*3) = 8
    expect(dataCells.length).toBe(8);
  });

  it('CardsSkeleton respects cards count', () => {
    const { container } = renderWithProviders(<CardsSkeleton cards={6} />);
    const cards = container.querySelectorAll('.rounded-xl.border.bg-card');
    expect(cards.length).toBe(6);
  });

  it('DetailSkeleton respects tabs count', () => {
    const { container } = renderWithProviders(<DetailSkeleton tabs={5} />);
    // Tab button skeletons are h-9 w-20
    const tabButtons = container.querySelectorAll('.h-9.w-20');
    expect(tabButtons.length).toBe(5);
  });
});
