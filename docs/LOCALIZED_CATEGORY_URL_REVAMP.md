# Localized Category URL Revamp

Shared frontend and backend reference for moving Businesslabels category URLs to live-style localized paths without breaking existing links, SEO, or product filtering.

## Goal

Use localized, human-readable category URLs in the browser while filtering products by stable backend category identity.

Public category URLs should be locale-specific:

```txt
EN: /en/product-category/labelprinters/color-labelprinters
NL: /product-categorie/labelprinters/kleuren-labelprinters-nl
```

API/product filtering should prefer stable category IDs:

```txt
/api/products?category_id=123&lang=nl
```

Avoid using `?lang=` as the public URL language mechanism. It is fine for API responses.

## Canonical URL Shape

English uses `/en` plus English route words:

```txt
/en/product-category/{parent-slug}/{child-slug}
```

Dutch is the default locale and has no locale prefix:

```txt
/product-categorie/{parent-slug}/{child-slug}
```

Printer category examples:

```txt
EN root: /en/product-category/labelprinters
NL root: /product-categorie/labelprinters

EN color: /en/product-category/labelprinters/color-labelprinters
NL color: /product-categorie/labelprinters/kleuren-labelprinters-nl

EN thermal: /en/product-category/labelprinters/thermal-labelprinters
NL thermal: /product-categorie/labelprinters/thermische-labelprinters-nl

EN starter kits: /en/product-category/labelprinters/starterkits-2
NL starter kits: /product-categorie/labelprinters/starterkits

EN consumables: /en/product-category/labelprinters/consumables
NL consumables: /product-categorie/labelprinters/verbruiksmaterialen-nl
```

Labels category examples:

```txt
NL root: /product-categorie/labels-en-tickets

NL inkjet: /product-categorie/labels-en-tickets/inkjet-printer-media
NL thermal direct: /product-categorie/labels-en-tickets/thermal-direct
NL thermal transfer: /product-categorie/labels-en-tickets/thermal-transfer

NL shipping labels application: /product-categorie/labels-en-tickets/thermal-direct/verzendetiketten
NL visitor badges application: /product-categorie/labels-en-tickets/inkjet-printer-media/bezoekersbadges
NL jewelry labels application: /product-categorie/labels-en-tickets/thermal-transfer/juweliersetiketten-thermische-overdracht-printer-media

NL applications group: /product-categorie/labels-en-tickets/toepassingen
EN applications group: /en/product-category/labels-en-tickets-en/applications
```

Accessories category examples:

```txt
NL root: /product-categorie/labelprinters/accessoires
EN root: /en/product-category/labelprinters/accessories-1

NL re/unwinders: /product-categorie/labelprinters/accessoires/re-unwinders-nl
EN re/unwinders: /en/product-category/labelprinters/accessories-1/re-unwinders

NL applicators: /product-categorie/labelprinters/accessoires/applicatoren
EN applicators: /en/product-category/labelprinters/accessories-1/applicators

NL dispensers: /product-categorie/labelprinters/accessoires/dispenser-nl
EN dispensers: /en/product-category/labelprinters/accessories-1/dispenser

NL applicators/dispensers group: /product-categorie/labelprinters/accessoires/applicatoren-en-dispensers
EN applicators/dispensers group: /en/product-category/labelprinters/accessories-1/applicators-and-dispensers

NL cutters: /product-categorie/labelprinters/accessoires/cutters
EN cutters: /en/product-category/labelprinters/accessories-1/cutters-en

NL WiFi/Bluetooth dongles: /product-categorie/labelprinters/accessoires/wifi-en-bluetooth-dongles
EN WiFi/Bluetooth dongles: /en/product-category/labelprinters/accessories-1/wifi-and-bluetooth-dongels

NL CW-C4000 accessories: /product-categorie/labelprinters/accessoires/cw-c4000-accessoires
EN CW-C4000 accessories: /en/product-category/labelprinters/accessories-1/cw-c4000-accessories

NL printer add-ons group: /product-categorie/labelprinters/accessoires/printer-add-ons
EN printer add-ons group: /en/product-category/labelprinters/accessories-1/printer-add-ons

NL miscellaneous: /product-categorie/labelprinters/accessoires/diversen
EN miscellaneous: /en/product-category/labelprinters/accessories-1/miscellaneous

NL cables: /product-categorie/labelprinters/accessoires/diversen/kabels
EN cables: /en/product-category/labelprinters/accessories-1/miscellaneous/cables

NL maintenance: /product-categorie/labelprinters/accessoires/diversen/onderhoud
EN maintenance: /en/product-category/labelprinters/accessories-1/miscellaneous/maintenance

NL other: /product-categorie/labelprinters/accessoires/diversen/overig
EN other: /en/product-category/labelprinters/accessories-1/miscellaneous/other
```

