/**
 * Profile API (authenticated)
 * @see Laravel: App\Http\Controllers\API\ProfileController
 * @see Laravel: App\Http\Resources\Api\ProfileResource
 */

import api from './client';

/**
 * Get the authenticated user's profile.
 * @returns {Promise<{ data: import('./types').Profile }>}
 */
export async function getProfile() {
  const { data } = await api.get('/user/profile');
  return data;
}

/**
 * Update the authenticated user's profile.
 * @param {import('./types').UpdateProfileRequest} profileData
 * @returns {Promise<{ data: import('./types').Profile }>}
 */
export async function updateProfile(profileData) {
  const { data } = await api.put('/user/profile', profileData);
  return data;
}

/**
 * Update the authenticated user's password.
 * @param {import('./types').UpdatePasswordRequest} passwordData
 * @returns {Promise<{ message: string }>}
 */
export async function updatePassword(passwordData) {
  const { data } = await api.put('/user/profile/password', passwordData);
  return data;
}
