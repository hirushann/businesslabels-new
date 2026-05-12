# Frontend Integration Guide: Printer & Product Compatibility

**Last Updated:** May 12, 2026  
**API Version:** v1  
**Status:** Production Ready ✅

## Overview

This guide covers the new compatibility matching system between printers and products using Vanilo properties. All endpoints use **Vanilo properties** as the canonical source for compatibility matching.

---

## Breaking Changes

### 1. Printer Response Structure Changed

**Old Structure (Deprecated):**
```json
{
  "data": {
    "id": 1,
    "title": "Godex ZX1200i+",
    "meta": { /* properties here */ }
  }
}
```

**New Structure (Current):**
```json
{
  "data": {
    "id": 1,
    "title": "Godex ZX1200i+",
    "properties": { /* Vanilo properties here */ }
  }
}
```

**Migration:**
- Replace all references to `printer.meta` with `printer.properties`
- The `meta` field has been removed from all printer responses
- `properties` contains the same data structure

---

## API Endpoints

### Base URL
```
https://businesslabels.test/api
```

All compatibility endpoints use **POST** requests with JSON payloads.

---

## 1. Get Printer Details + Compatible Products

**Use Case:** Printer detail page showing printer specs and compatible products

### Step 1: Get Printer Details
```http
GET /api/printers/{id}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "title": "Godex ZX1200i+",
    "subtitle": "Industriële 4 inch Thermal Transfer labelprinter",
    "slug": "godex-zx1200iplus",
    "excerpt": null,
    "content": "<p>...</p>",
    "status": "published",
    "template": "default",
    "image": "http://businesslabels.test/storage/68/ZX1200-front.png",
    "thumbnail": "http://businesslabels.test/storage/68/ZX1200-thumb.png",
    "properties": {
      "printmethode": ["TD", "TT"],
      "breedte": ["25", "26", "27", ..., "118", "25.4"],
      "label-breedte-min": ["25.4"],
      "label-breedte-max": ["118"],
      "kern": ["76", "38", "Fan-fold"],
      "buiten-diameter": ["101", "203", "66", "75", "127", "152"],
      "max-buiten-diameter": ["203"],
      "detectie": ["GAP", "Blackmark"],
      "labeltype": ["Rollen", "Fan-fold"],
      "printer-subtitle": ["Industriële 4 inch Thermal Transfer labelprinter"]
    },
    "created_at": "2026-01-15T10:30:00.000Z",
    "updated_at": "2026-05-12T08:45:00.000Z"
  }
}
```

### Step 2: Get Compatible Products for This Printer
```http
POST /api/products/printer-products
Content-Type: application/json

{
  "printer_id": 1,
  "product_type": "labels",  // optional: "labels" | "ink" | omit for all
  "per_page": 20             // optional: default 15, max 100
}
```

**Response:**
```json
{
  "printer": {
    "id": 1,
    "title": "Godex ZX1200i+",
    "properties": { /* same as above */ }
  },
  "products": {
    "data": [
      {
        "id": 42,
        "name": "A6 verzendlabels, 100x150 mm",
        "slug": "a6-verzendlabels-100x150mm",
        "type": "simple",
        "price": "€12.50",
        "image": "...",
        "properties": {
          "printmethode": ["TD"],
          "breedte": ["102"],
          "hoogte": ["150"],
          "kern": ["76"],
          "buiten-diameter": ["203"],
          "materiaal": ["Papier"],
          "afwerking": ["MAT"],
          "lijm": ["Permanent"]
        }
      }
      // ... more products
    ],
    "meta": {
      "current_page": 1,
      "from": 1,
      "last_page": 5,
      "per_page": 20,
      "to": 20,
      "total": 95
    }
  }
}
```

---

## 2. Get Product Details + Compatible Printers

**Use Case:** Product detail page showing product specs and compatible printers

### Step 1: Get Product Details
```http
GET /api/products/simple/{id}
// or
GET /api/products/variable/{id}
```

### Step 2: Get Compatible Printers for This Product
```http
POST /api/products/product-printers
Content-Type: application/json

{
  "product_id": 42,
  "per_page": 20,           // optional: default 15, max 100
  "status": "published"     // optional: "published" | "draft", default "published"
}
```