The `applicatoren-en-dispensers` / `applicators-and-dispensers` and `printer-add-ons` routes are frontend grouping pages. They are not duplicate backend categories. They resolve the real `accessoires` parent and render filtered subcategory cards:

```txt
Applicators en dispensers -> applicatoren, dispenser-nl
Printer add-ons -> cutters, wifi-en-bluetooth-dongles, cw-c4000-accessoires
```

Follow the project’s existing trailing-slash convention. Do not mix slash and non-slash variants.

## Core Principle

Slugs are for URLs. IDs are for filtering.

Each category should have one stable identity and localized presentation fields:

```json
{
  "id": 123,
  "name": {
    "nl": "Kleuren labelprinters",
    "en": "Color label printers"
  },
  "slug": {
    "nl": "kleuren-labelprinters-nl",
    "en": "color-labelprinters"
  }
}
```

The frontend should resolve a localized route slug to a category, then fetch products using `category_id`.

## Important Migration Contract

The English category URLs must be translations on the same existing Dutch categories. Do not create duplicate English categories.

Current state:

- Existing categories already have Dutch names/slugs.
- Frontend navigation already knows the Dutch slugs for the printer category pages.
- Backend will add English `name` and `slug` translations to those same category records.
- Product relationships must remain attached to the same category IDs.

Required backend behavior:

```txt
same category_id
same product/category relationship
localized name.nl + slug.nl
localized name.en + slug.en
```

Incorrect migration:

```txt
NL category id 123: kleuren-labelprinters-nl
EN category id 999: color-labelprinters
```

Correct migration:

```txt
category id 123:
  slug.nl = kleuren-labelprinters-nl
  slug.en = color-labelprinters
```

Known printer category mapping for the first rollout:

| Category key | Existing NL slug | New EN slug | NL URL | EN URL |
| --- | --- | --- | --- | --- |
| root | `labelprinters` | `labelprinters` | `/product-categorie/labelprinters` | `/en/product-category/labelprinters` |
| color | `kleuren-labelprinters-nl` | `color-labelprinters` | `/product-categorie/labelprinters/kleuren-labelprinters-nl` | `/en/product-category/labelprinters/color-labelprinters` |
| thermal | `thermische-labelprinters-nl` | `thermal-labelprinters` | `/product-categorie/labelprinters/thermische-labelprinters-nl` | `/en/product-category/labelprinters/thermal-labelprinters` |
| starterkits | `starterkits` | `starterkits-2` | `/product-categorie/labelprinters/starterkits` | `/en/product-category/labelprinters/starterkits-2` |
| consumables | `verbruiksmaterialen-nl` | `consumables` | `/product-categorie/labelprinters/verbruiksmaterialen-nl` | `/en/product-category/labelprinters/consumables` |

Until product filtering is fully category-ID based, slug filtering must remain locale-aware:

```txt
NL URL slug kleuren-labelprinters-nl -> filter with kleuren-labelprinters-nl
EN URL slug color-labelprinters -> filter with color-labelprinters

NL URL slug thermische-labelprinters-nl -> filter with thermische-labelprinters-nl
EN URL slug thermal-labelprinters -> filter with thermal-labelprinters

NL URL slug verbruiksmaterialen-nl -> filter with verbruiksmaterialen-nl
EN URL slug consumables -> filter with consumables
```

Known labels category mapping for the next rollout:

The labels navigation should follow the same pattern as `PrintersMenu`: a parent category URL plus nested child category URLs.

