import { axe } from 'jest-axe';
import { renderWithProviders, screen, within } from '../utils';
import { PageHeader } from '@/components/erp/page-header';

describe('PageHeader', () => {
  it('renders title as h1', () => {
    renderWithProviders(<PageHeader title="Journals" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Journals');
  });

  it('renders description when provided', () => {
    renderWithProviders(<PageHeader title="Journals" description="Manage journal entries" />);
    expect(screen.getByText('Manage journal entries')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = renderWithProviders(<PageHeader title="Journals" />);
    const paras = container.querySelectorAll('p');
    expect(paras.length).toBe(0);
  });

  it('renders breadcrumb navigation with aria-label', () => {
    renderWithProviders(
      <PageHeader
        title="New Journal"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Journals', href: '/finance/journals' },
          { label: 'New Journal' },
        ]}
      />
    );
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();
  });

  it('renders breadcrumb links with correct href', () => {
    renderWithProviders(
      <PageHeader
        title="New"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'New' }]}
      />
    );
    const link = screen.getByRole('link', { name: 'Finance' });
    expect(link).toHaveAttribute('href', '/finance');
  });

  it('marks the last breadcrumb as current page', () => {
    renderWithProviders(
      <PageHeader
        title="Journals"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Journals' }]}
      />
    );
    const current = screen.getByText('Journals', { selector: '[aria-current="page"]' });
    expect(current).toBeInTheDocument();
  });

  it('does not render breadcrumb nav when breadcrumbs is empty', () => {
    renderWithProviders(<PageHeader title="Dashboard" breadcrumbs={[]} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('does not render breadcrumb nav when breadcrumbs is not provided', () => {
    renderWithProviders(<PageHeader title="Dashboard" />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders actions slot', () => {
    renderWithProviders(
      <PageHeader title="Journals" actions={<button type="button">Create</button>} />
    );
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <PageHeader title="Test" className="custom-header" />
    );
    // The root div merges className via cn()
    const root = container.querySelector('.custom-header');
    expect(root).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <PageHeader
        title="Journals"
        description="Manage entries"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Journals' }]}
        actions={<button type="button">New</button>}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
