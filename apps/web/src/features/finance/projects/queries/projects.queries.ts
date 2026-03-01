import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type {
  Project,
  ProjectCost,
  ProjectBilling,
  ProjectMilestone,
  WIPCalculation,
  ProjectSummary,
} from '../types';

type RequestCtx = { tenantId: string; userId: string; token: string };

// ─── Query Functions ─────────────────────────────────────────────────────────

export const getProjects = cache(async (
  ctx: RequestCtx,
  params?: {
    status?: string;
    customerId?: string;
    department?: string;
    search?: string;
    page?: number;
    perPage?: number;
  }
): Promise<
  | {
      ok: true;
      data: Project[];
      pagination: { page: number; perPage: number; total: number; totalPages: number };
    }
  | { ok: false; error: string }
> => {
  const api = createApiClient(ctx);
  const qp = new URLSearchParams();
  if (params?.status) qp.set('status', params.status);
  if (params?.customerId) qp.set('customerId', params.customerId);
  if (params?.department) qp.set('department', params.department);
  if (params?.search) qp.set('search', params.search);
  if (params?.page) qp.set('page', String(params.page));
  if (params?.perPage) qp.set('perPage', String(params.perPage));
  const qs = qp.toString();
  const res = await api.get(`/projects${qs ? `?${qs}` : ''}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  const body = res.value as {
    data: Project[];
    pagination?: { page: number; perPage: number; total: number; totalPages: number };
  };
  return {
    ok: true,
    data: body.data ?? (res.value as unknown as Project[]),
    pagination: body.pagination ?? {
      page: params?.page ?? 1,
      perPage: params?.perPage ?? 20,
      total: (body.data ?? (res.value as unknown as Project[])).length,
      totalPages: 1,
    },
  };
});

export const getProjectById = cache(async (
  ctx: RequestCtx,
  id: string
): Promise<{ ok: true; data: Project } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const res = await api.get(`/projects/${id}`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as Project };
});

export const getProjectCosts = cache(async (
  ctx: RequestCtx,
  projectId: string
): Promise<{ ok: true; data: ProjectCost[] } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const res = await api.get(`/projects/${projectId}/costs`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as ProjectCost[] };
});

export const getProjectBillings = cache(async (
  ctx: RequestCtx,
  projectId: string
): Promise<{ ok: true; data: ProjectBilling[] } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const res = await api.get(`/projects/${projectId}/billings`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as ProjectBilling[] };
});

export const getProjectMilestones = cache(async (
  ctx: RequestCtx,
  projectId: string
): Promise<{ ok: true; data: ProjectMilestone[] } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const res = await api.get(`/projects/${projectId}/milestones`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as ProjectMilestone[] };
});

export const getWIPCalculation = cache(async (
  ctx: RequestCtx,
  projectId: string
): Promise<{ ok: true; data: WIPCalculation } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const res = await api.get(`/projects/${projectId}/wip`);
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as WIPCalculation };
});

export const getProjectSummary = cache(async (
  ctx: RequestCtx
): Promise<{ ok: true; data: ProjectSummary } | { ok: false; error: string }> => {
  const api = createApiClient(ctx);
  const res = await api.get('/projects/summary');
  if (!res.ok) return { ok: false, error: res.error.message };
  return { ok: true, data: res.value as ProjectSummary };
});
