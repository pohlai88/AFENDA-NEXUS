/**
 * Document rate limit guards (Plan §8).
 * CI: runs with turbo test:coverage; tests must live in __tests__.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  documentUploadRateLimitGuard,
  documentPresignRateLimitGuard,
  resetDocumentRateLimitState,
  resetPresignRateLimitState,
} from '../document-rate-limit.js';

function mockReq(overrides: Record<string, unknown> = {}): FastifyRequest {
  return { headers: {}, ...overrides } as unknown as FastifyRequest;
}

function mockReply(): FastifyReply & { statusCalledWith?: number } {
  const statusCalledWith: number[] = [];
  const chain = {
    send: vi.fn().mockReturnThis(),
  };
  return {
    header: vi.fn().mockReturnThis(),
    status: vi.fn((code: number) => {
      statusCalledWith.push(code);
      return chain;
    }),
    send: vi.fn().mockReturnThis(),
    get statusCalledWith() {
      return statusCalledWith[statusCalledWith.length - 1];
    },
  } as unknown as FastifyReply & { statusCalledWith?: number };
}

describe('documentUploadRateLimitGuard', () => {
  beforeEach(() => resetDocumentRateLimitState());

  it('passes when under quota', async () => {
    const guard = documentUploadRateLimitGuard({
      maxBytesPerWindow: 1000,
      windowMs: 60_000,
    });
    const req = mockReq({
      authUser: { tenantId: 't1', userId: 'u1' },
      headers: { 'content-length': '500' },
    });
    const reply = mockReply();
    await guard(req, reply);
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('returns 429 when quota exceeded', async () => {
    const guard = documentUploadRateLimitGuard({
      maxBytesPerWindow: 1000,
      windowMs: 60_000,
    });
    const req = mockReq({
      authUser: { tenantId: 't1', userId: 'u1' },
      headers: { 'content-length': '1500' },
    });
    const reply = mockReply();
    await guard(req, reply);
    expect(reply.status).toHaveBeenCalledWith(429);
  });

  it('skips when no tenant-id', async () => {
    const guard = documentUploadRateLimitGuard({ maxBytesPerWindow: 100 });
    const req = mockReq({ headers: { 'content-length': '200' } });
    const reply = mockReply();
    await guard(req, reply);
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('skips when content-length is 0 or missing', async () => {
    const guard = documentUploadRateLimitGuard({ maxBytesPerWindow: 100 });
    const req = mockReq({ headers: { 'x-tenant-id': 't1' } });
    const reply = mockReply();
    await guard(req, reply);
    expect(reply.status).not.toHaveBeenCalled();
  });
});

describe('documentPresignRateLimitGuard', () => {
  beforeEach(() => resetPresignRateLimitState());

  it('passes when under request quota', async () => {
    const guard = documentPresignRateLimitGuard({
      maxRequestsPerWindow: 5,
      windowMs: 60_000,
    });
    const req = mockReq({ authUser: { tenantId: 't1', userId: 'u1' }, headers: {} });
    const reply = mockReply();
    for (let i = 0; i < 3; i++) await guard(req, reply);
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('returns 429 when request quota exceeded', async () => {
    const guard = documentPresignRateLimitGuard({
      maxRequestsPerWindow: 2,
      windowMs: 60_000,
    });
    const req = mockReq({ authUser: { tenantId: 't1', userId: 'u1' }, headers: {} });
    const reply1 = mockReply();
    const reply2 = mockReply();
    const reply3 = mockReply();
    await guard(req, reply1);
    await guard(req, reply2);
    await guard(req, reply3);
    expect(reply3.status).toHaveBeenCalledWith(429);
  });

  it('skips when no tenant-id', async () => {
    const guard = documentPresignRateLimitGuard({ maxRequestsPerWindow: 1 });
    const req = mockReq({ headers: {} });
    const reply = mockReply();
    await guard(req, reply);
    expect(reply.status).not.toHaveBeenCalled();
  });
});
