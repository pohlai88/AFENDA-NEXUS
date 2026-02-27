// ─── Due State Helper ───────────────────────────────────────────────────────
// Shared logic for overdue/due-soon indicators across AP + Portal tables.

export type DueState = 'OVERDUE' | 'DUE_SOON' | 'OK';

const TERMINAL_STATUSES = new Set(['PAID', 'CANCELLED', 'CLOSED', 'RESOLVED', 'REJECTED']);
const DUE_SOON_DAYS = 7;

export function getDueState(input: { dueDate: string; status: string }): DueState {
  if (TERMINAL_STATUSES.has(input.status)) return 'OK';

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const due = new Date(input.dueDate);
  due.setHours(0, 0, 0, 0);

  if (due < now) return 'OVERDUE';

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= DUE_SOON_DAYS) return 'DUE_SOON';

  return 'OK';
}
