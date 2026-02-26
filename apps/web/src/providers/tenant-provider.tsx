'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TenantContext, CompanyContext, PeriodContext } from '@/lib/types';

interface TenantContextValue {
  tenant: TenantContext | null;
  activeCompany: CompanyContext | null;
  activePeriod: PeriodContext | null;
  setTenant: (tenant: TenantContext) => void;
  switchCompany: (companyId: string) => void;
  switchPeriod: (period: PeriodContext) => void;
}

const TenantCtx = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  children,
  initialTenant,
}: {
  children: ReactNode;
  initialTenant?: TenantContext;
}) {
  const [tenant, setTenantState] = useState<TenantContext | null>(initialTenant ?? null);

  const activeCompany = tenant?.companies.find((c) => c.id === tenant.activeCompanyId) ?? null;

  const activePeriod = tenant?.activePeriod ?? null;

  const setTenant = useCallback((t: TenantContext) => {
    setTenantState(t);
  }, []);

  const switchCompany = useCallback((companyId: string) => {
    setTenantState((prev) => (prev ? { ...prev, activeCompanyId: companyId } : prev));
  }, []);

  const switchPeriod = useCallback((period: PeriodContext) => {
    setTenantState((prev) => (prev ? { ...prev, activePeriod: period } : prev));
  }, []);

  return (
    <TenantCtx.Provider
      value={{ tenant, activeCompany, activePeriod, setTenant, switchCompany, switchPeriod }}
    >
      {children}
    </TenantCtx.Provider>
  );
}

export function useTenantContext(): TenantContextValue {
  const ctx = useContext(TenantCtx);
  if (!ctx) throw new Error('useTenantContext must be used within <TenantProvider>');
  return ctx;
}
