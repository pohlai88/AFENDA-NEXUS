/**
 * Cross-slice hook for recurring journal processing.
 * Hub routes invoke GL's recurring journal processor through shared.
 */
export { processRecurringJournals } from "../../slices/gl/services/process-recurring-journals.js";
export type {
  ProcessRecurringInput,
  ProcessRecurringResult,
} from "../../slices/gl/services/process-recurring-journals.js";
