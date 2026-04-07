/**
 * Products API
 * @see Laravel: App\Http\Controllers\API\ProductController
 * @see Laravel: App\Http\Resources\Api\ProductResource
 */

import api from './client';

/**
 * List products (paginated).
 * @param {Object} [params] - Query params (page, per_page, sort, category, search, etc.)
 * @returns {Promise<import('./types').ProductListResponse>}
 */
export async function listProducts(params = {}) {
  const { data } = await api.get('/products', { params });
  return data;
}

/**
 * Get a product by type and ID.
 * @param {'simple'|'variable'} type
 * @param {number} id
 * @returns {Promise<{ data: import('./types').Product }>}
 */
export async function getProduct(type, id) {
  const { data } = await api.get(`/products/${type}/${id}`);
  return data;
}

/**
 * Get a product by type and slug.
 * @param {'simple'|'variable'} type
 * @param {string} slug
 * @returns {Promise<{ data: import('./types').Product }>}
 */
export async function getProductBySlug(type, slug) {
  const { data } = await api.get(`/products/${type}/slug/${slug}`);
  return data;
}
