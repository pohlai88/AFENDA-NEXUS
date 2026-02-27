import {
  registerAction,
  unregisterAction,
  getActions,
  searchActions,
} from '@/lib/search/action-registry';

describe('ActionRegistry', () => {
  // Note: default actions are registered on module load

  it('returns default actions', () => {
    const actions = getActions();
    expect(actions.length).toBeGreaterThan(0);
    const ids = actions.map((a) => a.id);
    expect(ids).toContain('new-journal-entry');
    expect(ids).toContain('open-keyboard-shortcuts');
  });

  it('registers and retrieves a custom action', () => {
    registerAction({
      id: 'test-action',
      title: 'Test Action',
      icon: 'TestIcon',
      handler: () => {},
    });

    const actions = getActions();
    expect(actions.find((a) => a.id === 'test-action')).toBeDefined();

    // Cleanup
    unregisterAction('test-action');
  });

  it('unregisters an action', () => {
    registerAction({
      id: 'to-remove',
      title: 'Remove Me',
      icon: 'Trash',
    });
    unregisterAction('to-remove');

    const actions = getActions();
    expect(actions.find((a) => a.id === 'to-remove')).toBeUndefined();
  });

  it('filters by active module scope', () => {
    const financeActions = getActions('finance');
    // Finance-scoped actions should be included
    expect(financeActions.find((a) => a.id === 'new-journal-entry')).toBeDefined();
    // Global (no scope) actions should also be included
    expect(financeActions.find((a) => a.id === 'open-keyboard-shortcuts')).toBeDefined();
  });

  it('excludes actions scoped to other modules', () => {
    registerAction({
      id: 'hrm-only',
      title: 'HRM Specific',
      icon: 'Users',
      scope: 'hrm',
    });

    const financeActions = getActions('finance');
    expect(financeActions.find((a) => a.id === 'hrm-only')).toBeUndefined();

    // But it should appear when no filter or matching filter
    expect(getActions('hrm').find((a) => a.id === 'hrm-only')).toBeDefined();
    expect(getActions().find((a) => a.id === 'hrm-only')).toBeDefined();

    unregisterAction('hrm-only');
  });

  it('searches actions by title (case-insensitive)', () => {
    const results = searchActions('journal');
    expect(results.find((a) => a.title.toLowerCase().includes('journal'))).toBeDefined();
  });

  it('returns all actions for empty search query', () => {
    const allActions = getActions();
    const searchResults = searchActions('');
    expect(searchResults.length).toBe(allActions.length);
  });

  it('returns empty array when no match', () => {
    const results = searchActions('xyznonexistent');
    expect(results).toHaveLength(0);
  });
});
