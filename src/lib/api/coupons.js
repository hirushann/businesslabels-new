/**
 * Coupons API
 * @see Laravel: App\Http\Controllers\API\CouponController
 * @see Laravel: App\Http\Resources\CouponResource
 */

import api from './client';

/**
 * Validate and retrieve a coupon by code.
 * @param {string} code
 * @param {{ cart_total?: number, email?: string }} [params]
 * @returns {Promise<{ data: import('./types').Coupon }>}
 */
export async function validateCoupon(code, params = {}) {
  const { data } = await api.get(`/coupons/${code}`, { params });
  return data;
}
