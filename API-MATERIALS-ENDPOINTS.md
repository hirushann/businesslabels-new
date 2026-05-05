# Materials API Endpoints - Backend Architecture Reference

**Target Audience**: Frontend Developers  
**Last Updated**: May 5, 2026  
**API Version**: v1  
**Base URL**: `https://businesslabels.test/api`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
4. [Database Architecture](#database-architecture)
5. [Translation System](#translation-system)
6. [Taxon Categories](#taxon-categories)
7. [Data Synchronization](#data-synchronization)
8. [Response Format](#response-format)
9. [Usage Examples](#usage-examples)
10. [Known Issues & Future Improvements](#known-issues--future-improvements)

---

## 🎯 Overview

The Materials API provides access to printing materials (vinyl, polyester, paper, etc.) used in the label printing business. Materials are synced from WooCommerce and support multi-locale translations (EN/NL).

**Key Features**:
- ✅ Multi-locale support (EN primary, NL translations)
- ✅ Pagination support
- ✅ Category-based filtering (via `category_id` or `category_slug`)
- ✅ Status filtering (active, inactive, draft)
- ✅ Slug-based and ID-based lookups
- ✅ Detailed specifications in JSON format
- ✅ Category system synced from WooCommerce categories
- ✅ Related products using each material (detail views only)

---

## 🔐 Authentication

**All materials endpoints are PUBLIC** (no authentication required).

```javascript
// No Authorization header needed
fetch('https://businesslabels.test/api/materials')
```

---

## 🚀 Endpoints

### 1. **GET /api/materials** - List Materials

**Route**: `GET /api/materials`  
**Controller**: `MaterialController@index`  
**File**: `app/Http/Controllers/Api/MaterialController.php:11`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `per_page` | integer | No | `15` | Items per page (1-100) |
| `page` | integer | No | `1` | Page number |
| `category_id` | integer | No | - | Filter by category ID |
| `category_slug` | string | No | - | Filter by category slug (e.g., `vinyl`, `polyester`) |
| `status` | string | No | - | Filter by status (`active`, `inactive`, `draft`) |

#### Request Example

```bash
# Filter by category ID
curl "https://businesslabels.test/api/materials?per_page=20&status=active&category_id=15"

# Filter by category slug
curl "https://businesslabels.test/api/materials?per_page=20&status=active&category_slug=vinyl"
```

#### Response Structure

```json
{
  "data": [
    {
      "id": 42,
      "title": "Premium Vinyl",
      "subtitle": "Durable outdoor vinyl",
      "slug": "premium-vinyl",
      "code": "VIN-001",
      "brand": "Avery Dennison",
      "status": "active",
      "categories": [
        {
          "id": 15,
          "name": "Vinyl",
          "slug": "vinyl"
        }
      ],
      "created_at": "2026-03-19T10:30:00.000000Z",
      "updated_at": "2026-05-05T08:15:00.000000Z"
    }
  ],
  "links": {
    "first": "https://businesslabels.test/api/materials?page=1",
    "last": "https://businesslabels.test/api/materials?page=8",
    "prev": null,
    "next": "https://businesslabels.test/api/materials?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 8,
    "per_page": 15,
    "to": 15,
    "total": 120
  }
}
```

---

### 2. **GET /api/materials/{id}** - Get Material by ID

**Route**: `GET /api/materials/{id}`  
**Controller**: `MaterialController@show`  
**File**: `app/Http/Controllers/Api/MaterialController.php:21`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Material ID (must be numeric) |

#### Request Example

```bash
curl "https://businesslabels.test/api/materials/42"
```

#### Response Structure

```json
{
  "data": {
    "id": 42,
    "title": "Premium Vinyl",
    "subtitle": "Durable outdoor vinyl",
    "slug": "premium-vinyl",
    "code": "VIN-001",
    "brand": "Avery Dennison",
    "status": "active",
    "categories": [
      {
        "id": 15,
        "name": "Vinyl",
        "slug": "vinyl"
      }
    ],
    "created_at": "2026-03-19T10:30:00.000000Z",
    "updated_at": "2026-05-05T08:15:00.000000Z",
    
    // DETAIL-ONLY FIELDS (only in show/showBySlug)
    "description": "<p>High-quality vinyl suitable for outdoor use...</p>",
    "specifications": {
      "thickness": "3 mil",
      "liner": "90# layflat liner",
      "temperature_range": "-40°C to +90°C",
      "durability": "5-7 years"
    },
    "print_method": "Digital",
    "base_material": "PVC",
    "finish": "Gloss",
    "adhesive": "Permanent",
    "supplier": "Avery Dennison",
    "supplier_reference": "AD-VIN-001",
    "price_per_sq_meter": 12.50,
    "certificate": "ISO 9001, REACH compliant",
    
    // Related products using this material
    "products": [
      {
        "id": 1234,
        "name": "Premium Vinyl Labels - 100x50mm",
        "slug": "premium-vinyl-labels-100x50mm",
        "sku": "LBL-VIN-100-50",
        "article_number": "ART-001234",
        "state": "active",
        "price": 45.99,
        "stock": 150,
        "in_stock": true,
        "main_image": "https://businesslabels.test/storage/media/product-image.jpg"
      },
      {
        "id": 1235,
        "name": "Premium Vinyl Labels - 200x100mm",
        "slug": "premium-vinyl-labels-200x100mm",
        "sku": "LBL-VIN-200-100",
        "article_number": "ART-001235",
        "state": "active",
        "price": 89.99,
        "stock": 75,
        "in_stock": true,
        "main_image": "https://businesslabels.test/storage/media/product-image-2.jpg"
      }
    ],
    "products_count": 2
  }
}
```

---

### 3. **GET /api/materials/slug/{slug}** - Get Material by Slug

**Route**: `GET /api/materials/slug/{slug}`  
**Controller**: `MaterialController@showBySlug`  
**File**: `app/Http/Controllers/Api/MaterialController.php:28`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Material slug (URL-friendly identifier) |

#### Request Example

```bash
curl "https://businesslabels.test/api/materials/slug/premium-vinyl"
```

#### Response Structure

Same as `GET /api/materials/{id}` (detail view with all fields).

---

## 🗄️ Database Architecture

### Tables Overview

```
taxonomies (Material Category taxonomy)
    ↓ has many
taxons (vinyl, polyester, paper - exposed as "categories" in API)
    ↓ many-to-many via model_taxons
materials (linked internally via taxons()->sync())
    ↓ has many
products (product variants using this material)
```

### `materials` Table Schema

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | bigint unsigned | No | - | Primary key |
| `title` | varchar(255) | No | - | Material name (translatable) |
| `subtitle` | varchar(255) | Yes | - | Short description (translatable) |
| `slug` | varchar(255) | No | - | URL-friendly identifier (unique, translatable) |
| `description` | longtext | Yes | - | Full HTML description (translatable) |
| `specifications` | json | Yes | - | Technical specs as JSON |
| `code` | varchar(255) | Yes | - | Internal SKU/code |
| `brand` | varchar(255) | Yes | - | Manufacturer brand |
| `status` | varchar(255) | No | `active` | Material status |
| `print_method` | varchar(255) | Yes | - | Compatible print method |
| `base_material` | varchar(255) | Yes | - | Base material type (PVC, PET, etc.) |
| `finish` | varchar(255) | Yes | - | Surface finish (gloss, matte, etc.) |
| `adhesive` | varchar(255) | Yes | - | Adhesive type |
| `supplier` | varchar(255) | Yes | - | Supplier name |
| `supplier_reference` | varchar(255) | Yes | - | Supplier's reference code |
| `price_per_sq_meter` | double | Yes | - | Price per square meter |
| `certificate` | varchar(255) | Yes | - | Certifications (ISO, REACH, etc.) |
| `created_at` | timestamp | Yes | - | Creation timestamp |
| `updated_at` | timestamp | Yes | - | Last update timestamp |

### `model_taxons` Pivot Table

Links materials to taxons (categories from WooCommerce).

| Column | Type | Description |
|--------|------|-------------|
| `taxon_id` | int unsigned | FK to `taxons.id` |
| `model_type` | varchar(255) | Polymorphic type (`App\Models\Material`) |
| `model_id` | bigint unsigned | Material ID |

**Composite Primary Key**: `(taxon_id, model_id, model_type)`

---

## 🌍 Translation System

Materials use **Vanilo Translation** system for multi-locale support.

### Translation Fields

| Field | Translatable | Notes |
|-------|--------------|-------|
| `title` | ✅ Yes | Material name |
| `subtitle` | ✅ Yes | Short description |
| `slug` | ✅ Yes | URL slug (localized) |
| `description` | ✅ Yes | Full HTML description |
| `code` | ❌ No | Internal code (same across locales) |
| `brand` | ❌ No | Brand name (same across locales) |
| `status` | ❌ No | Status (same across locales) |
| `specifications` | ❌ No | JSON specs (same across locales) |
| `print_method` | ❌ No | Technical field |
| `base_material` | ❌ No | Technical field |
| `finish` | ❌ No | Technical field |
| `adhesive` | ❌ No | Technical field |
| `supplier` | ❌ No | Business field |
| `supplier_reference` | ❌ No | Business field |
| `price_per_sq_meter` | ❌ No | Pricing (same across locales) |
| `certificate` | ❌ No | Certifications (same across locales) |

### How Translation Works

**Frontend Implementation**:
```javascript
// Set locale header (defaults to 'en')
fetch('https://businesslabels.test/api/materials/slug/premium-vinyl', {
  headers: {
    'Accept-Language': 'nl'  // or 'en'
  }
})
```

**Backend Logic** (`LocalizedModelValue::get()`):
1. Check `Accept-Language` header
2. If `en` (main locale): Return base model field
3. If `nl` (translation): 
   - Check `translations` table for matching record
   - Return translated value if exists
   - Fall back to base model value if not

**Database Query Example**:
```sql
-- Material with EN title "Premium Vinyl"
SELECT * FROM materials WHERE slug = 'premium-vinyl';

-- NL translation
SELECT * FROM translations 
WHERE translatable_type = 'App\\Models\\Material'
  AND translatable_id = 42
  AND language = 'nl';
  -- Returns: name = "Premium Vinyl", fields = {"description": "..."}
```

---

## 🏷️ Material Categories

Materials are linked to categories synced from WooCommerce. The API returns these as `categories` arrays.

### Category Structure

```
Material Categories (from WooCommerce):
  ├─ vinyl (id: 15)
  ├─ polyester (id: 16)
  ├─ paper (id: 17)
  └─ specialty (id: 18)
```

> **Note**: Internally implemented using Vanilo Taxonomy/Taxon system, but exposed as "categories" in the API.

### Backend Implementation

```php
// Internal relationship (Vanilo taxons)
public function taxons(): MorphToMany
{
    return $this->morphToMany(Taxon::class, 'model', 'model_taxons');
}

// API Resource returns as "categories"
public function categoriesValue(): array
{
    return $this->taxons->map(fn ($taxon) => [
        'id' => $taxon->id,
        'name' => $taxon->name,
        'slug' => $taxon->slug,
    ])->toArray();
}
```

**Example Data**:
```sql
SELECT 
  m.id, 
  m.title, 
  t.name as category_name,
  t.slug as category_slug
FROM materials m
JOIN model_taxons mt ON mt.model_id = m.id AND mt.model_type = 'App\\Models\\Material'
JOIN taxons t ON t.id = mt.taxon_id
WHERE m.id = 42;

-- Result:
-- id: 42, title: "Premium Vinyl", category_name: "Vinyl", category_slug: "vinyl"
```

### Filtering by Category

**Query Parameters**:
- `category_id=15` - Filter by category ID
- `category_slug=vinyl` - Filter by category slug (recommended for readability)

**Example**:
```javascript
// Filter by category slug
const response = await fetch(
  'https://businesslabels.test/api/materials?category_slug=vinyl&status=active'
);

// Filter by category ID  
const response2 = await fetch(
  'https://businesslabels.test/api/materials?category_id=15&per_page=50'
);
```

---

## 🔄 Data Synchronization

Materials are imported from **WooCommerce** (`businesslabels.nl`) via Laravel commands.

### Sync Command

```bash
php artisan app:sync-woocommerce-materials --chunk=20 --delay=100
```

**Process** (3 steps):

1. **Import Categories → Taxons** (synchronous)
   - Fetches from `/wp-json/wp/v2/categories?lang=all`
   - Creates/updates Taxons under "Material Category" taxonomy
   - Normalizes slugs (removes `-nl` suffix)
   - **Blocks** until complete (ensures taxons exist before materials)

2. **Import EN Materials** (queued)
   - Fetches from `/wp-json/wp/v2/material?lang=en`
   - Creates/updates base Material records
   - Links to Taxons via `$material->taxons()->sync($taxonIds)`
   - Recursively pages through all results

3. **Import NL Materials** (queued)
   - Fetches from `/wp-json/wp/v2/material?lang=nl`
   - Adds NL translations to existing materials
   - Uses `Translation::createForModel()` or `update()`

**Job Files**:
- `app/Console/Commands/SyncWooCommerceMaterials.php` (orchestrator)
- `app/Jobs/SyncWooCommerceMaterialCategoriesJob.php` (step 1)
- `app/Jobs/SyncWooCommerceMaterialsJob.php` (steps 2 & 3)

**Idempotency**: ✅ Safe to run multiple times
- Base models: `Material::updateOrCreate(['slug' => $slug], [...])`
- Translations: Checks existing, updates vs creates
- Taxons: `Taxon::updateOrCreate(['slug' => $slug], [...])`

---

## 📦 Response Format

### List Response (MaterialResource::collection)

```typescript
interface MaterialListResponse {
  data: MaterialItem[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

interface MaterialItem {
  id: number;
  title: string;                    // Localized
  subtitle: string | null;          // Localized
  slug: string;                     // Localized
  code: string | null;
  brand: string | null;
  status: 'active' | 'inactive' | 'draft';
  categories: MaterialCategory[];   // Material categories from WooCommerce
  created_at: string;               // ISO 8601
  
  // Related products using this material
  products: MaterialProduct[];
  products_count: number;
}

interface MaterialProduct {
  id: number;
  name: string;                     // Localized
  slug: string;                     // Localized
  sku: string | null;
  article_number: string | null;
  state: 'draft' | 'active' | 'inactive' | 'retired';
  price: number | null;
  stock: number;
  in_stock: boolean;
  main_image: string | null;        // Full URL
  updated_at: string;               // ISO 8601
}

interface MaterialCategory {
  id: number;
  name: string;                     // Localized
  slug: string;                     // Localized
}
```

### Detail Response (MaterialResource)

```typescript
interface MaterialDetailResponse {
  data: MaterialDetail;
}

interface MaterialDetail extends MaterialItem {
  // Additional detail-only fields
  description: string | null;       // HTML, localized
  specifications: Record<string, any> | null;  // JSON object
  print_method: string | null;
  base_material: string | null;
  finish: string | null;
  adhesive: string | null;
  supplier: string | null;
  supplier_reference: string | null;
  price_per_sq_meter: number | null; and Products

```javascript
const response = await fetch('https://businesslabels.test/api/materials/42');

const { data } = await response.json();

console.log(`Material: ${data.title} (${data.code})`);
console.log(`Categories:`, data.categories.map(c => c.name).join(', '));
console.log(`Description: ${data.description}`);
console.log(`Price: €${data.price_per_sq_meter}/m²`);
console.log(`Specifications:`, data.specifications);

// Display related products
console.log(`\nProducts using ${data.title}:`);
data.products.forEach(product => {
  console.log(`  - ${product.name} (${product.sku}): €${product.price}`);
  console.log(`    Stock: ${product.stock} (${product.in_stock ? 'Available' : 'Out of Stock'})`);
});
console.log(`Total products: ${data.products_count}`);
```

### Example 5: Paginate Through All Materials

```javascript
async function fetchAllMaterials() {
  let page = 1;
  let allMaterials = [];
  
  while (true) {
    const response = await fetch(
      `https://businesslabels.test/api/materials?page=${page}&per_page=100`
    );
    const { data, meta } = await response.json();
// Filter by category ID
const categoryId = 15;  // Vinyl category
const response = await fetch(
  `https://businesslabels.test/api/materials?category_id=${categoryId}&per_page=50`
);

const { data } = await response.json();

console.log(`Found ${data.length} vinyl materials`);

// Alternative: Filter by category slug (more readable)
const response2 = await fetch(
  `https://businesslabels.test/api/materials?category_slug=vinyl&per_page=50`
);
```

### Example 4: Get Material Detail with Categories

```javascript
const response = await fetch('https://businesslabels.test/api/materials/42');

const { data } = await response.json();

console.log(`Material: ${data.title} (${data.code})`);
console.log(`Categories:`, data.categories.map(c => c.name).join(', '));
console.log(`Description: ${data.description}`);
console.log(`Price: €${data.price_per_sq_meter}/m²`);
console.log(`Specifications:`, data.specifications);
```

### Example 5: Paginate Through All Materials

```javascript
async function fetchAllMaterials() {
  let page = 1;
  let allMaterials = [];
  
  while (true) {
    const response = await fetch(
      `https://businesslabels.test/api/materials?page=${page}&per_page=100`
    );
    const { data, meta } = await response.json();
    
    allMaterials = allMaterials.concat(data);
    
    if (p
**Issue**: MaterialController doesn't load `taxons` relationship.

**Impact**: Frontend cannot see which categories a material belongs to from WooCommerce sync.

**Workaround**: Use `POST /api/products/material-products` with `product_type` filter.

**Fix Required**:
```php
// app/Http/Controllers/Api/MaterialController.php
$materials = Material::query()
    ->with(['translations', 'category', 'taxons'])  // Add 'taxons'
    ->paginate();
```

**Resource Update Required**:
```php
// app/Http/Resources/Api/MaterialResource.php
public function toArray(Request $request): array
{
    return [
        // ... existing fields
        'taxons' => $this->when($this->relationLoaded('taxons'), 
            $this->taxons->map(fn($taxon) => [
                'id' => $taxon->id,
                'name' => $taxon->name,
                'slug' => $taxon->slug,
            ])
        ),
    5tus**: `material_category_id` is legacy and may be `NULL` for synced materials.

**Recommendation**: Use `taxons` relationship for all category filtering.

### 3. **Specifications Format Not Standardized** ⚠️
**Use `taxon_id` or `taxon_slug` query parameters for all category filtering.** The API now properly loads and returns taxons in all responses
**Issue**: `specifications` is a free-form JSON field with no schema validation.
2
**Impact**: Frontend needs defensive parsing.

**Recommendation**:
```typescript
// Always check for expected keys
const specs = material.specifications || {};
const thickness = specs.thickness ?? 'Not specified';
```

### 2. **No Search Endpoint** ❌

**Issue**: No full-text search for materials by title/description.
3
**Workaround**: Use `/api/search?query=vinyl` (if implemented) or client-side filtering.

**Future**: Implement Laravel Scout for Elasticsearch/Meilisearch.

### 3. **No Media/Images Support** ❌

**Issue**: Materials don't have image attachments (unlike products/printers).
4
**Status**: By design (materials are technical specs, not customer-facing).

---

## 📚 Related Documentation

- **Products API**: See `docs/API-PRODUCTS-ENDPOINTS.md`
- **Printers API**: See `docs/API-PRINTERS-ENDPOINTS.md`
- **WooCommerce Sync**: See `AGENTS.md` and `CLAUDE.md`
- **Translation System**: Vanilo Translation package docs

---

## 🔗 API Route Registration

**File**: `routes/api.php:72-76`

```php
Route::prefix('materials')->name('materials.')->controller(MaterialController::class)->group(function () {
    Route::get('/', 'index')->name('index');
    Route::get('slug/{slug}', 'showBySlug')->name('show-by-slug');
    Route::get('{id}', 'show')->whereNumber('id')->name('show');
});
```

---

**Questions?** Contact the backend team or check the source files referenced throughout this document.
