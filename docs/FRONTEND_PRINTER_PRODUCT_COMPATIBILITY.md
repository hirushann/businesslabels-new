# Frontend Printer/Product Compatibility Guide

This guide explains how frontend code should use printer/product compatibility after the Vanilo-property sync change.

## What Changed

Compatibility is now calculated from Vanilo properties and stored in `printer_product`.

The `printer_product` table is now a materialized lookup table:

```text
Vanilo printer properties + Vanilo product properties
  -> compatibility matcher
  -> printer_product pivot table
  -> Laravel API responses
  -> Scout / Elasticsearch printer_ids
```

Frontend should not try to reimplement compatibility rules. Use either the Laravel API or the indexed `printer_ids` field.

## Source Of Truth

The source of truth is Vanilo properties, not old WooCommerce meta and not manual `printer_product` rows.

Printer-side properties are stored on `App\Models\Post` where `post_type = printer`.

Product-side properties are stored on `App\Models\Product`.

The current matching uses these canonical Vanilo property slugs:

| Meaning | Printer property | Product property |
| --- | --- | --- |
| Print method | `printmethode` | `printmethode` |
| Label width | `label-breedte-min`, `label-breedte-max`, or `breedte` | `breedte` |
| Core diameter | `kern` | `kern` |
| Outer diameter | `buiten-diameter` or `max-buiten-diameter` | `buiten-diameter` |

`detectie` exists on printers, but product-side `detectie` values are not currently populated, so it is not a hard compatibility rule yet.

## Backend Sync Behavior

The initial rebuild was run with:

```bash
php artisan app:sync-printer-product-compatibility --truncate
```

After rebuild:

```text
printer_product rows: 26649
printers synced: 201
affected products: 703
Godex RT730i PRO compatible products: 169
```

Normal future updates do not run the full rebuild.

When one printer changes, only that printer is recalculated.

When one product changes, only that product is recalculated.

Known backend paths that now auto-sync compatibility:

- WooCommerce printer property sync
- WooCommerce product property sync
- mapped product import
- product admin save
- printer admin save

## Preferred FE Options

Use the Laravel API when you need hydrated product resources, warranty data, auth-specific behavior, or Laravel pagination.

Use Elasticsearch when you need fast catalog search/filtering and already have public index data on the page.

Do not call Elasticsearch from browser components. Call ES from Next.js server-only code, route handlers, server actions, or a backend-for-frontend layer.

## API: Products Compatible With Printer

Endpoint:

```http
POST /api/products/printer-products
```

Request body:

```ts
type PrinterProductsRequest = {
  printer_id: number;
  product_type?: 'labels' | 'ink';
  per_page?: number; // default 15, max 100
  page?: number;
};
```

Example:

```ts
const response = await fetch(`${API_BASE_URL}/products/printer-products?page=1`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    printer_id: 4,
    product_type: 'labels',
    per_page: 100,
  }),
});

if (!response.ok) {
  throw new Error(`Failed to load compatible products: ${response.status}`);
}

const payload = await response.json();
```

Response shape:

```ts
type PrinterProductsResponse = {
  printer: PrinterResource;
  products: {
    data: ProductResource[];
    meta: {
      current_page: number;
      from: number | null;
      last_page: number;
      per_page: number;
      to: number | null;
      total: number;
    };
  };
};
```

Use `products.meta.total` for “total compatible products”.

Do not use `products.data.length` as the total. That is only the number of items on the current page.

For example, Godex RT730i PRO currently returns:

```json
{
  "products": {
    "meta": {
      "current_page": 1,
      "from": 1,
      "last_page": 2,
      "per_page": 100,
      "to": 100,
      "total": 169
    }
  }
}
```

Correct UI text:

```text
Showing 100 of 169 compatible products
```

Incorrect UI text:

```text
Showing 100 of 100 compatible products
```

## API: Compatibility Check

Endpoint:

```http
POST /api/products/compatibility
```

Request body:

```ts
type CompatibilityRequest = {
  printer_id: number;
  product_id: number;
};
```

Response:

```ts
type CompatibilityResponse = {
  compatibility: boolean;
};
```

Use this for small one-off checks. For listing pages, prefer `/printer-products` or ES filtering.

## Elasticsearch: Filter Products By Printer

Products index compatible printer IDs as `printer_ids`.

For simple products, `printer_ids` is generated from the `printer_product` pivot table.

Example product document field:

