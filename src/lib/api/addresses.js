/**
 * Customer Addresses API (authenticated)
 * @see Laravel: App\Http\Controllers\API\CustomerAddressController
 * @see Laravel: App\Http\Resources\CustomerAddressResource
 */

import api from './client';

/**
 * List the authenticated user's addresses.
 * @param {{ type?: 'shipping'|'billing' }} [params]
 * @returns {Promise<{ data: import('./types').CustomerAddress[] }>}
 */
export async function listMyAddresses(params = {}) {
  const { data } = await api.get('/user/addresses', { params });
  return data;
}

/**
 * List addresses for a specific customer.
 * @param {number} customerId
 * @param {{ type?: 'shipping'|'billing' }} [params]
 * @returns {Promise<{ data: import('./types').CustomerAddress[] }>}
 */
export async function listCustomerAddresses(customerId, params = {}) {
  const { data } = await api.get(`/customers/${customerId}/addresses`, { params });
  return data;
}

/**
 * Create a new address for a customer.
 * @param {number} customerId
 * @param {Omit<import('./types').CustomerAddress, 'id'|'created_at'|'updated_at'>} addressData
 * @returns {Promise<{ data: import('./types').CustomerAddress }>}
 */
export async function createAddress(customerId, addressData) {
  const { data } = await api.post(`/customers/${customerId}/addresses`, addressData);
  return data;
}

/**
 * Update an address.
 * @param {number} customerId
 * @param {number} addressId
 * @param {Partial<import('./types').CustomerAddress>} addressData
 * @returns {Promise<{ data: import('./types').CustomerAddress }>}
 */
export async function updateAddress(customerId, addressId, addressData) {
  const { data } = await api.put(`/customers/${customerId}/addresses/${addressId}`, addressData);
  return data;
}

/**
 * Delete an address.
 * @param {number} customerId
 * @param {number} addressId
 * @returns {Promise<void>}
 */
export async function deleteAddress(customerId, addressId) {
  await api.delete(`/customers/${customerId}/addresses/${addressId}`);
}
