export const ROUTES = {
  home: '/',
  products: '/products',
  productDetail: (type, slug) => `/products/${type}/${slug}`,
  categories: '/categories',
  categoryDetail: (slug) => `/categories/${slug}`,
  login: '/login',
  register: '/register',
  account: '/account',
  orders: '/account/orders',
  favorites: '/account/favorites',
  cart: '/cart',
  checkout: '/checkout',
  checkoutResult: '/checkout/result',
  search: '/search',
  about: '/about',
  contact: '/contact',
  productFilters: '/filters'
};