Current frontend hardcoded label links:

```txt
Header labels nav: /category/labels-en-tickets
LabelsMenu inkjet: /category/inkjet-printer-media
LabelsMenu thermal direct: /category/thermisch-directe-printer-media
LabelsMenu thermal transfer: /category/thermische-overdracht-printer-media
LabelsMenu applications/toepassingen: legacy application/category links
LabelsMenu CTA: /category/labels-en-tickets-en
```

Important:

- These should become nested live-style category URLs.
- The backend should add English `name` and `slug` translations to the same existing Dutch categories.
- Do not create duplicate English label categories.
- The current hardcoded slugs should be treated as legacy/compatibility inputs until backend category IDs and localized slugs are fully available.

Known label parent and menu category mapping:

| Category key | Current hardcoded slug | Canonical NL slug | New EN slug | Canonical NL URL | EN URL |
| --- | --- | --- | --- | --- | --- |
| labels-root | `labels-en-tickets` / `labels-en-tickets-en` | `labels-en-tickets` | `labels-en-tickets-en` | `/product-categorie/labels-en-tickets` | `/en/product-category/labels-en-tickets-en` |
| inkjet | `inkjet-printer-media` | `inkjet-printer-media` | `inkjet-printer-media` | `/product-categorie/labels-en-tickets/inkjet-printer-media` | `/en/product-category/labels-en-tickets-en/inkjet-printer-media` |
| thermal-direct | `thermisch-directe-printer-media` | `thermal-direct` | `thermal-direct-printer-media` | `/product-categorie/labels-en-tickets/thermal-direct` | `/en/product-category/labels-en-tickets-en/thermal-direct-printer-media` |
| thermal-transfer | `thermische-overdracht-printer-media` | `thermal-transfer` | `thermal-transfer-printer-media` | `/product-categorie/labels-en-tickets/thermal-transfer` | `/en/product-category/labels-en-tickets-en/thermal-transfer-printer-media` |
| applications group | legacy application/category links | `toepassingen` | `applications` | `/product-categorie/labels-en-tickets/toepassingen` | `/en/product-category/labels-en-tickets-en/applications` |

Known label application/toepassingen child mapping:

| Category key | Canonical NL slug | New EN slug | Canonical NL URL | EN URL |
| --- | --- | --- | --- | --- |
| shipping-labels | `verzendetiketten` | `shipping-labels` | `/product-categorie/labels-en-tickets/thermal-direct/verzendetiketten` | `/en/product-category/labels-en-tickets-en/thermal-direct-printer-media/shipping-labels` |
| visitor-badges | `bezoekersbadges` | `visitors-badges` | `/product-categorie/labels-en-tickets/inkjet-printer-media/bezoekersbadges` | `/en/product-category/labels-en-tickets-en/inkjet-printer-media/visitors-badges` |
| jewelry-labels | `juweliersetiketten-thermische-overdracht-printer-media` | public alias `jewellery-labels` | `/product-categorie/labels-en-tickets/thermal-transfer/juweliersetiketten-thermische-overdracht-printer-media` | `/en/product-category/jewellery-labels` |

The `toepassingen` / `applications` route is a frontend grouping page. It is not a duplicate backend category. It resolves the real `labels-en-tickets` parent and renders filtered application cards:

```txt
Applications -> visitors badges, shipping labels, jewellery labels
```

Until product filtering is fully category-ID based, slug filtering must remain locale-aware and migration-aware:

```txt
Legacy NL URL slug thermisch-directe-printer-media -> may need redirect/alias to canonical NL slug thermal-direct
Legacy NL URL slug thermische-overdracht-printer-media -> may need redirect/alias to canonical NL slug thermal-transfer
Canonical NL URL slug thermal-direct -> filter with the backend NL slug for that same category
Canonical NL URL slug thermal-transfer -> filter with the backend NL slug for that same category
Canonical application leaf URLs should resolve by the full parent path because leaf slugs can be reused across branches.
```

Once backend category resolution is available, the frontend should not need to know whether the old slug was `thermisch-directe-printer-media` or the live slug is `thermal-direct`. It should resolve the current URL slug to the same category ID and then fetch by `category_id`.

