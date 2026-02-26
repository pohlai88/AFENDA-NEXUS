/**
 * Neon Auth — Next.js API route handler.
 *
 * Proxies all `/api/auth/*` requests to the Neon Auth server.
 */
import { auth } from '@/lib/auth';

export const { GET, POST } = auth.handler();