**Response:**
```json
{
  "product": {
    "id": 42,
    "name": "A6 verzendlabels, 100x150 mm",
    "properties": {
      "printmethode": ["TD"],
      "breedte": ["102"],
      "kern": ["76"],
      "buiten-diameter": ["203"]
    }
  },
  "printers": {
    "data": [
      {
        "id": 2,
        "title": "Godex DT4x PRO",
        "subtitle": "Desktop labelprinter",
        "slug": "godex-dt4x-pro",
        "image": "...",
        "thumbnail": "...",
        "properties": {
          "printmethode": ["TD"],
          "breedte": ["25", "30", ..., "110"],
          "label-breedte-min": ["25.4"],
          "label-breedte-max": ["110"],
          "kern": ["25", "76", "38"],
          "buiten-diameter": ["203"],
          "max-buiten-diameter": ["203"]
        }
      }
      // ... more printers
    ],
    "meta": {
      "current_page": 1,
      "from": 1,
      "last_page": 6,
      "per_page": 20,
      "to": 20,
      "total": 101
    }
  }
}
```

---

## 3. Get Products by Material

**Use Case:** Material category page showing all products made from that material

```http
POST /api/products/material-products
Content-Type: application/json

{
  "material_id": 5,
  "product_type": "labels",  // optional: "labels" | "ink" | omit for all
  "per_page": 20             // optional
}
```

**Response:**
```json
{
  "material": {
    "id": 5,
    "name": "Gloss Paper",
    "slug": "gloss-paper",
    "category": {
      "id": 2,
      "name": "Paper Materials"
    }
  },
  "products": {
    "data": [ /* products array */ ],
    "meta": { /* pagination */ }
  }
}
```

---

## 4. Check Specific Compatibility

**Use Case:** Quick check if a specific product works with a specific printer (e.g., cart validation, product recommendations)

```http
POST /api/products/compatibility
Content-Type: application/json

{
  "product_id": 42,
  "printer_id": 1
}
```

**Response:**
```json
{
  "compatibility": true
}
```

**OR**

```json
{
  "compatibility": false
}
```

---

## Matching Logic Summary

### How Compatibility is Determined

A product is compatible with a printer when **ALL** of these conditions are met:

1. **Print Method Match**
   - Product's `printmethode` must be IN printer's supported methods
   - Example: Product "TD" matches Printer ["TD", "TT"] ✅

2. **Width Match**
   - Product `breedte` (width) must be:
     - Within printer's `label-breedte-min` to `label-breedte-max` range, OR
     - In printer's explicit `breedte` value set
   - Example: Product 102mm matches Printer range [25.4-118mm] ✅

3. **Core Diameter Match**
   - Product `kern` must be IN printer's supported `kern` values
   - Supports both numeric and text values (e.g., "Fan-fold")
   - Example: Product "76" matches Printer ["76", "38", "Fan-fold"] ✅

4. **Outer Diameter Match**
   - Product `buiten-diameter` must be:
     - IN printer's `buiten-diameter` value set, OR
     - ≤ printer's `max-buiten-diameter`
   - Example: Product 203mm matches Printer max 203mm ✅

**If ANY condition fails, the product is NOT compatible with the printer.**

---

## Frontend Implementation Examples

### React/Next.js Example

```typescript
// types/api.ts
export interface PrinterProperties {
  printmethode?: string[];
  breedte?: string[];
  'label-breedte-min'?: string[];
  'label-breedte-max'?: string[];
  kern?: string[];
  'buiten-diameter'?: string[];
  'max-buiten-diameter'?: string[];
  detectie?: string[];
  labeltype?: string[];
  'printer-subtitle'?: string[];
}

export interface Printer {
  id: number;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  content: string | null;
  status: string;
  template: string;
  image: string | null;
  thumbnail: string | null;
  properties: PrinterProperties;
  created_at: string;
  updated_at: string;
}

export interface ProductProperties {
  printmethode?: string[];
  breedte?: string[];
  hoogte?: string[];
  kern?: string[];
  'buiten-diameter'?: string[];
  materiaal?: string[];
  afwerking?: string[];
  lijm?: string[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  type: 'simple' | 'variable';
  price: string;
  image: string | null;
  properties: ProductProperties;
  // ... other fields
}

export interface CompatibilityResponse {
  compatibility: boolean;
}

export interface PrinterProductsResponse {
  printer: Printer;
  products: {
    data: Product[];
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
  };
}

export interface ProductPrintersResponse {
  product: Product;
  printers: {
    data: Printer[];
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
  };
}
```