## NL-Ready URL Rollout

The NL URL revamp can be implemented before English category translations are complete, because the needed NL slugs are already known.

For this interim phase:

- Use the live-style NL URLs below.
- Keep product filtering locale-aware with the NL slug.
- Add redirects from old `/category/...` URLs to the new `/product-categorie/...` URLs.
- Do not change EN category URLs to final localized category pages until backend EN `name` and `slug` translations are added.
- Keep route helpers centralized so EN can be added later without touching every component.

### NL Printer Pages

| Page | Filter slug | New NL URL | Legacy URL |
| --- | --- | --- | --- |
| Label printers root | `labelprinters` | `/product-categorie/labelprinters` | `/printers` |
| Color label printers | `kleuren-labelprinters-nl` | `/product-categorie/labelprinters/kleuren-labelprinters-nl` | `/category/kleuren-labelprinters-nl` |
| Thermal label printers | `thermische-labelprinters-nl` | `/product-categorie/labelprinters/thermische-labelprinters-nl` | `/category/thermische-labelprinters-nl` |
| Starter kits | `starterkits` | `/product-categorie/labelprinters/starterkits` | `/category/starterkits` |
| Consumables | `verbruiksmaterialen-nl` | `/product-categorie/labelprinters/verbruiksmaterialen-nl` | `/category/verbruiksmaterialen-nl` |

### NL Labels Menu Pages

| Page | Filter slug | New NL URL | Legacy URL |
| --- | --- | --- | --- |
| Labels and tickets root | `labels-en-tickets` | `/product-categorie/labels-en-tickets` | `/category/labels-en-tickets` |
| Inkjet printer media | `inkjet-printer-media` | `/product-categorie/labels-en-tickets/inkjet-printer-media` | `/category/inkjet-printer-media` |
| Thermal direct | `thermal-direct` | `/product-categorie/labels-en-tickets/thermal-direct` | `/category/thermisch-directe-printer-media` |
| Thermal transfer | `thermal-transfer` | `/product-categorie/labels-en-tickets/thermal-transfer` | `/category/thermische-overdracht-printer-media` |
| Shipping labels application | `verzendetiketten` | `/product-categorie/labels-en-tickets/thermal-direct/verzendetiketten` | legacy application link |
| Visitor badges application | `bezoekersbadges` | `/product-categorie/labels-en-tickets/inkjet-printer-media/bezoekersbadges` | legacy application link |
| Jewelry labels application | `juweliersetiketten-thermische-overdracht-printer-media` | `/product-categorie/labels-en-tickets/thermal-transfer/juweliersetiketten-thermische-overdracht-printer-media` | legacy application link |

### NL Labels Application Pages

These pages are expected from the Toepassingen/application column and subcategory navigation.

| Page | Filter slug | New NL URL |
| --- | --- | --- |
| Shipping labels | `verzendetiketten` | `/product-categorie/labels-en-tickets/thermal-direct/verzendetiketten` |
| Visitor badges | `bezoekersbadges` | `/product-categorie/labels-en-tickets/inkjet-printer-media/bezoekersbadges` |
| Jewelry labels | `juweliersetiketten-thermische-overdracht-printer-media` | `/product-categorie/labels-en-tickets/thermal-transfer/juweliersetiketten-thermische-overdracht-printer-media` |

### NL-First Implementation Notes

For NL, the frontend can route and filter directly with the known NL/live slug:

```txt
/product-categorie/labels-en-tickets/thermal-direct
-> locale=nl
-> filter category slug thermal-direct, or resolve to category_id when available
```

For legacy NL slugs that differ from the live URL slug, support redirects or aliases:

```txt
/category/thermisch-directe-printer-media
-> /product-categorie/labels-en-tickets/thermal-direct

/category/thermische-overdracht-printer-media
-> /product-categorie/labels-en-tickets/thermal-transfer

Legacy application links
-> corresponding nested `/product-categorie/labels-en-tickets/{parent}/{application}` URL
```

Once backend category resolution by `locale + slug` exists, the frontend should resolve the new NL slug to the existing category ID and fetch products by `category_id`.

