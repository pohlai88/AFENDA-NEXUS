import { axe } from 'jest-axe';
import { renderWithProviders, screen } from '../utils';
import { DateCell } from '@/components/erp/date-cell';

// Use a fixed date for deterministic tests
const ISO_DATE = '2024-06-15T10:30:00Z';

describe('DateCell', () => {
  it('renders a <time> element', () => {
    renderWithProviders(<DateCell date={ISO_DATE} />);
    const time = screen.getByRole('time') as HTMLTimeElement;
    expect(time).toBeInTheDocument();
    expect(time.dateTime).toBe(ISO_DATE);
  });

  it('renders medium format by default', () => {
    renderWithProviders(<DateCell date={ISO_DATE} />);
    const time = screen.getByRole('time');
    // formatDate 'medium' → "Jun 15, 2024"
    expect(time.textContent).toContain('Jun');
    expect(time.textContent).toContain('2024');
  });

  it('renders short format', () => {
    renderWithProviders(<DateCell date={ISO_DATE} format="short" />);
    const time = screen.getByRole('time');
    // formatDate 'short' → "06/15/2024"
    expect(time.textContent).toContain('06');
    expect(time.textContent).toContain('15');
  });

  it('renders long format', () => {
    renderWithProviders(<DateCell date={ISO_DATE} format="long" />);
    const time = screen.getByRole('time');
    // formatDate 'long' → "June 15, 2024"
    expect(time.textContent).toContain('June');
  });

  it('renders datetime format', () => {
    renderWithProviders(<DateCell date={ISO_DATE} format="datetime" />);
    const time = screen.getByRole('time');
    // formatDateTime includes time components
    expect(time.textContent).toContain('2024');
  });

  it('accepts a Date object', () => {
    const dateObj = new Date(ISO_DATE);
    renderWithProviders(<DateCell date={dateObj} />);
    const time = screen.getByRole('time') as HTMLTimeElement;
    expect(time.dateTime).toBe(dateObj.toISOString());
  });

  it('applies custom className', () => {
    renderWithProviders(<DateCell date={ISO_DATE} className="extra" />);
    const time = screen.getByRole('time');
    expect(time).toHaveClass('extra');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<DateCell date={ISO_DATE} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