```typescript
// lib/api/compatibility.ts
import { apiClient } from './client';

export async function getPrinterProducts(
  printerId: number,
  options?: {
    productType?: 'labels' | 'ink';
    perPage?: number;
  }
): Promise<PrinterProductsResponse> {
  const response = await apiClient.post('/products/printer-products', {
    printer_id: printerId,
    product_type: options?.productType,
    per_page: options?.perPage || 20,
  });
  return response.data;
}

export async function getProductPrinters(
  productId: number,
  options?: {
    perPage?: number;
    status?: 'published' | 'draft';
  }
): Promise<ProductPrintersResponse> {
  const response = await apiClient.post('/products/product-printers', {
    product_id: productId,
    per_page: options?.perPage || 20,
    status: options?.status || 'published',
  });
  return response.data;
}

export async function checkCompatibility(
  productId: number,
  printerId: number
): Promise<boolean> {
  const response = await apiClient.post<CompatibilityResponse>(
    '/products/compatibility',
    {
      product_id: productId,
      printer_id: printerId,
    }
  );
  return response.data.compatibility;
}
```

```tsx
// components/PrinterDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getPrinter } from '@/lib/api/printers';
import { getPrinterProducts } from '@/lib/api/compatibility';

export default function PrinterDetailPage() {
  const { id } = useParams();
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [compatibleProducts, setCompatibleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch printer details
        const printerData = await getPrinter(Number(id));
        setPrinter(printerData);

        // Fetch compatible products
        const { products } = await getPrinterProducts(Number(id), {
          productType: 'labels',
          perPage: 12,
        });
        setCompatibleProducts(products.data);
      } catch (error) {
        console.error('Failed to load printer data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!printer) return <NotFound />;

  return (
    <div className="printer-detail">
      <div className="printer-header">
        <img src={printer.image} alt={printer.title} />
        <h1>{printer.title}</h1>
        <p>{printer.subtitle}</p>
      </div>

      {/* Printer Specifications */}
      <div className="printer-specs">
        <h2>Specificaties</h2>
        <dl>
          <dt>Print Methode:</dt>
          <dd>{printer.properties.printmethode?.join(', ')}</dd>
          
          <dt>Label Breedte:</dt>
          <dd>
            {printer.properties['label-breedte-min']?.[0]} - 
            {printer.properties['label-breedte-max']?.[0]} mm
          </dd>
          
          <dt>Kern Diameter:</dt>
          <dd>{printer.properties.kern?.join(', ')} mm</dd>
          
          <dt>Max Rol Diameter:</dt>
          <dd>{printer.properties['max-buiten-diameter']?.[0]} mm</dd>
        </dl>
      </div>

      {/* Compatible Products */}
      <div className="compatible-products">
        <h2>Compatibele Labels</h2>
        <div className="product-grid">
          {compatibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

```tsx
// components/ProductDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getProduct } from '@/lib/api/products';
import { getProductPrinters } from '@/lib/api/compatibility';

