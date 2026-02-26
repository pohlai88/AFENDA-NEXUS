import { redirect } from 'next/navigation';
import { isForbidden, isServerError, isUnauthorized } from '@/lib/api-client';
import type { ApiResult } from '@/lib/types';

export function handleApiError<T>(
  result: ApiResult<T>,
  fallbackMessage = 'Unexpected API error'
): never {
  if (result.ok) {
    throw new Error('handleApiError was called with an ok result');
  }

  if (isUnauthorized(result)) {
    redirect('/login');
  }

  if (isForbidden(result)) {
    redirect('/forbidden');
  }

  if (isServerError(result)) {
    throw new Error(fallbackMessage);
  }

  throw new Error(result.error.message || fallbackMessage);
}