## Backend Requirements

### Category API

The category tree endpoint should expose localized names and slugs for every category:

```json
{
  "id": 123,
  "name": {
    "nl": "Kleuren labelprinters",
    "en": "Color label printers"
  },
  "slug": {
    "nl": "kleuren-labelprinters-nl",
    "en": "color-labelprinters"
  },
  "parent_id": 45,
  "children": []
}
```

If the API currently resolves `name` and `slug` to a single string based on `?lang=`, add either:

- full localized fields such as `name_translations` and `slug_translations`, or
- a dedicated category resolve endpoint.

Recommended resolve endpoint:

```txt
GET /api/categories/resolve?locale=nl&slug=kleuren-labelprinters-nl
GET /api/categories/resolve?locale=en&slug=color-labelprinters
```

Recommended response:

```json
{
  "id": 123,
  "name": {
    "nl": "Kleuren labelprinters",
    "en": "Color label printers"
  },
  "slug": {
    "nl": "kleuren-labelprinters-nl",
    "en": "color-labelprinters"
  },
  "canonical_url": {
    "nl": "/product-categorie/labelprinters/kleuren-labelprinters-nl",
    "en": "/en/product-category/labelprinters/color-labelprinters"
  }
}
```

### Product Listing API

Product listing endpoints should support category filtering by ID:

```txt
GET /api/products?category_id=123&lang=nl
```

Keep slug filtering temporarily for backward compatibility:

```txt
GET /api/products?category=kleuren-labelprinters-nl&lang=nl
GET /api/products?category=color-labelprinters&lang=en
```

But new frontend work should prefer:

```txt
category_id=123
```

### Scout / Elasticsearch Indexing

Yes, update Scout indexing.

Every searchable product/printer document should include stable category IDs and localized category metadata.

Minimum recommended fields:

```php
[
    'category_ids' => [123, 456],
    'category_slugs_nl' => ['labelprinters', 'kleuren-labelprinters-nl'],
    'category_slugs_en' => ['labelprinters', 'color-labelprinters'],
    'category_titles_nl' => ['Labelprinters', 'Kleuren labelprinters'],
    'category_titles_en' => ['Label printers', 'Color label printers'],
]
```

Preferred product filtering:

```txt
filter category_ids contains 123
```

Fallback filtering while migrating:

```txt
locale=nl -> filter category_slugs_nl contains kleuren-labelprinters-nl
locale=en -> filter category_slugs_en contains color-labelprinters
```

Example Laravel Scout `toSearchableArray()` shape:

```php
public function toSearchableArray(): array
{
    $categories = $this->categories;

    return [
        'id' => $this->id,
        'name' => [
            'nl' => $this->getTranslation('name', 'nl'),
            'en' => $this->getTranslation('name', 'en'),
        ],
        'category_ids' => $categories->pluck('id')->values()->all(),
        'category_slugs_nl' => $categories
            ->map(fn ($category) => $category->getTranslation('slug', 'nl'))
            ->filter()
            ->values()
            ->all(),
        'category_slugs_en' => $categories
            ->map(fn ($category) => $category->getTranslation('slug', 'en'))
            ->filter()
            ->values()
            ->all(),
        'category_titles_nl' => $categories
            ->map(fn ($category) => $category->getTranslation('name', 'nl'))
            ->filter()
            ->values()
            ->all(),
        'category_titles_en' => $categories
            ->map(fn ($category) => $category->getTranslation('name', 'en'))
            ->filter()
            ->values()
            ->all(),
    ];
}
```

After changing indexed fields, reimport affected searchable models:

```shell
php artisan scout:import "App\\Models\\Product"
php artisan scout:import "App\\Models\\Post"
```

Use the actual model classes for products/printers in the backend.

## Frontend Requirements

### Route Support

The frontend should support localized nested category route entry points:

```txt
/en/product-category/[...slug]
/product-categorie/[...slug]
```

When resolving a category page:

1. Detect locale from URL/cookie.
2. Read the last slug segment from the route.
3. Resolve category by `locale + slug`.
4. Use resolved `category.id` for product fetching.
5. Render localized title, breadcrumbs, subcategories, and filters.

