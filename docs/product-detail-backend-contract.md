# Product Detail Backend Contract

The Next.js product detail page no longer uses Elasticsearch or local demo product data for `/products/[slug]`. It always requests the product detail from the Laravel API.

## Frontend request

For this URL:

```text
http://localhost:3000/products/cw-d6000-series-inktcartridges-cyaan?type=simple
```

Next.js calls:

```http
GET {BBNL_API_BASE_URL}/api/products/simple/slug/cw-d6000-series-inktcartridges-cyaan?lang=en
Accept: application/json
```

If `type=variable`, it calls:

```http
GET {BBNL_API_BASE_URL}/api/products/variable/slug/{slug}?lang={en|nl}
Accept: application/json
```

If the page URL has no valid `type` query param, the frontend tries `simple` first, then `variable`.

## Existing Laravel route shape

The current route is suitable:

```php
Route::get('{type}/slug/{slug}', 'showBySlug')
    ->whereIn('type', ['simple', 'variable'])
    ->name('show-by-slug');
```

The frontend expects `showBySlug($type, $slug)` to search only within the requested product type and return a single full-detail product.

## Required success response

Return HTTP `200` with a JSON resource envelope:

```json
{
  "data": {
    "id": 123,
    "type": "simple",
    "title": "CW-D6000 Series Inkcartridges Cyaan",
    "name": "CW-D6000 Series Inkcartridges Cyaan",
    "slug": "cw-d6000-series-inktcartridges-cyaan",
    "sku": "C13T44C240",
    "article_number": "C13T44C240",
    "price": 82.5,
    "original_price": 99.0,
    "stock": 12,
    "in_stock": true,
    "description": "<p>Full product description HTML.</p>",
    "excerpt": "Short product summary.",
    "main_image": "https://example.com/storage/products/main.jpg",
    "gallery_images": [
      {
        "id": 1,
        "url": "https://example.com/storage/products/gallery-1.jpg",
        "name": "Front"
      }
    ],
    "categories": [
      {
        "id": 10,
        "name": "Ink & Maintenance"
      }
    ],
    "material": {
      "id": 5,
      "title": "Ink",
      "slug": "ink"
    },
    "meta": {
      "brand": "Epson",
      "color": "Cyan"
    },
    "meta_title": "CW-D6000 Series Inkcartridges Cyaan",
    "meta_description": "Buy Epson ColorWorks cyan ink cartridges.",
    "packing_group": 1,
    "discounts": [
      {
        "quantity": 10,
        "discount": 5
      }
    ],
    "delivery_dates_in_stock": 1,
    "delivery_dates_no_stock": 5,
    "up_sells": [
      {
        "id": 456,
        "title": "Related Product",
        "slug": "related-product",
        "sku": "REL-001",
        "price": 49.95,
        "original_price": 59.95,
        "main_image": "https://example.com/storage/products/related.jpg"
      }
    ],
    "warranty": {
      "is_available": false,
      "has_options": false,
      "options": [],
      "default_option": null
    }
  }
}
```

## Fields the page currently reads

Required for a usable page:

- `id`
- `type`
- `title` or `name`
- `slug`
- `sku`
- `price`
- `in_stock`
- `description` or `excerpt`
- `main_image`

Optional but displayed when present:

- `original_price`
- `stock`
- `subtitle`
- `gallery_images[].url`
- `categories[].name`
- `material.title`
- `meta`
- `meta_title`
- `meta_description`
- `packing_group`
- `discounts`
- `delivery_dates_in_stock`
- `delivery_dates_no_stock`
- `up_sells`
- `warranty`

## Not found and errors

- Return HTTP `404` when no product exists for the requested `{type}` and `{slug}`.
- Return JSON for errors when possible.
- Do not return a different product type as a fallback from this endpoint. The frontend handles trying the other type only when the page URL does not include a valid `type` query param.

## Localization

The frontend appends `lang=en` or `lang=nl`. The API should return localized strings as plain strings for detail page fields such as `title`, `name`, `description`, `excerpt`, `meta_title`, and `meta_description`.
