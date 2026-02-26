import type { Result } from '@afenda/core';
import { ok } from '@afenda/core';
import {
  generateNotes,
  type NoteTemplate,
  type NoteData,
  type NotesResult,
} from '../calculators/notes-engine.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

export interface GetNotesInput {
  readonly templates: readonly NoteTemplate[];
  readonly data: readonly NoteData[];
}

/**
 * @see SR-02 — Notes to financial statements (IAS 1 §112–138)
 *
 * Wraps the pure generateNotes calculator in a service layer.
 * Templates and data are provided by the caller — this allows
 * the frontend to manage note templates per entity/jurisdiction.
 */
export async function getNotes(
  input: GetNotesInput,
  _ctx?: FinanceContext
): Promise<Result<NotesResult>> {
  const { result } = generateNotes(input.templates, input.data);
  return ok(result);
}
