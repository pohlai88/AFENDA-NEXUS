import type { ISupplierRepo } from '../ports/supplier-repo';
import type { OcrExtractionResult } from '../ports/ocr-provider';

export interface SupplierResolutionResult {
  readonly supplierId: string | null;
  readonly issue: string | null;
}

function normalizeSupplierName(name: string): string {
  const suffixes = [
    'SDN BHD',
    'BERHAD',
    'LTD',
    'LIMITED',
    'INC',
    'INCORPORATED',
    'PLC',
    'PTE',
    'CO.',
    'CORP',
    'CORPORATION',
    'LLC',
    'LLP',
    'S.A.',
    'GMBH',
    'AG',
    'B.V.',
    'N.V.',
  ];

  const pattern = new RegExp(`\\s+(${suffixes.join('|')})\\s*$`, 'i');
  const withoutSuffix = name.replace(pattern, '');

  if (withoutSuffix.length < 4) {
    return name.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  }

  return withoutSuffix.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
}

export async function resolveSupplier(
  tenantId: string,
  extraction: OcrExtractionResult,
  supplierRepo: ISupplierRepo
): Promise<SupplierResolutionResult> {
  try {
    if (extraction.supplierTaxId?.value) {
      const taxId = extraction.supplierTaxId.value.trim();
      if (taxId) {
        const supplier = await supplierRepo.findByTaxId(tenantId, taxId);
        if (supplier) {
          return { supplierId: supplier.id, issue: null };
        }
      }
    }

    if (extraction.supplierName?.value) {
      const rawName = extraction.supplierName.value.trim();
      if (rawName) {
        const normalized = normalizeSupplierName(rawName);
        const supplier = await supplierRepo.findByNameNormalized(tenantId, normalized);
        if (supplier) {
          return { supplierId: supplier.id, issue: null };
        }
      }
    }

    return {
      supplierId: null,
      issue: 'No supplier match found (tax ID or name)',
    };
  } catch (error) {
    return {
      supplierId: null,
      issue: `Supplier lookup failed (transient): ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
