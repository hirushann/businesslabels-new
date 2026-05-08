# Scout Catalog Search Indexing - Frontend Reference

**Target Audience**: Frontend Developers  
**Last Updated**: May 7, 2026  
**Base URL**: `http://businesslabels.test/api`  
**Search Stack**: Laravel Scout 11 + Elasticsearch via Explorer  

## Overview

The product catalog search is powered by Laravel Scout, but the public catalog listing uses a custom Elasticsearch gateway for richer filtering, sorting, and aggregation support.

Current wiring note: the application already contains `ProductCatalogService`, which builds the full Elasticsearch query/filter contract documented below. At the time of writing, `ProductController@index` is not calling that service; it returns a database-backed merged simple/variable product list with `per_page` only. The simple `/api/search` endpoint does use Scout directly, but only searches `Product`.

There are two searchable product indexes:

| Product type | Model | Scout index |
| --- | --- | --- |
| `simple` | `App\Models\Product` | `{SCOUT_PREFIX}catalog_products_simple` |
| `variable` | `App\Models\MasterProduct` | `{SCOUT_PREFIX}catalog_products_variable` |

In the current test/config examples, `SCOUT_PREFIX=business_labels_`, so the concrete indexes are:

- `business_labels_catalog_products_simple`
- `business_labels_catalog_products_variable`

Only products with `state=active` are returned by the public catalog search API.

## Currently Wired Frontend Endpoints

### Product Listing

`GET /api/products`

Current controller behavior:

- Returns simple `Product` records and variable `MasterProduct` records merged together.
- Supports `per_page`.
- Does not currently apply `search`, category, material, meta, stock, price, or sort filters.
- Hydrates responses through `ProductResource`.

Example:

```http
GET /api/products?per_page=24
```

### Simple Scout Search

`GET /api/search?query=zebra`

This endpoint uses Scout directly:

```php
Product::search($query)
    ->query(fn ($builder) => $builder->with('activeWarrantyOptions')->withCount('activeWarrantyOptions'))
    ->paginate(15)
```

Frontend limitation: this endpoint searches simple products only and does not expose the full catalog filter/sort contract.

Use it for basic keyword search only. For faceted catalog pages, wire `ProductController@index` to `ProductCatalogService::paginate()` or expose a dedicated endpoint backed by that service.

## Elastic Catalog Service Contract

### Catalog Listing

Target endpoint: `GET /api/products`

This is the intended contract for product listing pages, category pages, search result pages, and filtered catalog screens when backed by `ProductCatalogService`.

Example:

```http
GET /api/products?search=zebra&category=labels&brand=zebra&material_id=12&width_min=40&width_max=60&sort=price_desc&page=1&per_page=24
```

Supported query parameters:

| Parameter | Type | Description |
| --- | --- | --- |
| `search` | string | Full-text search term. Searches article number, title, name, slug, SKU, variant SKUs, material, brand, excerpt, description, content, and product information. |
| `type` / `product_type` | `simple`, `variable` | Restricts results to one product index. Omit to search both. |
| `page` | integer | Page number. |
| `per_page` | integer | Results per page. Backend normalizes this. |
| `sort` | string | `latest`, `oldest`, `title_asc`, `title_desc`, `price_asc`, `price_desc`. Default is latest. |
| `id` | integer or array | Exact product ID filter. |
| `slug` | string or array | Exact slug filter. |
| `article_number` | string or array | Exact article number filter. |
| `price_min` | number | Minimum product price. |
| `price_max` | number | Maximum product price. |
| `in_stock` | boolean-like | `true` returns stock greater than zero, `false` returns stock less than or equal to zero. |
| `material_id` | integer or array | Filter by material ID. |
| `material_category` | string or array | Filter by material category slug. |
| `material_category_id` | integer or array | Filter by material category taxon ID. |
| `category` / `category_slug` | string or array | Filter by product category slug. Ancestor category slugs are indexed too. |
| `category_id` | integer or array | Filter by product category taxon ID. Ancestor category IDs are indexed too. |

Meta filter query parameters:

| UI filter | Query key | Index field | Type |
| --- | --- | --- | --- |
| Finishing | `finishing` | `finishing.keyword` | Multi-select |
| Adhesive | `adhesive` or `glue` | `glue.keyword` | Multi-select |
| Brand | `brand` | `brand.keyword` | Multi-select |
| Material Code | `material_code` | `material_code.keyword` | Multi-select |
| Print Method | `print_method` or `druktype` | `druktype.keyword` | Multi-select |
| Printer Type | `printer_type` | `printer_type.keyword` | Multi-select |
| Width | `width`, `width_min`, `width_max` | `meta_width.keyword`, `meta_width_numeric` | Exact or range |
| Height | `height`, `height_min`, `height_max` | `meta_height.keyword`, `meta_height_numeric` | Exact or range |
| Core | `core`, `core_min`, `core_max` | `kern.keyword`, `kern_numeric` | Exact or range |
| Outer Diameter | `outer_diameter`, `outer_diameter_min`, `outer_diameter_max` | `buitendia.keyword`, `buitendia_numeric` | Exact or range |
| Detection | `detectie` | `detectie.keyword` | Multi-select |
| Marks | `merken` | `merken.keyword` | Multi-select |

The response is a standard Laravel API resource paginator:

