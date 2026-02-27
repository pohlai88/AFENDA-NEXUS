/**
 * Shared port re-exporting the Tax slice's WHT certificate types.
 *
 * Cross-slice consumers (e.g. AP supplier-portal) MUST import from this
 * shared port rather than reaching directly into the Tax slice (E16 rule).
 */

export type { WhtCertificate, WhtCertificateStatus } from '../../slices/tax/entities/wht-certificate.js';
export type { IWhtCertificateRepo, CreateWhtCertificateInput } from '../../slices/tax/ports/wht-certificate-repo.js';
