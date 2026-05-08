/**
 * Orders API (authenticated)
 * @see Laravel: App\Http\Controllers\API\OrderController
 * @see Laravel: App\Http\Resources\OrderResource
 */

import api from './client';

/**
 * List current user's orders.
 * @returns {Promise<{ data: import('./types').Order[] }>}
 */
export async function listOrders() {
  const { data } = await api.get('/orders');
  return data;
}

/**
 * Get a single order by ID.
 * @param {number} orderId
 * @returns {Promise<{ data: import('./types').Order }>}
 */
export async function getOrder(orderId) {
  const { data } = await api.get(`/orders/${orderId}`);
  return data;
}

/**
 * Create a new order.
 * @param {Object} orderData - See StoreOrderRequest for fields
 * @param {string} orderData.status
 * @param {Array<{ product_id: number, name: string, price: number, quantity: number }>} orderData.order_items
 * @param {string} [orderData.billing_firstname]
 * @param {string} [orderData.billing_address]
 * @param {string} [orderData.billing_city]
 * @param {number} [orderData.billing_address_id] - Use saved address instead of raw fields
 * @param {string} [orderData.shipping_name]
 * @param {string} [orderData.shipping_address]
 * @param {number} [orderData.shipping_address_id] - Use saved address instead of raw fields
 * @returns {Promise<{ data: import('./types').Order }>}
 */
export async function createOrder(orderData) {
  const { data } = await api.post('/orders', orderData);
  return data;
}

/**
 * Update an order.
 * @param {number} orderId
 * @param {Object} orderData
 * @returns {Promise<{ data: import('./types').Order }>}
 */
export async function updateOrder(orderId, orderData) {
  const { data } = await api.put(`/orders/${orderId}`, orderData);
  return data;
}

/**
 * Delete an order.
 * @param {number} orderId
 * @returns {Promise<void>}
 */
export async function deleteOrder(orderId) {
  await api.delete(`/orders/${orderId}`);
}