### Navigation Links

Do not scatter hardcoded category URLs throughout components.

Use a centralized route helper/map:

```ts
getPrinterCategoryPath(locale, categoryKey)
```

Example keys:

```txt
root
color
thermal
starterkits
consumables
```

The helper should produce:

```txt
getPrinterCategoryPath('en', 'color')
-> /en/product-category/labelprinters/color-labelprinters

getPrinterCategoryPath('nl', 'color')
-> /product-categorie/labelprinters/kleuren-labelprinters-nl
```

### Product Fetching

Short-term frontend fallback:

```txt
EN category page -> category=color-labelprinters&lang=en
NL category page -> category=kleuren-labelprinters-nl&lang=nl
```

Long-term preferred frontend request:

```txt
category_id=123&lang=en
category_id=123&lang=nl
```

Do not use one locale’s slug to fetch the other locale’s products.

### Language Switcher

The language switcher should switch by category identity, not by string replacement.

Correct:

```txt
/product-categorie/labelprinters/kleuren-labelprinters-nl
-> /en/product-category/labelprinters/color-labelprinters

/en/product-category/labelprinters/color-labelprinters
-> /product-categorie/labelprinters/kleuren-labelprinters-nl
```

Avoid:

```txt
/en + current Dutch path
string replace "product-categorie" only
```

The switcher needs either:

- category `id` plus localized slugs from the resolved category response, or
- a central route map for static categories until backend data is complete.

## Redirects and Backward Compatibility

Old URLs must keep working, but navigation should use the new URLs directly.

Redirect old printer/category URLs:

```txt
/printers
/category/kleuren-labelprinters-nl
/category/thermische-labelprinters-nl
/category/starterkits
/category/verbruiksmaterialen-nl
```

To canonical localized URLs:

```txt
/product-categorie/labelprinters
/product-categorie/labelprinters/kleuren-labelprinters-nl
/product-categorie/labelprinters/thermische-labelprinters-nl
/product-categorie/labelprinters/starterkits
/product-categorie/labelprinters/verbruiksmaterialen-nl
```

For English users or `/en/...` legacy requests, redirect to:

```txt
/en/product-category/labelprinters
/en/product-category/labelprinters/color-labelprinters
/en/product-category/labelprinters/thermal-labelprinters
/en/product-category/labelprinters/starterkits-2
/en/product-category/labelprinters/consumables
```

Use permanent redirects once verified in production.

## SEO Requirements

Each category page should generate:

- canonical URL for the current locale
- `hreflang` alternates for `nl` and `en`
- optionally `x-default`

Example:

```txt
canonical:
/en/product-category/labelprinters/color-labelprinters

alternate:
en -> /en/product-category/labelprinters/color-labelprinters
nl -> /product-categorie/labelprinters/kleuren-labelprinters-nl
```

The sitemap should list canonical localized URLs, not legacy `/category/...` or `/printers` URLs.

## Rollout Plan

1. Add localized `slug` and `name` fields to categories in backend.
2. Add category resolve support by `locale + slug`.
3. Add `category_ids`, `category_slugs_nl`, and `category_slugs_en` to Scout documents.
4. Reindex products/printers.
5. Update frontend routes and navigation to localized live URLs.
6. Update frontend product fetching to prefer `category_id`.
7. Add 301 redirects from old URLs.
8. Add canonical and `hreflang` metadata.
9. Update sitemap to canonical localized URLs.
10. Monitor old URL hits and product listing results.

## Acceptance Checklist

- EN category URL renders products using EN slug or category ID.
- NL category URL renders products using NL slug or category ID.
- Language switcher changes the full localized URL.
- Header desktop nav uses new URLs.
- Header mobile nav uses new URLs.
- Dropdown CTA uses new URLs.
- Old URLs redirect to canonical live URLs.
- No accidental double slashes in EN URLs.
- Sitemap excludes legacy printer archive URLs.
- Canonical and alternate URLs match localized slugs.
- Scout index contains category IDs and localized category slugs.
- Product filtering works after reindex.
