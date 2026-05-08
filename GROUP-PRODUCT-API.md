# Group Product API

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/group-products` | Paginated list |
| `GET` | `/api/group-products/{id}` | Detail by ID |
| `GET` | `/api/group-products/slug/{slug}` | Detail by slug (preferred) |

---

## Detecting a Group Product

Every product in catalog listings and search results includes these fields to identify group products:

```json
{
  "is_group_product": true,
  "type": "group_product",
  "api_path_by_id": "/api/group-products/1",
  "api_path_by_slug": "/api/group-products/slug/test-group-1"
}
```

```js
if (product.is_group_product) {
  const res = await fetch(product.api_path_by_slug)
  const { data } = await res.json()
}
```

---

## List Response (`GET /api/group-products`)

```json
{
  "data": [
    {
      "id": 1,
      "model_id": 1,
      "type": "group_product",
      "is_group_product": true,
      "api_path_by_id": "/api/group-products/1",
      "api_path_by_slug": "/api/group-products/slug/kitchen-set-bundle",
      "title": "Kitchen Set Bundle",
      "name": "Kitchen Set Bundle",
      "subtitle": "Complete kitchen label set",
      "slug": "kitchen-set-bundle",
      "sku": "GRP-KIT-001",
      "article_number": "ART-GRP-001",
      "state": "active",
      "price": 299.95,
      "original_price": 349.95,
      "stock": 30,
      "in_stock": true,
      "excerpt": "Short summary of the bundle",
      "main_image": "https://example.com/storage/media/main.jpg",
      "packing_group": null,
      "material_id": 2,
      "material": {
        "id": 2,
        "title": "Vinyl",
        "slug": "vinyl",
        "subtitle": null,
        "category": {
          "id": 1,
          "name": "Label Materials",
          "slug": "label-materials"
        }
      },
      "categories": [],
      "meta_title": null,
      "meta_description": null,
      "discounts": null,
      "created_at": "2026-05-08T07:07:41.000000Z",
      "updated_at": "2026-05-08T07:07:41.000000Z"
    }
  ],
  "links": { "...": "pagination links" },
  "meta": { "current_page": 1, "total": 5, "...": "..." }
}
```

---

## Detail Response (`GET /api/group-products/slug/{slug}`)

The detail endpoints include all list fields **plus** the following additional fields.

```json
{
  "data": {
    "id": 1,
    "model_id": 1,
    "type": "group_product",
    "is_group_product": true,
    "api_path_by_id": "/api/group-products/1",
    "api_path_by_slug": "/api/group-products/slug/kitchen-set-bundle",
    "title": "Kitchen Set Bundle",
    "name": "Kitchen Set Bundle",
    "subtitle": "Complete kitchen label set",
    "slug": "kitchen-set-bundle",
    "sku": "GRP-KIT-001",
    "article_number": "ART-GRP-001",
    "state": "active",
    "price": 299.95,
    "original_price": 349.95,
    "stock": 30,
    "in_stock": true,
    "excerpt": "Short summary of the bundle",
    "description": "<p>Detailed description...</p>",
    "content": "<p>Rich content...</p>",
    "product_information": "Additional product info",
    "product_template": "label",
    "make": "In-house",
    "material_information": "Waterproof vinyl",
    "packaging_unit": 10,
    "delivery_dates_no_stock": 7,
    "delivery_dates_in_stock": 2,
    "packing_group": null,
    "main_image": "https://example.com/storage/media/main.jpg",
    "material_id": 2,
    "material": {
      "id": 2,
      "title": "Vinyl",
      "slug": "vinyl",
      "subtitle": null,
      "category": {
        "id": 1,
        "name": "Label Materials",
        "slug": "label-materials"
      }
    },
    "dimensions": {
      "weight": 1.5,
      "width": 40.0,
      "height": 30.0,
      "length": 60.0
    },
    "gallery_images": [
      {
        "id": 12,
        "name": "angle-shot",
        "file_name": "angle-shot.jpg",
        "url": "https://example.com/storage/media/angle-shot.jpg"
      }
    ],
    "component_products": [
      {
        "id": 1,
        "name": "Address Label A4",
        "slug": "address-label-a4",
        "sku": "LBL-A4-001",
        "price": 19.95,
        "stock": 500,
        "quantity": 2,
        "available_sets": 250,
        "main_image": "https://example.com/storage/media/label-a4.jpg"
      },
      {
        "id": 6,
        "name": "Round Label 40mm",
        "slug": "round-label-40mm",
        "sku": "LBL-RND-006",
        "price": 14.95,
        "stock": 300,
        "quantity": 1,
        "available_sets": 300,
        "main_image": "https://example.com/storage/media/label-rnd.jpg"
      }
    ],
    "categories": [],
    "meta_title": null,
    "meta_description": null,
    "discounts": null,
    "created_at": "2026-05-08T07:07:41.000000Z",
    "updated_at": "2026-05-08T07:07:41.000000Z"
  }
}
```

---

## `component_products` Field

Each item in `component_products` represents one child product included in the bundle:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `int` | Child product DB id |
| `name` | `string` | Translated product name |
| `slug` | `string` | Translated slug |
| `sku` | `string\|null` | Product SKU |
| `price` | `float\|null` | Unit price |
| `stock` | `float` | Current warehouse stock of this child product |
| `quantity` | `int` | How many units of this product are included per bundle set |
| `available_sets` | `int` | `floor(stock / quantity)` — how many full sets can be assembled |
| `main_image` | `string\|null` | Child product image URL |

### Stock / availability logic

The group product's top-level `stock` is the **minimum** `available_sets` across all component products. If any single component runs out, the whole bundle is unavailable.

```
stock = min(component_products[*].available_sets)
in_stock = stock > 0
```

---

## Fields only on detail endpoints

| Field | List | Detail |
|-------|------|--------|
| `description` | ✗ | ✓ |
| `content` | ✗ | ✓ |
| `product_information` | ✗ | ✓ |
| `product_template` | ✗ | ✓ |
| `make` | ✗ | ✓ |
| `material_information` | ✗ | ✓ |
| `packaging_unit` | ✗ | ✓ |
| `delivery_dates_in_stock` | ✗ | ✓ |
| `delivery_dates_no_stock` | ✗ | ✓ |
| `dimensions` | ✗ | ✓ |
| `gallery_images` | ✗ | ✓ |
| `component_products` | ✗ | ✓ |
