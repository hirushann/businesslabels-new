# CLAUDE.md

## Project

BusinessLabels — Next.js e-commerce frontend for Epson ColorWorks label printers, accessories, and label rolls. Consumes a Laravel API backend. Multi-locale (en, nl), currency EUR.

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

## API

Base URL via `NEXT_PUBLIC_API_URL`. Auth: `Authorization: Bearer <token>` (Laravel Passport).

### Auth

`POST /api/login` — body: `{ username, password }` → `{ access_token, token_type, user }`

### Public

GET /api/products                         Paginated list, query params for filter/sort
GET /api/products/{simple|variable}/slug/{slug}  By slug
GET /api/products/{simple|variable}/{id}         By ID
GET /api/categories                       Category tree grouped by taxonomy
GET /api/filters                          Filter options (types, sort, categories, meta)
GET /api/coupons/{code}?cart_total=&email= Validate coupon (422 if invalid)

### Authenticated

GET|PUT  /api/user/profile                Profile
PUT      /api/user/profile/password       Change password
GET      /api/user/addresses              Saved addresses
CRUD     /api/customers/{id}/addresses/{id}
CRUD     /api/orders                      Orders
GET      /api/user/favorite-products      List favorites
POST|DEL /api/user/favorite-products/{simple|variable}/{id}
GET      /api/user/favorite-products/{simple|variable}/{id}/check
GET      /api/user/favorite-printers
POST|DEL|GET /api/user/favorite-printers/{id}[/check]

### Response Shapes

**Product (list):**
`{ id, type, title, name:{en,nl}, slug:{en,nl}, sku, price, original_price, stock, in_stock, main_image, material:{id,title,slug,category}, categories:[{id,name,slug}], meta:{} }`

**Product (detail)** — list fields plus:
`{ description:{en,nl}, content:{en,nl}, product_information, product_template, dimensions:{weight,width,height,length}, gallery_images:[{id,url}], variants:[{id,name,sku,price,original_price,stock,in_stock,attributes:{}}] }`

**Category tree:** `{ id, name:{en,nl}, slug, categories:[{id, name, slug, children:[...]}] }`

**Order:** `{ id, number, status, total, items:[{product_id,name,price,quantity,total}], billing_address:{firstname,lastname,address,city,postalcode,country_id}, shipping_address:{name,address,city,postalcode,country_id} }`

**Profile:** `{ id, name, email, phone, is_active, type }`

**Address:** `{ id, type, firstname, lastname, company_name, address, address2, city, postalcode, country_id, phone, email }`

**Pagination:** `{ data:[...], meta:{ current_page, last_page, per_page, total } }`

## Related

Backend (Laravel admin + API) is a separate repo. API changes are made there. Ask if you need endpoint behavior details — do not guess.