export default function ProductDetailPage() {
  const { type, id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [compatiblePrinters, setCompatiblePrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch product details
        const productData = await getProduct(type as string, Number(id));
        setProduct(productData);

        // Fetch compatible printers
        const { printers } = await getProductPrinters(Number(id), {
          perPage: 8,
        });
        setCompatiblePrinters(printers.data);
      } catch (error) {
        console.error('Failed to load product data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [type, id]);

  if (loading) return <LoadingSpinner />;
  if (!product) return <NotFound />;

  return (
    <div className="product-detail">
      <div className="product-header">
        <img src={product.image} alt={product.name} />
        <h1>{product.name}</h1>
        <p className="price">{product.price}</p>
      </div>

      {/* Product Specifications */}
      <div className="product-specs">
        <h2>Specificaties</h2>
        <dl>
          <dt>Print Methode:</dt>
          <dd>{product.properties.printmethode?.[0]}</dd>
          
          <dt>Afmetingen:</dt>
          <dd>
            {product.properties.breedte?.[0]} × {product.properties.hoogte?.[0]} mm
          </dd>
          
          <dt>Kern:</dt>
          <dd>{product.properties.kern?.[0]} mm</dd>
          
          <dt>Materiaal:</dt>
          <dd>{product.properties.materiaal?.[0]}</dd>
          
          <dt>Afwerking:</dt>
          <dd>{product.properties.afwerking?.[0]}</dd>
        </dl>
      </div>

      {/* Compatible Printers */}
      <div className="compatible-printers">
        <h2>Compatibele Printers</h2>
        <p className="subtitle">
          Deze labels werken met {compatiblePrinters.length} printers
        </p>
        <div className="printer-grid">
          {compatiblePrinters.map((printer) => (
            <PrinterCard key={printer.id} printer={printer} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Error Handling

### Common Error Responses

**404 Not Found:**
```json
{
  "message": "Printer not found"
}
// or
{
  "message": "Product not found"
}
```

**422 Validation Error:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "printer_id": ["The printer id field is required."],
    "per_page": ["The per page must be between 1 and 100."]
  }
}
```

**500 Server Error:**
```json
{
  "message": "Error matching products",
  "error": "Internal server error"
}
```

### Example Error Handling

```typescript
try {
  const data = await getPrinterProducts(printerId);
  return data;
} catch (error) {
  if (error.response?.status === 404) {
    // Handle not found
    showNotification('Printer niet gevonden');
  } else if (error.response?.status === 422) {
    // Handle validation error
    showNotification('Ongeldige invoer');
  } else {
    // Handle other errors
    showNotification('Er ging iets mis. Probeer het opnieuw.');
  }
  throw error;
}
```

---

## Migration Checklist

- [ ] Update all `printer.meta` references to `printer.properties`
- [ ] Implement `getPrinterProducts()` on printer detail pages
- [ ] Implement `getProductPrinters()` on product detail pages
- [ ] Add compatibility checking in cart/checkout flow
- [ ] Update TypeScript types to use `properties` field
- [ ] Test pagination on compatibility endpoints
- [ ] Add loading states for compatibility fetches
- [ ] Handle empty results (no compatible products/printers)
- [ ] Update any cached API responses
- [ ] Update E2E tests with new field names

---

## Performance Considerations

1. **Pagination:** All list endpoints support pagination. Use `per_page` to control response size.
   
2. **Caching:** Consider caching compatibility results per product/printer pair.

3. **Lazy Loading:** Load compatible products/printers on demand (e.g., on tab click) rather than on initial page load.

4. **Debouncing:** If implementing real-time compatibility checks during product selection, debounce requests.

5. **Preloading:** For frequently accessed printers, consider preloading compatible products.

---

## Testing

### Example Test Cases

```typescript
describe('Printer Compatibility API', () => {
  it('should fetch compatible products for a printer', async () => {
    const response = await getPrinterProducts(1, { perPage: 5 });
    
    expect(response.printer.id).toBe(1);
    expect(response.products.data).toHaveLength(5);
    expect(response.products.meta.total).toBeGreaterThan(0);
  });

  it('should fetch compatible printers for a product', async () => {
    const response = await getProductPrinters(42, { perPage: 5 });
    
    expect(response.product.id).toBe(42);
    expect(response.printers.data).toHaveLength(5);
    expect(response.printers.meta.total).toBeGreaterThan(0);
  });

  it('should check compatibility between product and printer', async () => {
    const isCompatible = await checkCompatibility(42, 1);
    
    expect(typeof isCompatible).toBe('boolean');
  });

  it('should filter products by type', async () => {
    const response = await getPrinterProducts(1, { 
      productType: 'labels',
      perPage: 10 
    });
    
    // All products should be labels
    expect(response.products.data.every(p => 
      p.properties.printmethode // has printmethode = is a label
    )).toBe(true);
  });
});
```

---

## Support

For questions or issues with the compatibility API:

1. Check the comprehensive test results: `docs/PRINTER_PRODUCT_COMPATIBILITY_TEST_RESULTS.md`
2. Review the technical verification doc: `docs/PRINTER_PRODUCT_COMPATIBILITY_VERIFICATION.md`
3. Check printer property sync documentation: `docs/PRINTER_PRODUCT_PROPERTY_SYNC.md`

**Backend Team Contact:** Laravel Development Team  
**API Version:** v1  
**Last Updated:** May 12, 2026
