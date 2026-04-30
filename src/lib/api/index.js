/**
 * API Client — barrel export.
 *
 * Usage:
 *   import { listProducts, getProduct } from '@/lib/api';
 *   import { login } from '@/lib/api';
 *   import { setAuthToken } from '@/lib/api';
 */

export { setAuthToken, clearAuthToken } from './client';
export { login } from './auth';
export { listProducts, getProduct, getProductBySlug, getWarrantyOptions } from './products';
export { listCategories } from './categories';
export { getFilters } from './filters';
export { listOrders, getOrder, createOrder, updateOrder, deleteOrder } from './orders';
export { getProfile, updateProfile, updatePassword } from './profile';
export { listMyAddresses, listCustomerAddresses, createAddress, updateAddress, deleteAddress } from './addresses';
export {
  listFavoriteProducts, addFavoriteProduct, removeFavoriteProduct, checkFavoriteProduct,
  listFavoritePrinters, addFavoritePrinter, removeFavoritePrinter, checkFavoritePrinter,
} from './favorites';
export { validateCoupon } from './coupons';
export { listReviews, createReview } from './reviews';
