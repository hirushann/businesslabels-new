# Frontend API Migration Guide

**Date:** May 4, 2026  
**Impact:** Product search and printer filtering functionality

## Overview

The backend API has been refactored to separate concerns between text search and printer-based product filtering. This requires updates to the frontend implementation.

---

## 🔴 Breaking Changes

### 1. Search Endpoint Simplified

**Endpoint:** `GET /api/search`

#### ❌ OLD (No longer supported)
```javascript
// Multiple parameters are no longer supported
const response = await fetch('/api/search?' + new URLSearchParams({
  query: 'label',
  printer_ids: '1,2,3',    // ❌ REMOVED
  product_type: 'labels',  // ❌ REMOVED
  per_page: 10            // ❌ REMOVED
}));
```

#### ✅ NEW (Required changes)
```javascript
// Only 'query' parameter is supported
const response = await fetch('/api/search?' + new URLSearchParams({
  query: 'label'  // Required - text search only
}));

// Response pagination is fixed at 15 items per page
```

**Key Changes:**
- ✅ `query` parameter is now **required**
- ❌ `printer_ids` parameter **removed**
- ❌ `product_type` parameter **removed**
- ❌ `per_page` parameter **removed** (fixed at 15)
- Pure Elasticsearch text search only

---

### 2. NEW Printer Products Endpoint

**Endpoint:** `POST /api/products/printer-products`

This is a **new endpoint** for getting products that match a specific printer's specifications with optional product type filtering.

#### ✅ Implementation

```javascript
// Example: Get all products for printer ID 1
const response = await fetch('/api/products/printer-products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    printer_id: 1,              // Required - single printer ID
    product_type: 'labels',     // Optional - 'labels' or 'ink'
    per_page: 20               // Optional - default 15, max 100
  })
});

const data = await response.json();
```

**Parameters:**

| Parameter | Type | Required | Options | Default | Description |
|-----------|------|----------|---------|---------|-------------|
| `printer_id` | integer | ✅ Yes | Any valid printer ID | - | Single printer to match products against |
| `product_type` | string | No | `'labels'` or `'ink'` | `null` | Filter by product category |
| `per_page` | integer | No | 1-100 | 15 | Items per page |

**Response Format:**
```json
{
  "printer": {
    "id": 1,
    "title": "Godex ZX1200i",
    "subtitle": "industrial 4 inch Thermal Transfer labelprinter",
    "slug": "godex-zx1200i",
    "image": "http://businessLabels.test/storage/136/ZX1200-front.png",
    "meta": {
      "druktype": ["TD", "TT"],
      "kern": "38 - 76,2 mm",
      "width": ["25", "26", ..., "118"],
      "max_buiten_diameter": "203 mm."
    },
    "created_at": "2026-05-04T06:20:02.000000Z",
    "updated_at": "2026-05-04T06:39:42.000000Z"
  },
  "products": {
    "data": [
      {
        "id": 123,
        "title": "Product Name",
        "price": "€10.99",
        "main_image": "https://example.com/image.jpg",
        ...
      }
    ],
    "meta": {
      "current_page": 1,
      "from": 1,
      "last_page": 10,
      "per_page": 15,
      "to": 15,
      "total": 145
    }
  }
}
```

**Error Responses:**

```javascript
// 404 - Printer not found or invalid type
{
  "message": "Printer not found"
}

// 422 - Validation error
{
  "message": "The printer id field is required.",
  "errors": {
    "printer_id": ["The printer id field is required."]
  }
}

// 500 - Server error (only if matcher fails)
{
  "message": "Error matching products",
  "error": "..." // Only in debug mode
}
```

---

### 3. NEW Material Products Endpoint

**Endpoint:** `POST /api/products/material-products`

This is a **new endpoint** for getting products that use a specific material with optional product type filtering.

#### ✅ Implementation

```javascript
// Example: Get all products using material ID 5
const response = await fetch('/api/products/material-products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    material_id: 5,             // Required - single material ID
    product_type: 'labels',     // Optional - 'labels' or 'ink'
    per_page: 20               // Optional - default 15, max 100
  })
});

const data = await response.json();
```

**Parameters:**

| Parameter | Type | Required | Options | Default | Description |
|-----------|------|----------|---------|---------|-------------|
| `material_id` | integer | ✅ Yes | Any valid material ID | - | Material to filter products by |
| `product_type` | string | No | `'labels'` or `'ink'` | `null` | Filter by product category |
| `per_page` | integer | No | 1-100 | 15 | Items per page |

