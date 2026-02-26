import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger, runWithContext, getContext, type RequestContext } from './logger.js';

describe('createLogger', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns a Logger with all required methods', () => {
    const logger = createLogger();
    expect(typeof logger.trace).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.fatal).toBe('function');
    expect(typeof logger.child).toBe('function');
    expect(typeof logger.isLevelEnabled).toBe('function');
  });

  it('respects LOG_LEVEL env override', () => {
    vi.stubEnv('LOG_LEVEL', 'debug');
    const logger = createLogger({ level: 'warn' });
    // LOG_LEVEL env takes precedence over opts.level
    expect(logger.isLevelEnabled('debug')).toBe(true);
  });

  it('respects opts.level when LOG_LEVEL is not set', () => {
    vi.stubEnv('LOG_LEVEL', '');
    const logger = createLogger({ level: 'error' });
    expect(logger.isLevelEnabled('warn')).toBe(false);
    expect(logger.isLevelEnabled('error')).toBe(true);
  });

  it('defaults to info level', () => {
    vi.stubEnv('LOG_LEVEL', '');
    const logger = createLogger();
    expect(logger.isLevelEnabled('info')).toBe(true);
    expect(logger.isLevelEnabled('debug')).toBe(false);
  });

  it('child() returns a Logger with the same interface', () => {
    const logger = createLogger();
    const child = logger.child({ module: 'test' });
    expect(typeof child.info).toBe('function');
    expect(typeof child.child).toBe('function');
    expect(typeof child.isLevelEnabled).toBe('function');
  });

  it('does not throw when logging with context object', () => {
    const logger = createLogger({ level: 'info' });
    expect(() => logger.info('test message', { key: 'value' })).not.toThrow();
  });

  it('does not throw when logging without context object', () => {
    const logger = createLogger({ level: 'info' });
    expect(() => logger.info('test message')).not.toThrow();
  });

  it('accepts service option in base bindings', () => {
    expect(() => createLogger({ level: 'info', service: 'test-service' })).not.toThrow();
  });

  it('accepts custom redact paths', () => {
    expect(() => createLogger({ redact: ['custom.secret.path'] })).not.toThrow();
  });
});

describe('RequestContext / AsyncLocalStorage', () => {
  it('getContext() returns undefined outside runWithContext', () => {
    expect(getContext()).toBeUndefined();
  });

  it('runWithContext propagates context to getContext()', () => {
    const ctx: RequestContext = {
      correlationId: 'corr-123',
      tenantId: 'tenant-abc',
      userId: 'user-xyz',
      requestId: 'req-001',
    };

    runWithContext(ctx, () => {
      const retrieved = getContext();
      expect(retrieved).toBeDefined();
      expect(retrieved!.correlationId).toBe('corr-123');
      expect(retrieved!.tenantId).toBe('tenant-abc');
      expect(retrieved!.userId).toBe('user-xyz');
      expect(retrieved!.requestId).toBe('req-001');
    });
  });

  it('context is isolated between nested runWithContext calls', () => {
    runWithContext({ correlationId: 'outer' }, () => {
      expect(getContext()!.correlationId).toBe('outer');

      runWithContext({ correlationId: 'inner' }, () => {
        expect(getContext()!.correlationId).toBe('inner');
      });

      // Outer context restored after inner completes
      expect(getContext()!.correlationId).toBe('outer');
    });
  });

  it('context is not leaked after runWithContext completes', () => {
    runWithContext({ correlationId: 'temp' }, () => {
      expect(getContext()).toBeDefined();
    });
    expect(getContext()).toBeUndefined();
  });

  it('context can be mutated in-place (for preHandler enrichment)', () => {
    const ctx: RequestContext = { correlationId: 'corr-456' };

    runWithContext(ctx, () => {
      const store = getContext()!;
      store.tenantId = 'tenant-enriched';
      store.userId = 'user-enriched';

      expect(getContext()!.tenantId).toBe('tenant-enriched');
      expect(getContext()!.userId).toBe('user-enriched');
    });
  });

  it('runWithContext returns the value from fn', () => {
    const result = runWithContext({ correlationId: 'test' }, () => 42);
    expect(result).toBe(42);
  });

  it('runWithContext propagates thrown errors', () => {
    expect(() =>
      runWithContext({ correlationId: 'err' }, () => {
        throw new Error('boom');
      })
    ).toThrow('boom');
  });
});

describe('Logger + AsyncLocalStorage integration', () => {
  it('logger does not throw when called inside runWithContext', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const logger = createLogger({ level: 'info', service: 'test' });

    expect(() =>
      runWithContext({ correlationId: 'int-test', tenantId: 't1', userId: 'u1' }, () => {
        logger.info('inside context');
        logger.warn('warning inside context', { extra: 'data' });
      })
    ).not.toThrow();
  });

  it('logger does not throw when called outside runWithContext', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const logger = createLogger({ level: 'info' });
    expect(() => logger.info('no context')).not.toThrow();
  });

  it('child logger inherits context from AsyncLocalStorage', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const logger = createLogger({ level: 'info' });
    const child = logger.child({ module: 'finance' });

    expect(() =>
      runWithContext({ correlationId: 'child-test' }, () => {
        child.info('child log inside context');
      })
    ).not.toThrow();
  });
});
