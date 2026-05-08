/**
 * Customer Reviews API
 * @see Laravel: App\Http\Controllers\API\CustomerReviewController
 * @see Laravel: App\Http\Resources\Api\CustomerReviewResource
 */

import api from './client';

/**
 * List approved customer reviews. Public endpoint.
 *
 * Filter options:
 *  - product_id + product_type ('simple'|'variable') → reviews for a specific product
 *  - site_wide=true → reviews not tied to any product
 *  - min_rating (1-5)
 *
 * @param {{ per_page?: number, product_id?: number, product_type?: 'simple'|'variable', site_wide?: boolean, min_rating?: number, page?: number }} [params]
 * @returns {Promise<import('./types').PaginatedResponse<import('./types').CustomerReview>>}
 */
export async function listReviews(params = {}) {
  const { data } = await api.get('/reviews', { params });
  return data;
}

/**
 * Submit a new review. Created with status=pending; admin must approve before it appears in listReviews.
 * Works for both authenticated and guest submissions; if a token is set, the review will be associated with the user.
 *
 * Server-side guards:
 *  - Rate limited to 5 requests/minute per user (or per IP if guest). Exceeding returns 429.
 *  - Duplicate guard: rejects (422) if the same user / email / IP has already submitted a review
 *    for the same product (or site-wide) within the last 24 hours.
 *
 * @param {import('./types').CreateReviewRequest} payload
 * @returns {Promise<{ message: string }>}
 */
export async function createReview(payload) {
  const { data } = await api.post('/reviews', payload);
  return data;
}