**Response Format:**
```json
{
  "material": {
    "id": 5,
    "title": "Polypropylene Film",
    "subtitle": "Durable synthetic material",
    "slug": "polypropylene-film",
    "category": {
      "id": 2,
      "name": "Films",
      "slug": "films"
    },
    "created_at": "2026-05-04T06:20:02.000000Z",
    "updated_at": "2026-05-04T06:39:42.000000Z"
  },
  "products": {
    "data": [
      {
        "id": 456,
        "title": "Product Name",
        "price": "€12.99",
        "main_image": "https://example.com/image.jpg",
        ...
      }
    ],
    "meta": {
      "current_page": 1,
      "from": 1,
      "last_page": 5,
      "per_page": 15,
      "to": 15,
      "total": 72
    }
  }
}
```

**Error Responses:**

```javascript
// 404 - Material not found
{
  "message": "Material not found"
}

// 422 - Validation error
{
  "message": "The material id field is required.",
  "errors": {
    "material_id": ["The material id field is required."]
  }
}

// 500 - Server error
{
  "message": "Error fetching products",
  "error": "..." // Only in debug mode
}
```

---

## 📋 Migration Checklist

### For Product Filtering by Printer

- [ ] Replace `/api/search` calls with `/api/products/printer-products`
- [ ] Access printer details from `response.printer`
- [ ] Access products from `response.products.data`
- [ ] Access pagination from `response.products.meta`

### For Product Filtering by Material

- [ ] Use new `/api/products/material-products` endpoint
- [ ] Send `material_id` in request body (POST method)
- [ ] Access material details from `response.material`
- [ ] Access products from `response.products.data`
- [ ] Access pagination from `response.products.meta`

### For Product Filtering by Printer (continued)

- [ ] Replace `/api/search` calls with `/api/products/printer-products`
- [ ] Change from `GET` to `POST` method
- [ ] Update parameter from `printer_ids` (plural, comma-separated) to `printer_id` (singular)
- [ ] Move parameters from query string to request body
- [ ] Update state management to use single printer selection
- [ ] Test with and without `product_type` parameter

### For Text Search

- [ ] Simplify `/api/search` calls to only include `query` parameter
- [ ] Remove `printer_ids`, `product_type`, `per_page` from search requests
- [ ] Update pagination to expect 15 items per page
- [ ] Handle required `query` validation (empty search will fail)

---

## 🔧 Example Frontend Updates

### React/Next.js Example

```typescript
// src/lib/api/products.js

/**
 * Search products by text query (Elasticsearch)
 * @param {string} query - Search text (required)
 */
export async function searchProducts(query: string) {
  if (!query || query.trim() === '') {
    throw new Error('Search query is required');
  }
  
  const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    throw new Error('Search failed');
  }
  
  return response.json();
}

/**
 * Get products matching a printer's specifications
 * @param {number} printerId - Printer ID (required)
 * @param {object} options - Additional filters
 * @param {('labels'|'ink')} [options.productType] - Product type filter
 * @param {number} [options.perPage=15] - Items per page (max 100)
 */
export async function getPrinterProducts(
  printerId: number,
  options: {
    productType?: 'labels' | 'ink';
    perPage?: number;
  } = {}
) {
  const response = await fetch('/api/products/printer-products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      printer_id: printerId,
      product_type: options.productType,
      per_page: options.perPage || 15,
    }),
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Printer not found');
    }
    throw new Error('Failed to fetch printer products');
  }
  
  return response.json();
}

/**
 * Get products that use a specific material
 * @param {number} materialId - Material ID (required)
 * @param {object} options - Additional filters
 * @param {('labels'|'ink')} [options.productType] - Product type filter
 * @param {number} [options.perPage=15] - Items per page (max 100)
 */
export async function getMaterialProducts(
  materialId: number,
  options: {
    productType?: 'labels' | 'ink';
    perPage?: number;
  } = {}
) {
  const response = await fetch('/api/products/material-products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      material_id: materialId,
      product_type: options.productType,
      per_page: options.perPage || 15,
    }),
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Material not found');
    }
    throw new Error('Failed to fetch material products');
  }
  
  return response.json();
}

// Usage example with new response structure
const data = await getPrinterProducts(1, { productType: 'labels' });

// Access printer details
console.log(data.printer.title); // "Godex ZX1200i"
console.log(data.printer.meta.druktype); // ["TD", "TT"]

// Access products
const products = data.products.data;
const pagination = data.products.meta;
console.log(`Showing ${pagination.from}-${pagination.to} of ${pagination.total} products`);
```