```json
{
  "id": 123,
  "product_type": "simple",
  "printer_ids": [4, 12, 19]
}
```

To find products compatible with printer `4`:

```ts
const payload = {
  index: 'business_labels_catalog_products_simple',
  body: {
    track_total_hits: true,
    from: (page - 1) * perPage,
    size: perPage,
    _source: [
      'id',
      'model_id',
      'product_type',
      'title',
      'slug',
      'sku',
      'price',
      'stock',
      'in_stock',
      'main_image',
      'frontend_path',
      'printer_ids',
    ],
    query: {
      bool: {
        must: search
          ? [{
              multi_match: {
                query: search,
                fields: [
                  'article_number^7',
                  'title^5',
                  'name^4',
                  'slug^4',
                  'sku^6',
                  'properties.printmethode',
                  'properties.materiaal-code^2',
                  'excerpt^2',
                  'description',
                ],
                type: 'bool_prefix',
                operator: 'and',
              },
            }]
          : [{ match_all: {} }],
        filter: [
          { term: { 'state.keyword': 'active' } },
          { terms: { printer_ids: [4] } },
        ],
      },
    },
    sort: [
      { created_at_timestamp: { order: 'desc', unmapped_type: 'long' } },
    ],
  },
};
```

Important: `printer_ids` currently applies to simple products in `business_labels_catalog_products_simple`. Group products share this index, but group compatibility is not currently materialized the same way.

## Next.js Helper Example

Server-only helper:

```ts
import 'server-only';

type CompatibleProductsParams = {
  printerId: number;
  page?: number;
  perPage?: number;
  search?: string;
};

export async function searchCompatibleProducts({
  printerId,
  page = 1,
  perPage = 24,
  search = '',
}: CompatibleProductsParams) {
  return searchElasticsearch<CatalogProductDocument>({
    index: 'business_labels_catalog_products_simple',
    body: {
      track_total_hits: true,
      from: (page - 1) * perPage,
      size: perPage,
      query: {
        bool: {
          must: search
            ? [{
                multi_match: {
                  query: search,
                  fields: ['title^5', 'name^4', 'sku^6', 'article_number^7'],
                  type: 'bool_prefix',
                  operator: 'and',
                },
              }]
            : [{ match_all: {} }],
          filter: [
            { term: { 'state.keyword': 'active' } },
            { terms: { printer_ids: [printerId] } },
          ],
        },
      },
    },
  });
}
```

Total hits helper:

```ts
function elasticTotal(total: { value: number } | number): number {
  return typeof total === 'number' ? total : total.value;
}
```

## Display Rules

Use these fields:

| UI need | Source |
| --- | --- |
| Current page items | API `products.data` or ES `hits.hits` |
| Total compatible count | API `products.meta.total` or ES `hits.total.value` |
| Page size | API `products.meta.per_page` or request `size` |
| Last Laravel page | API `products.meta.last_page` |
| ES next page availability | `from + hits.length < total` |

Recommended display:

```ts
const shown = products.meta.to ?? products.data.length;
const total = products.meta.total;

return `Showing ${shown} of ${total} compatible products`;
```

For ES:

```ts
const shown = Math.min(page * perPage, total);

return `Showing ${shown} of ${total} compatible products`;
```

## Freshness And Reindexing

The database pivot `printer_product` updates immediately in the known backend save/import paths.

The product `printer_ids` Elasticsearch field updates through Scout reindex calls after compatibility sync. If Elasticsearch is temporarily unavailable, the pivot table is still updated and the exception is reported. In that case, run a product/printer reindex when ES is healthy again:

```bash
php artisan app:reindex-elasticsearch --model=Product
php artisan app:reindex-elasticsearch --model=Post
```

For a full compatibility repair:

```bash
php artisan app:sync-printer-product-compatibility --truncate
```

For targeted repairs:

```bash
php artisan app:sync-printer-product-compatibility --printer=4
php artisan app:sync-printer-product-compatibility --product=123
```

## Practical Recommendation

For the printer detail page:

- Use `/api/products/printer-products` if you need Laravel `ProductResource` data exactly as the rest of the app consumes it.
- Use ES `printer_ids` filtering if you need fast searching/filtering/sorting inside the compatible products list.

For product cards sourced from ES, hydrate individual product detail pages through Laravel using the product `api_path_by_id`, `api_path_by_slug`, or `frontend_path` fields when available.
