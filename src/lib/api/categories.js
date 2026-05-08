/**
 * Categories API
 * @see Laravel: App\Http\Controllers\API\CategoryController
 * @see Laravel: App\Http\Resources\Api\CategoryGroupResource
 */

import api from './client';

/**
 * Get category tree grouped by taxonomy.
 * @returns {Promise<{ data: import('./types').CategoryGroup[] }>}
 */
export async function listCategories() {
  const { data } = await api.get('/categories');
  return data;
}
