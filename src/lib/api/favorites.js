/**
 * Favorites API (authenticated)
 * @see Laravel: App\Http\Controllers\API\FavoriteProductController
 * @see Laravel: App\Http\Controllers\API\FavoritePrinterController
 */

import api from './client';

// ─── Favorite Products ───────────────────────────────────────

/**
 * List favorite products.
 * @returns {Promise<{ data: import('./types').Product[] }>}
 */
export async function listFavoriteProducts() {
  const { data } = await api.get('/user/favorite-products');
  return data;
}

/**
 * Add a product to favorites.
 * @param {'simple'|'variable'} type
 * @param {number} id
 * @returns {Promise<{ message: string }>}
 */
export async function addFavoriteProduct(type, id) {
  const { data } = await api.post(`/user/favorite-products/${type}/${id}`);
  return data;
}

/**
 * Remove a product from favorites.
 * @param {'simple'|'variable'} type
 * @param {number} id
 * @returns {Promise<{ message: string }>}
 */
export async function removeFavoriteProduct(type, id) {
  const { data } = await api.delete(`/user/favorite-products/${type}/${id}`);
  return data;
}

/**
 * Check if a product is favorited.
 * @param {'simple'|'variable'} type
 * @param {number} id
 * @returns {Promise<{ is_favorite: boolean }>}
 */
export async function checkFavoriteProduct(type, id) {
  const { data } = await api.get(`/user/favorite-products/${type}/${id}/check`);
  return data;
}

// ─── Favorite Printers ───────────────────────────────────────

/**
 * List favorite printers.
 * @returns {Promise<{ data: import('./types').Printer[] }>}
 */
export async function listFavoritePrinters() {
  const { data } = await api.get('/user/favorite-printers');
  return data;
}

/**
 * Add a printer to favorites.
 * @param {number} id
 * @returns {Promise<{ message: string }>}
 */
export async function addFavoritePrinter(id) {
  const { data } = await api.post(`/user/favorite-printers/${id}`);
  return data;
}

/**
 * Remove a printer from favorites.
 * @param {number} id
 * @returns {Promise<{ message: string }>}
 */
export async function removeFavoritePrinter(id) {
  const { data } = await api.delete(`/user/favorite-printers/${id}`);
  return data;
}

/**
 * Check if a printer is favorited.
 * @param {number} id
 * @returns {Promise<{ is_favorite: boolean }>}
 */
export async function checkFavoritePrinter(id) {
  const { data } = await api.get(`/user/favorite-printers/${id}/check`);
  return data;
}