```json
{
  "data": [
    {
      "id": 123,
      "type": "simple",
      "title": "Zebra Label",
      "name": "Zebra Label",
      "slug": "zebra-label",
      "sku": "ZEB-001",
      "article_number": "ART-001",
      "state": "active",
      "price": 18,
      "original_price": 24,
      "stock": 6,
      "in_stock": true,
      "main_image": "http://businesslabels.test/storage/...",
      "material_id": 12,
      "material": {
        "id": 12,
        "title": "Premium Paper",
        "slug": "premium-paper"
      },
      "categories": [],
      "meta": {
        "brand": "zebra"
      },
      "warrantyAvailable": true,
      "warrantyOptions": []
    }
  ],
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 4,
    "per_page": 24,
    "to": 24,
    "total": 86
  }
}
```

## Indexed Document Schema

### Shared Fields

Both simple and variable product indexes contain these fields:

| Field | Type | Frontend use |
| --- | --- | --- |
| `id` | integer | Product identifier. Combined with `product_type` for routing. |
| `product_type` / `type` | keyword | `simple` or `variable`. |
| `article_number` | text | Search and exact article-number filtering. |
| `name` | text | Search. |
| `title` | text | Search and display hydration source. May include localized values. |
| `title_sort` | keyword | Sort by title. |
| `subtitle` | text | Search. |
| `slug` | text | Search and exact slug filtering. May include localized slugs. |
| `sku` | text | Search. For variable products this is the first variant SKU. |
| `excerpt` | text | Search and listing summary. |
| `description` | text | Search. Detail page content comes from the database resource. |
| `content` | text | Search. |
| `product_information` | text | Search. |
| `state` | keyword | Public API forces `active`. |
| `price` | float | Price filtering and sorting. |
| `original_price` | float | Display/listing comparison price. |
| `stock` | float | Stock filtering and `in_stock` calculation. |
| `in_stock` | boolean | Indexed convenience flag. Public filters currently use `stock`. |
| `main_image` | string | Search payload includes it, but API responses hydrate product resources from DB/media. |
| `material_id` | integer | Material filtering. |
| `material_title` | text | Search. May include localized values. |
| `material_slug` | text | Search. May include localized values. |
| `material_taxon_ids` | integer array | Material category ID filtering. |
| `material_taxon_slugs` | keyword array | Material category slug filtering. |
| `category_ids` | integer array | Product category ID filtering. Includes assigned taxons and ancestors. |
| `category_slugs` | keyword array | Product category slug filtering. Includes assigned taxons and ancestors, with localized slugs. |
| `printer_ids` | integer array | Printer compatibility/search support. |
| `created_at_timestamp` | long | Latest/oldest sorting. |
| Dynamic meta fields | text/keyword | Product specifications such as brand, print method, width, height, core, etc. |
| `*_numeric` meta fields | float or float array | Numeric range filtering for selected meta values. |

### Simple Product Only

Simple products add warranty fields:

| Field | Type | Frontend use |
| --- | --- | --- |
| `warranty_available` | boolean | Whether active warranty options exist. |
| `warranty_option_ids` | integer array | Warranty option IDs. |
| `warranty_option_names` | text array | Warranty names. |
| `warranty_option_months` | integer array | Warranty durations. |
| `warranty_option_prices` | float array | Warranty prices. |
| `warranty_option_skus` | keyword array | Cart SKU pattern for warranty options. |

### Variable Product Only

Variable products add:

| Field | Type | Frontend use |
| --- | --- | --- |
| `variant_skus` | text array | Search all variant SKUs. |

For variable products, `stock` is the sum of non-deleted variant stock.

## Frontend Routing Pattern

Use the `type` and `slug` from API responses for product detail navigation:

```text
GET /api/products/{type}/slug/{slug}
GET /api/products/{type}/{id}
```

Examples:

```http
GET /api/products/simple/slug/zebra-label
GET /api/products/variable/slug/zebra-ribbon
```

Detail responses include extra fields such as `description`, `content`, `product_information`, `dimensions`, `gallery_images`, `variants`, `up_sells`, and `cross_sells`.

## Filter UI Bootstrap Endpoint

Use:

```http
GET /api/filters
```

The backend builds filter metadata from database values and Elasticsearch aggregation counts. This is the best source for rendering frontend filter controls because it includes labels, query keys, types, options, and counts where available.

Expected frontend behavior:

- Render `range` filters with min/max controls.
- Render `multi_select` filters as checkbox groups or selectable chips.
- Preserve existing query parameters when applying filters.
- Reset `page` to `1` whenever filters or sort change.
- Use the query keys from `/api/filters`, not index field names.

## Indexing Lifecycle

Scout syncs models to the search engine when searchable models are saved or deleted. Existing records can be imported with:

```bash
php artisan scout:import "App\Models\Product"
php artisan scout:import "App\Models\MasterProduct"
```

For large catalogs, queue imports are safer:

```bash
php artisan scout:queue-import "App\Models\Product" --chunk=500
php artisan scout:queue-import "App\Models\MasterProduct" --chunk=500
```

To clear stale records:

```bash
php artisan scout:flush "App\Models\Product"
php artisan scout:flush "App\Models\MasterProduct"
```

The application default Scout driver is `elastic`. Catalog search returns `503` if the Elastic backend is unavailable.

## Implementation Notes

- `toSearchableArray()` defines the document payload.
- `mappableAs()` defines the Elasticsearch mapping for Explorer.
- `makeAllSearchableUsing()` eager-loads translations, material, categories, printers, metas, variants, and warranty options during bulk indexing to avoid N+1 queries.
- Localized fields are indexed as arrays of supported locale strings where applicable.
- Category filters include ancestors, so a parent category page can include products assigned to child categories.
- The public `/api/products` endpoint hydrates Elasticsearch hits back into Eloquent models before returning `ProductResource`, so frontend display data follows the API resource contract rather than raw Elasticsearch `_source`.
