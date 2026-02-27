/**
 * Shared port re-exporting the GL slice's fiscal-period repository interface.
 *
 * Cross-slice consumers (e.g. AP posting) MUST import from this shared port
 * rather than reaching directly into the GL slice (E16 slice-isolation rule).
 */

export type { IFiscalPeriodRepo } from '../../slices/gl/ports/fiscal-period-repo.js';
