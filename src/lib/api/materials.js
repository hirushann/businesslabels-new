/**
 * Materials API
 *
 * Each material carries a `translations` array with every locale bundled —
 * switch language client-side without refetching.
 *
 * @see Laravel: App\Http\Controllers\API\MaterialController
 * @see Laravel: App\Http\Resources\Api\MaterialResource
 */

import api from './client';

/**
 * List materials (paginated).
 * @param {Object} [params] - Query params (category_id, category_slug, status, per_page, page)
 * @returns {Promise<{ data: import('./types').Material[], meta: import('./types').PaginationMeta }>}
 */
export async function listMaterials(params = {}) {
  const { data } = await api.get('/materials', { params });
  return data;
}

/**
 * Get a material by ID. Includes detail-only fields and related products.
 * @param {number} id
 * @returns {Promise<{ data: import('./types').Material }>}
 */
export async function getMaterial(id) {
  const { data } = await api.get(`/materials/${id}`);
  return data;
}

/**
 * Get a material by slug. Includes detail-only fields and related products.
 * @param {string} slug
 * @returns {Promise<{ data: import('./types').Material }>}
 */
export async function getMaterialBySlug(slug) {
  const { data } = await api.get(`/materials/slug/${slug}`);
  return data;
}

/**
 * Build the spec-sheet download URL for a material.
 *
 * The endpoint streams the admin-uploaded PDF when one exists, otherwise it
 * generates a PDF on the fly from the material's data (never stored). Each
 * request yields a fresh document. Resources also expose this as
 * `material.spec_sheet_url` — use that when you already have the material.
 *
 * @param {number} id
 * @returns {string}
 */
export function getMaterialSpecSheetUrl(id) {
  return `${api.defaults.baseURL}/materials/${id}/spec-sheet`;
}