### Vue.js Example

```javascript
// composables/useProducts.js

export function useProducts() {
  // Simple text search
  const searchProducts = async (query) => {
    if (!query?.trim()) {
      throw new Error('Search query is required');
    }
    
    const params = new URLSearchParams({ query: query.trim() });
    const response = await fetch(`/api/search?${params}`);
    return response.json();
  };
  
  // Printer-based product filtering
  const getPrinterProducts = async (printerId, { productType, perPage = 15 } = {}) => {
    const response = await fetch('/api/products/printer-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printer_id: printerId,
        ...(productType && { product_type: productType }),
        per_page: perPage,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch printer products');
    }
    
    return response.json();
  };
  
  return {
    searchProducts,
    getPrinterProducts,
  };
}
```

---

## 🎯 Use Cases

### Use Case 1: Simple Product Search
**When:** User types in search bar  
**Endpoint:** `GET /api/search?query=label`  
**Frontend:** Text input → debounced search → display results

### Use Case 2: Printer Product Filtering (No Category)
**When:** User selects a printer from dropdown  
**Endpoint:** `POST /api/products/printer-products` with `printer_id: 5`  
**Frontend:** Printer selector → fetch matching products → display grid

### Use Case 3: Printer + Product Type Filtering
**When:** User selects printer AND chooses "Labels" category  
**Endpoint:** `POST /api/products/printer-products` with `printer_id: 5, product_type: 'labels'`  
**Frontend:** Two filters → combined query → filtered results

---

## 🧪 Testing Endpoints

### Test Search Endpoint
```bash
# ✅ Valid request
curl "http://businessLabels.test/api/search?query=label"

# ❌ Will fail - query is required
curl "http://businessLabels.test/api/search"

# ❌ Will fail - printer_ids no longer supported
curl "http://businessLabels.test/api/search?query=label&printer_ids=1,2"
```

### Test Printer Products Endpoint
```bash
# ✅ Valid - printer only
curl -X POST http://businessLabels.test/api/products/printer-products \
  -H "Content-Type: application/json" \
  -d '{"printer_id": 1}'

# ✅ Valid - printer + product type
curl -X POST http://businessLabels.test/api/products/printer-products \
  -H "Content-Type: application/json" \
  -d '{"printer_id": 1, "product_type": "labels", "per_page": 20}'

# ❌ Will fail - printer_id required
curl -X POST http://businessLabels.test/api/products/printer-products \
  -H "Content-Type: application/json" \
  -d '{"product_type": "labels"}'
```

---

## 🚨 Important Notes

1. **Single Printer Selection:** The new endpoint only accepts ONE printer ID, not multiple. Update UI to single-select if currently using multi-select.

2. **Method Change:** Printer filtering changed from `GET` to `POST` to support more complex request bodies.

3. **Product Type Taxonomy:** The `product_type` filter uses taxon hierarchy matching:
   - `'labels'` matches taxon slugs: `['labels-en-tickets', 'labels-en-tickets-en']`
   - `'ink'` matches taxon slug: `'inkt-cartridges'`
   - Products assigned to child taxons are matched up to 3 levels deep

4. **Matching Logic:** The printer products endpoint uses dynamic metadata-based matching:
   - Matches printer specs (`druktype`, `kern`, `width`, `max_diameter`) against product properties
   - Then applies optional product type filter
   - Both filters work together (AND logic)

5. **Pagination:** 
   - Search endpoint: fixed at 15 items
   - Printer products: configurable (default 15, max 100)

---

## 📞 Support

For questions about these changes, contact the backend team or refer to:
- Backend controller: `app/Http/Controllers/API/ProductController.php`
- Search controller: `app/Http/Controllers/Api/SearchController.php`
- Matcher service: `app/Services/PrinterProductMatcher.php`

---

## 📅 Timeline

- **Effective Date:** May 4, 2026
- **Old endpoint behavior:** Deprecated immediately
- **Migration deadline:** Update frontend as soon as possible
