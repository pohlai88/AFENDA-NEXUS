import { axe } from 'jest-axe';
import { renderWithProviders, screen } from '../utils';
import { MoneyCell } from '@/components/erp/money-cell';

describe('MoneyCell', () => {
  it('renders formatted money amount', () => {
    renderWithProviders(<MoneyCell amount={1500} />);
    // formatMoney(1500, 'USD') → "$1,500.00"
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
  });

  it('renders with currency code when showCode is true', () => {
    renderWithProviders(<MoneyCell amount={250} currency="USD" showCode />);
    expect(screen.getByText('250.00 USD')).toBeInTheDocument();
  });

  it('applies destructive class for negative amounts', () => {
    const { container } = renderWithProviders(<MoneyCell amount={-100} />);
    const span = container.querySelector('span');
    expect(span).toHaveClass('text-destructive');
  });

  it('does not apply destructive class for positive amounts', () => {
    const { container } = renderWithProviders(<MoneyCell amount={100} />);
    const span = container.querySelector('span');
    expect(span).not.toHaveClass('text-destructive');
  });

  it('handles zero amount', () => {
    renderWithProviders(<MoneyCell amount={0} />);
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('handles string amount', () => {
    renderWithProviders(<MoneyCell amount="50000" />);
    // formatMoney parses string, divides by 10^decimals → 50000 / 100 = 500
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  it('handles bigint amount', () => {
    renderWithProviders(<MoneyCell amount={BigInt(100000)} />);
    // formatMoney bigint: 100000 / 100 = 1000
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('uses tabular-nums and mono font classes', () => {
    const { container } = renderWithProviders(<MoneyCell amount={42} />);
    const span = container.querySelector('span');
    expect(span).toHaveClass('tabular-nums');
    expect(span).toHaveClass('font-mono');
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(<MoneyCell amount={10} className="custom-class" />);
    const span = container.querySelector('span');
    expect(span).toHaveClass('custom-class');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<MoneyCell amount={1500} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
