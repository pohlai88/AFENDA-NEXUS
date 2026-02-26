/**
 * Cross-slice ports for recurring template access.
 * GL slice uses this to read/process recurring templates owned by Hub.
 */
export type {
  RecurringTemplate,
  RecurringTemplateLine,
  RecurringFrequency,
} from '../../slices/hub/entities/recurring-template.js';
export type {
  IRecurringTemplateRepo,
  CreateRecurringTemplateInput,
} from '../../slices/hub/ports/recurring-template-repo.js';
