/**
 * Filters API
 * @see Laravel: App\Http\Controllers\API\FilterController
 */

import api from './client';

/**
 * Get all filter options (types, sort, categories, meta filters).
 * @returns {Promise<import('./types').FilterResponse>}
 */
export async function getFilters() {
  const { data } = await api.get('/filters');
  return data;
}
