/**
 * Auth API
 * @see Laravel: App\Http\Controllers\API\AuthController
 */

import api from './client';

/**
 * @param {{ username: string, password: string }} credentials
 * @returns {Promise<import('./types').LoginResponse>}
 */
export async function login(credentials) {
  const { data } = await api.post('/login', credentials);
  return data;
}
