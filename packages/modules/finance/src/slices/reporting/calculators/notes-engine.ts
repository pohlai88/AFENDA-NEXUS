/**
 * SR-02: Notes to financial statements template engine.
 * Pure calculator — generates note disclosures from structured data
 * using configurable templates.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type NoteCategory =
  | 'ACCOUNTING_POLICIES'
  | 'SIGNIFICANT_JUDGMENTS'
  | 'REVENUE'
  | 'PROPERTY_PLANT_EQUIPMENT'
  | 'INTANGIBLE_ASSETS'
  | 'FINANCIAL_INSTRUMENTS'
  | 'LEASES'
  | 'PROVISIONS'
  | 'RELATED_PARTY'
  | 'SUBSEQUENT_EVENTS'
  | 'OTHER';

export interface NoteTemplate {
  readonly id: string;
  readonly category: NoteCategory;
  readonly title: string;
  readonly templateText: string;
  readonly requiredFields: readonly string[];
  readonly isRequired: boolean;
}

export interface NoteData {
  readonly templateId: string;
  readonly fields: Readonly<Record<string, string | bigint | number | boolean>>;
}

export interface GeneratedNote {
  readonly templateId: string;
  readonly category: NoteCategory;
  readonly title: string;
  readonly content: string;
  readonly isComplete: boolean;
  readonly missingFields: readonly string[];
}

export interface NotesResult {
  readonly notes: readonly GeneratedNote[];
  readonly completeCount: number;
  readonly incompleteCount: number;
  readonly missingRequiredNotes: readonly string[];
}

/**
 * Generates notes from templates and data.
 * Replaces {{fieldName}} placeholders with values from NoteData.
 */
export function generateNotes(
  templates: readonly NoteTemplate[],
  data: readonly NoteData[]
): CalculatorResult<NotesResult> {
  if (templates.length === 0) {
    throw new Error('At least one note template required');
  }

  const dataMap = new Map(data.map((d) => [d.templateId, d]));
  const notes: GeneratedNote[] = [];
  const missingRequiredNotes: string[] = [];

  for (const template of templates) {
    const noteData = dataMap.get(template.id);

    if (!noteData) {
      if (template.isRequired) {
        missingRequiredNotes.push(template.id);
      }
      notes.push({
        templateId: template.id,
        category: template.category,
        title: template.title,
        content: '',
        isComplete: false,
        missingFields: [...template.requiredFields],
      });
      continue;
    }

    const missingFields: string[] = [];
    let content = template.templateText;

    for (const field of template.requiredFields) {
      const value = noteData.fields[field];
      if (value === undefined || value === null) {
        missingFields.push(field);
      } else {
        const replacement = typeof value === 'bigint' ? value.toString() : String(value);
        content = content.replaceAll(`{{${field}}}`, replacement);
      }
    }

    // Also replace any optional fields that are present
    for (const [key, value] of Object.entries(noteData.fields)) {
      if (value !== undefined && value !== null) {
        const replacement = typeof value === 'bigint' ? value.toString() : String(value);
        content = content.replaceAll(`{{${key}}}`, replacement);
      }
    }

    notes.push({
      templateId: template.id,
      category: template.category,
      title: template.title,
      content,
      isComplete: missingFields.length === 0,
      missingFields,
    });
  }

  const completeCount = notes.filter((n) => n.isComplete).length;

  return {
    result: {
      notes,
      completeCount,
      incompleteCount: notes.length - completeCount,
      missingRequiredNotes,
    },
    inputs: { templateCount: templates.length, dataCount: data.length },
    explanation: `Notes: ${completeCount}/${notes.length} complete, ${missingRequiredNotes.length} required notes missing`,
  };
}
