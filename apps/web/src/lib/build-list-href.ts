/**
 * Build a paginated list URL preserving current filter params.
 * Shared by all list pages that use ListFilterBar + Pagination.
 */
export function buildListHref(
  baseUrl: string,
  currentParams: Record<string, string | undefined>,
  nextPage: number,
): string {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(currentParams)) {
    if (key !== 'page' && key !== 'limit' && value) p.set(key, value);
  }
  if (nextPage > 1) p.set('page', String(nextPage));
  const qs = p.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}
