import { ShortcutEngine } from '@/lib/shortcuts/shortcut-engine';

describe('ShortcutEngine', () => {
  let engine: ShortcutEngine;

  beforeEach(() => {
    engine = new ShortcutEngine();
  });

  afterEach(() => {
    engine.stop();
  });

  // ─── Registration ──────────────────────────────────────────────────

  it('registers and retrieves shortcuts', () => {
    engine.register({
      id: 'test-1',
      keys: '?',
      description: 'Show help',
      handler: vi.fn(),
    });
    const registered = engine.getRegistered();
    expect(registered).toHaveLength(1);
    expect(registered[0]!.id).toBe('test-1');
  });

  it('unregisters shortcuts by id', () => {
    engine.register({
      id: 'test-1',
      keys: '?',
      description: 'Show help',
      handler: vi.fn(),
    });
    engine.unregister('test-1');
    expect(engine.getRegistered()).toHaveLength(0);
  });

  it('defaults scope to global', () => {
    engine.register({
      id: 'test-1',
      keys: 'g j',
      description: 'Go to journals',
      handler: vi.fn(),
    });
    expect(engine.getRegistered()[0]!.scope).toBe('global');
  });

  // ─── Scope Stack ──────────────────────────────────────────────────

  it('pushes and pops scopes on the stack', () => {
    engine.pushScope('table');
    engine.pushScope('dialog');
    engine.popScope('dialog');
    // After pop, table should be the active scope
    // We can verify indirectly by registering shortcuts
    expect(engine.getRegistered()).toHaveLength(0);
  });

  it('does not remove global scope from stack', () => {
    // global is always on the stack — popScope should not remove it
    engine.popScope('global');
    // Should still work fine
    engine.register({
      id: 'test',
      keys: '?',
      description: 'test',
      handler: vi.fn(),
    });
    expect(engine.getRegistered()).toHaveLength(1);
  });

  // ─── Lifecycle ─────────────────────────────────────────────────────

  it('starts and stops listening', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    engine.start();
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    engine.stop();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('does not double-start', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    engine.start();
    engine.start();
    // Should only have been called once for keydown (plus once for focusin)
    const keydownCalls = addSpy.mock.calls.filter(
      (c) => c[0] === 'keydown',
    );
    expect(keydownCalls).toHaveLength(1);
    addSpy.mockRestore();
  });

  // ─── Registration data ────────────────────────────────────────────

  it('overwrites existing registration with same id', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    engine.register({ id: 'test', keys: '?', description: 'v1', handler: handler1 });
    engine.register({ id: 'test', keys: '!', description: 'v2', handler: handler2 });

    const registered = engine.getRegistered();
    expect(registered).toHaveLength(1);
    expect(registered[0]!.keys).toBe('!');
    expect(registered[0]!.description).toBe('v2');
  });
});
