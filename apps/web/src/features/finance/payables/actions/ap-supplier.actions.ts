'use server';

import { getRequestContext } from '@/lib/auth';
import {
  createSupplier,
  updateSupplier,
  addSupplierSite,
  addSupplierBankAccount,
} from '../queries/ap-supplier.queries';
import type { CreateSupplier } from '@afenda/contracts';
import type { ApiResult, CommandReceipt } from '@/lib/types';

export async function createSupplierAction(
  data: CreateSupplier,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return createSupplier(ctx, data);
}

export async function updateSupplierAction(
  id: string,
  data: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return updateSupplier(ctx, id, data);
}

export async function addSupplierSiteAction(
  supplierId: string,
  data: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return addSupplierSite(ctx, supplierId, data);
}

export async function addSupplierBankAccountAction(
  supplierId: string,
  data: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return addSupplierBankAccount(ctx, supplierId, data);
}
