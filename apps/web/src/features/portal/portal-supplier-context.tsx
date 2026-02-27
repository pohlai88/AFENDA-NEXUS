'use client';

import { createContext, useContext } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PortalSupplierContextValue {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'INACTIVE';
  currencyCode: string;
  taxId: string | null;
  remittanceEmail: string | null;
}

// ─── Context ────────────────────────────────────────────────────────────────

const PortalSupplierContext = createContext<PortalSupplierContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function PortalSupplierProvider({
  supplier,
  children,
}: {
  supplier: PortalSupplierContextValue;
  children: React.ReactNode;
}) {
  return (
    <PortalSupplierContext.Provider value={supplier}>
      {children}
    </PortalSupplierContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function usePortalSupplier(): PortalSupplierContextValue {
  const ctx = useContext(PortalSupplierContext);
  if (!ctx) {
    throw new Error(
      'usePortalSupplier must be used within a <PortalSupplierProvider>. ' +
      'Ensure the portal layout wraps children with the provider.'
    );
  }
  return ctx;
}
