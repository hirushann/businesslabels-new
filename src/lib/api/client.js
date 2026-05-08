/**
 * API Client — thin wrapper around the axios instance.
 *
 * All domain-specific modules (products.js, orders.js, etc.) import from here
 * so there is a single place to configure headers, interceptors, and base URL.
 */

import api from '../axios';

/**
 * Attach a Bearer token to all future requests.
 * @param {string} token
 */
export function setAuthToken(token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/**
 * Remove the Bearer token.
 */
export function clearAuthToken() {
  delete api.defaults.headers.common['Authorization'];
}

export default api;
