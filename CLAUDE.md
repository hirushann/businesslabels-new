# CLAUDE.md

## Project

Businesslabels — Next.js e-commerce frontend for Epson ColorWorks label printers, accessories, and label rolls. Consumes a Laravel API backend. Multi-locale (en, nl), currency EUR.

## Commands

- `npm run dev` / `npm run build` / `npm run lint` / `npm run start`

## Stack

Next.js 16 (App Router), React 19, JavaScript with `.jsx` extensions (no TypeScript), Tailwind CSS v4 (`@theme` in `globals.css`, no config file). No test framework configured.

## Architecture

Single layout (`Header` + `Footer` in `layout.jsx`). Homepage (`src/app/page.jsx`) composes section components:
`HeroSection → StatsBar → CategorySection → WhyChooseUs → PopularProducts → FeatureSections → ReviewsSection → CTABanner`

All components flat in `src/components/`. Server components by default; `'use client'` only when needed.

## Conventions

- Segoe UI via local `@font-face` (`public/fonts/`), Inter fallback from Google Fonts
- Inline SVGs for icons, no icon library
- `next/image` with `placehold.co` remote pattern; static assets in `public/`
- Content sections: `max-w-[1440px] mx-auto`
- Use `.jsx` for all React component files, `.js` for non-JSX modules (config, utils)
- Product types are `"simple"` or `"variable"`, never generic string
- Centralized routes in `src/config/routes.js` — use `ROUTES` constants instead of hardcoding paths
- Format prices: `Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })`
- Multi-locale fields (`name`, `slug`, `title`, `description`, `excerpt`) return `{ en, nl }` objects — select by active locale

## API Client

Base URL via `BBNL_API_BASE_URL`. Auth: `Authorization: Bearer <token>` (Laravel Passport).

All API calls go through the typed client layer in `src/lib/api/`:

```
src/lib/api/
├── index.js       — barrel export (import { listProducts } from '@/lib/api')
├── client.js      — axios instance, setAuthToken/clearAuthToken
├── types.js       — JSDoc type definitions for all API response shapes
├── auth.js        — login
├── products.js    — listProducts, getProduct, getProductBySlug
├── categories.js  — listCategories
├── filters.js     — getFilters
├── orders.js      — listOrders, getOrder, createOrder, updateOrder, deleteOrder
├── profile.js     — getProfile, updateProfile, updatePassword
├── addresses.js   — listMyAddresses, listCustomerAddresses, createAddress, updateAddress, deleteAddress
├── favorites.js   — favorite products + printers (list, add, remove, check)
└── coupons.js     — validateCoupon
```

When consuming the API from pages/components, always import from `@/lib/api` — never call axios directly.

### Endpoint Reference

**Public:**
- `GET /api/products` — paginated list, query params for filter/sort
- `GET /api/products/{simple|variable}/slug/{slug}` — by slug
- `GET /api/products/{simple|variable}/{id}` — by ID
- `GET /api/categories` — category tree grouped by taxonomy
- `GET /api/filters` — filter options (types, sort, categories, meta)
- `GET /api/coupons/{code}?cart_total=&email=` — validate coupon (422 if invalid)

**Authenticated:**
- `GET|PUT /api/user/profile` — profile
- `PUT /api/user/profile/password` — change password
- `GET /api/user/addresses` — saved addresses
- `CRUD /api/customers/{id}/addresses/{id}`
- `CRUD /api/orders` — orders
- `GET /api/user/favorite-products` — list favorites
- `POST|DEL /api/user/favorite-products/{simple|variable}/{id}`
- `GET /api/user/favorite-products/{simple|variable}/{id}/check`
- `GET /api/user/favorite-printers`
- `POST|DEL|GET /api/user/favorite-printers/{id}[/check]`

### Response types

All response shapes are defined as JSDoc typedefs in `src/lib/api/types.js`. See that file for the canonical type definitions.

## Cross-Repo API Sync Protocol

Backend (Laravel admin + API) lives at `/Users/hasanaftab/Desktop/Projects/businessLabels`.

When an API endpoint changes on the backend, the corresponding files here must be updated:

1. **New/changed route** → update function in `src/lib/api/{domain}.js`, re-export from `index.js`
2. **Changed response shape** → update JSDoc types in `src/lib/api/types.js`
3. **Changed validation** → update JSDoc param types on the API function
4. **Removed endpoint** → remove function, export, and unused types

Each API module file has a `@see` comment pointing to its Laravel controller and resource for traceability.