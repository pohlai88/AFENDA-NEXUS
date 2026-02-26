import { axe } from 'jest-axe';
import { renderWithProviders, screen } from '../utils';
import { EmptyState } from '@/components/erp/empty-state';

describe('EmptyState', () => {
  it('renders title', () => {
    renderWithProviders(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    renderWithProviders(
      <EmptyState title="No items" description="Create your first item to get started." />
    );
    expect(screen.getByText('Create your first item to get started.')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = renderWithProviders(<EmptyState title="No items" />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders action when provided', () => {
    renderWithProviders(
      <EmptyState title="No items" action={<button type="button">Create Item</button>} />
    );
    expect(screen.getByRole('button', { name: 'Create Item' })).toBeInTheDocument();
  });

  it('uses default Inbox icon with aria-hidden', () => {
    const { container } = renderWithProviders(<EmptyState title="No items" />);
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeInTheDocument();
  });

  it('renders dashed border container', () => {
    const { container } = renderWithProviders(<EmptyState title="Empty" />);
    const wrapper = container.querySelector('.border-dashed');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(<EmptyState title="Empty" className="custom" />);
    const wrapper = container.querySelector('.custom');
    expect(wrapper).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <EmptyState title="No items" description="Try creating one." />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
