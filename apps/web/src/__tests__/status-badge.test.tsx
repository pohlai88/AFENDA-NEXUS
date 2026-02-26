import { axe, toHaveNoViolations } from 'jest-axe';
import { renderWithProviders, screen } from './utils';
import { StatusBadge } from '@/components/erp/status-badge';

expect.extend(toHaveNoViolations);

describe('StatusBadge', () => {
  const defaultProps = {
    status: 'DRAFT' as const,
    showIcon: true,
  };

  it('renders the correct label for DRAFT status', () => {
    // Arrange
    renderWithProviders(<StatusBadge {...defaultProps} />);
    // Assert
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders the correct label for POSTED status', () => {
    // Arrange
    renderWithProviders(<StatusBadge {...defaultProps} status="POSTED" />);
    // Assert
    expect(screen.getByText('Posted')).toBeInTheDocument();
  });

  it('renders icon with aria-hidden when showIcon is true', () => {
    // Arrange
    const { container } = renderWithProviders(<StatusBadge {...defaultProps} />);
    // Assert — icon is decorative, so aria-hidden
    const icon = container.querySelector("[aria-hidden='true']");
    expect(icon).toBeInTheDocument();
  });

  it('does not render icon when showIcon is false', () => {
    // Arrange
    const { container } = renderWithProviders(<StatusBadge {...defaultProps} showIcon={false} />);
    // Assert
    const icon = container.querySelector('svg');
    expect(icon).not.toBeInTheDocument();
  });

  it('handles unknown status gracefully', () => {
    // Arrange
    renderWithProviders(<StatusBadge {...defaultProps} status="UNKNOWN_STATUS" />);
    // Assert — falls back to raw status string as label
    expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
  });

  it('renders all known statuses without error', () => {
    const statuses = ['DRAFT', 'POSTED', 'REVERSED', 'VOIDED', 'OPEN', 'CLOSED', 'LOCKED'];
    for (const status of statuses) {
      const { unmount } = renderWithProviders(<StatusBadge status={status} />);
      // Assert — each status renders a visible label
      expect(screen.getByText(/.+/)).toBeInTheDocument();
      unmount();
    }
  });

  it('has no accessibility violations', async () => {
    // Arrange
    const { container } = renderWithProviders(<StatusBadge {...defaultProps} status="POSTED" />);
    // Assert
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
