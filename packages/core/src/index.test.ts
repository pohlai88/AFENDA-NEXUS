import { describe, it, expect } from 'vitest';
import {
  ok,
  err,
  money,
  dateRange,
  tenantId,
  companyId,
  userId,
  ledgerId,
  AppError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
  CURRENCY_SCALE,
  currencyScale,
  toMinorUnits,
  fromMinorUnits,
  formatMinorUnits,
} from './index.js';

// ─── Result ────────────────────────────────────────────────────────────────────

describe('Result helpers', () => {
  it('ok() wraps a value', () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });

  it('err() wraps an error', () => {
    const r = err(new AppError('TEST', 'boom'));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('TEST');
      expect(r.error.message).toBe('boom');
    }
  });

  it('ok result narrows correctly', () => {
    const r = ok('hello');
    if (r.ok) {
      expect(r.value).toBe('hello');
    } else {
      throw new Error('should be ok');
    }
  });
});

// ─── Branded Types ─────────────────────────────────────────────────────────────

describe('Branded ID constructors', () => {
  it('tenantId returns a branded string', () => {
    const id = tenantId('t-123');
    expect(String(id)).toBe('t-123');
  });

  it('companyId returns a branded string', () => {
    const id = companyId('c-456');
    expect(String(id)).toBe('c-456');
  });

  it('userId returns a branded string', () => {
    const id = userId('u-789');
    expect(String(id)).toBe('u-789');
  });

  it('ledgerId returns a branded string', () => {
    const id = ledgerId('l-000');
    expect(String(id)).toBe('l-000');
  });
});

// ─── Money ─────────────────────────────────────────────────────────────────────

describe('money()', () => {
  it('creates a Money with default scale', () => {
    const m = money(10000n, 'USD');
    expect(m.amount).toBe(10000n);
    expect(m.currency).toBe('USD');
    expect(m.scale).toBe(2);
  });

  it('accepts custom scale', () => {
    const m = money(123456n, 'BHD', 3);
    expect(m.scale).toBe(3);
  });

  it('handles zero amount', () => {
    const m = money(0n, 'EUR');
    expect(m.amount).toBe(0n);
  });
});

// ─── Currency Scale & Minor Units ─────────────────────────────────────────────

describe('CURRENCY_SCALE', () => {
  it('has 2 decimals for USD', () => {
    expect(CURRENCY_SCALE.USD).toBe(2);
  });

  it('has 0 decimals for JPY', () => {
    expect(CURRENCY_SCALE.JPY).toBe(0);
  });

  it('has 3 decimals for KWD', () => {
    expect(CURRENCY_SCALE.KWD).toBe(3);
  });
});

describe('currencyScale()', () => {
  it('returns known scale', () => {
    expect(currencyScale('IDR')).toBe(0);
    expect(currencyScale('BHD')).toBe(3);
  });

  it('defaults to 2 for unknown currency', () => {
    expect(currencyScale('XYZ')).toBe(2);
  });
});

describe('toMinorUnits()', () => {
  it('converts USD (2 decimals)', () => {
    expect(toMinorUnits(100.50, 'USD')).toBe(10050n);
  });

  it('converts JPY (0 decimals)', () => {
    expect(toMinorUnits(1500, 'JPY')).toBe(1500n);
  });

  it('converts IDR (0 decimals)', () => {
    expect(toMinorUnits(50000, 'IDR')).toBe(50000n);
  });

  it('converts KWD (3 decimals)', () => {
    expect(toMinorUnits(1.234, 'KWD')).toBe(1234n);
  });

  it('converts BHD (3 decimals)', () => {
    expect(toMinorUnits(99.999, 'BHD')).toBe(99999n);
  });

  it('rounds correctly', () => {
    expect(toMinorUnits(10.005, 'USD')).toBe(1001n);
    expect(toMinorUnits(10.004, 'USD')).toBe(1000n);
  });
});

describe('fromMinorUnits()', () => {
  it('converts USD minor to major', () => {
    expect(fromMinorUnits(10050n, 'USD')).toBe(100.50);
  });

  it('converts JPY minor to major (no decimals)', () => {
    expect(fromMinorUnits(1500n, 'JPY')).toBe(1500);
  });

  it('converts KWD minor to major (3 decimals)', () => {
    expect(fromMinorUnits(1234n, 'KWD')).toBe(1.234);
  });

  it('round-trips correctly', () => {
    expect(fromMinorUnits(toMinorUnits(42.50, 'USD'), 'USD')).toBe(42.50);
    expect(fromMinorUnits(toMinorUnits(1500, 'JPY'), 'JPY')).toBe(1500);
    expect(fromMinorUnits(toMinorUnits(1.234, 'KWD'), 'KWD')).toBe(1.234);
  });
});

describe('formatMinorUnits()', () => {
  it('formats 2-decimal amount', () => {
    expect(formatMinorUnits(10050n, 2)).toBe('100.50');
  });

  it('formats 0-decimal amount', () => {
    expect(formatMinorUnits(1500n, 0)).toBe('1500');
  });

  it('formats 3-decimal amount', () => {
    expect(formatMinorUnits(1234n, 3)).toBe('1.234');
  });

  it('pads fractional part', () => {
    expect(formatMinorUnits(5n, 2)).toBe('0.05');
  });
});

// ─── DateRange ─────────────────────────────────────────────────────────────────

describe('dateRange()', () => {
  it('creates a valid range', () => {
    const from = new Date('2025-01-01');
    const to = new Date('2025-12-31');
    const r = dateRange(from, to);
    expect(r.from).toBe(from);
    expect(r.to).toBe(to);
  });

  it('allows same-day range', () => {
    const d = new Date('2025-06-15');
    const r = dateRange(d, d);
    expect(r.from).toBe(d);
    expect(r.to).toBe(d);
  });

  it('throws on inverted range', () => {
    expect(() => dateRange(new Date('2025-12-31'), new Date('2025-01-01'))).toThrow(
      'from must be <= to'
    );
  });
});

// ─── Errors ────────────────────────────────────────────────────────────────────

describe('Error classes', () => {
  it('AppError has code and message', () => {
    const e = new AppError('CUSTOM', 'something broke');
    expect(e.code).toBe('CUSTOM');
    expect(e.message).toBe('something broke');
    expect(e.name).toBe('AppError');
    expect(e).toBeInstanceOf(Error);
  });

  it('AppError preserves cause', () => {
    const cause = new Error('root');
    const e = new AppError('WRAP', 'wrapped', cause);
    expect(e.cause).toBe(cause);
  });

  it('NotFoundError formats message', () => {
    const e = new NotFoundError('Journal', 'j-123');
    expect(e.code).toBe('NOT_FOUND');
    expect(e.message).toBe('Journal not found: j-123');
    expect(e.name).toBe('NotFoundError');
    expect(e).toBeInstanceOf(AppError);
  });

  it('ValidationError includes fields', () => {
    const e = new ValidationError('bad input', { email: 'required' });
    expect(e.code).toBe('VALIDATION');
    expect(e.fields).toEqual({ email: 'required' });
    expect(e.name).toBe('ValidationError');
  });

  it('AuthorizationError defaults to Forbidden', () => {
    const e = new AuthorizationError();
    expect(e.code).toBe('FORBIDDEN');
    expect(e.message).toBe('Forbidden');
    expect(e.name).toBe('AuthorizationError');
  });

  it('AuthorizationError accepts custom message', () => {
    const e = new AuthorizationError('no access to ledger');
    expect(e.message).toBe('no access to ledger');
  });
});
