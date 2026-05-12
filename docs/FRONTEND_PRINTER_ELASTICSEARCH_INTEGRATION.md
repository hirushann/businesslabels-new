# Frontend Printer Elasticsearch Integration Guide

## Overview

Printers are now indexed in Elasticsearch for high-performance searching and filtering on the `/finder` route. This guide covers how to query the printer index from the Next.js frontend.

## Index Details

- **Index Name**: `business_labels_catalog_printers` (with `SCOUT_PREFIX`)
- **Total Printers**: 201
- **Model**: `App\Models\Post` (filtered by `post_type = 'printer'`)

## Indexed Fields

```typescript
interface PrinterSearchDocument {
  id: number;
  title: string[];              // Multi-locale: ["English Title", "Dutch Title"]
  title_sort: string;            // Lowercase for sorting
  subtitle: string[];            // Multi-locale
  slug: string[];                // Multi-locale
  excerpt: string[];             // Multi-locale
  content: string[];             // Multi-locale (HTML)
  status: "published" | "draft";
  main_image: string | null;     // Full URL to printer image
  properties: {
    // Dynamic object with all printer meta fields
    kern?: string[];             // e.g., ["38 - 76,2 mm"]
    druktype?: string[];         // e.g., ["TD", "TT"]
    detectie?: string[];         // e.g., ["GAP", "Blackmark", "Endless"]
    buiten_diameter?: string[];  // e.g., ["66", "75", "101", "127", "152", "203"]
    width?: string[];            // e.g., ["25", "26", "27", ...]
    label_breedte?: string[];    // e.g., ["Min 25,4 mm, Max 118 mm."]
    label_type?: string[];       // e.g., ["Thermal Direct & Thermal Transfer"]
    // ... any other meta fields from post_meta
  };
  product_ids: number[];         // Compatible product IDs
  created_at_timestamp: number;
}
```

## API Endpoint (Backend)

You'll need to create a new API endpoint in Laravel to proxy Elasticsearch queries:

### Route Definition

**`routes/api.php`:**
```php
Route::get('/printers/search', [PrinterSearchController::class, 'search']);
```

### Controller Example

**`app/Http/Controllers/API/PrinterSearchController.php`:**
```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;

class PrinterSearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        $filters = $request->input('filters', []);
        $page = (int) $request->input('page', 1);
        $perPage = min((int) $request->input('per_page', 20), 100);

        $searchQuery = Post::search($query)
            ->where('post_type', 'printer')
            ->where('status', 'published');

        // Apply property filters
        if (!empty($filters)) {
            foreach ($filters as $key => $values) {
                if (is_array($values) && !empty($values)) {
                    // For nested properties field
                    $searchQuery->where("properties.{$key}", $values);
                }
            }
        }

        $results = $searchQuery
            ->paginate($perPage, 'page', $page);

        return response()->json([
            'data' => $results->items(),
            'meta' => [
                'current_page' => $results->currentPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
                'last_page' => $results->lastPage(),
            ],
        ]);
    }
}
```

## Frontend Integration (Next.js)

### 1. API Client Function

**`src/lib/api/printers.js`:**
```javascript
/**
 * Search printers using Elasticsearch
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search query
 * @param {Object} params.filters - Property filters (e.g., { druktype: ['TT'], width: ['25', '26'] })
 * @param {number} params.page - Page number
 * @param {number} params.per_page - Results per page
 * @returns {Promise<PrinterSearchResponse>}
 */
export async function searchPrinters({ q = '', filters = {}, page = 1, per_page = 20 }) {
  const params = new URLSearchParams({
    q,
    page: page.toString(),
    per_page: per_page.toString(),
  });

  // Add filters
  if (filters && Object.keys(filters).length > 0) {
    params.append('filters', JSON.stringify(filters));
  }

  const response = await fetch(`${API_BASE_URL}/printers/search?${params}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Printer search failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get printer by ID (regular Laravel endpoint, not ES)
 * @param {number} id - Printer ID
 * @returns {Promise<Printer>}
 */
export async function getPrinter(id) {
  const response = await fetch(`${API_BASE_URL}/printers/${id}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Printer fetch failed: ${response.statusText}`);
  }

  return response.json();
}
```

### 2. Type Definitions

**`src/lib/api/types.js`:**
```javascript
/**
 * @typedef {Object} PrinterSearchResult
 * @property {number} id
 * @property {string[]} title - Multi-locale titles
 * @property {string} title_sort
 * @property {string[]} subtitle
 * @property {string[]} slug
 * @property {string[]} excerpt
 * @property {string[]} content
 * @property {string} status
 * @property {string|null} main_image - Full URL to printer image
 * @property {Object.<string, string[]>} properties - Dynamic printer properties
 * @property {number[]} product_ids
 * @property {number} created_at_timestamp
 */

/**
 * @typedef {Object} PrinterSearchResponse
 * @property {PrinterSearchResult[]} data
 * @property {Object} meta
 * @property {number} meta.current_page
 * @property {number} meta.per_page
 * @property {number} meta.total
 * @property {number} meta.last_page
 */
```

### 3. Finder Page Implementation

**`src/app/finder/page.jsx`:**
```jsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchPrinters } from '@/lib/api/printers';

export default function FinderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    druktype: searchParams.getAll('druktype') || [],
    kern: searchParams.getAll('kern') || [],
    detectie: searchParams.getAll('detectie') || [],
    width: searchParams.getAll('width') || [],
  });
  
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  // Fetch printers
  useEffect(() => {
    const fetchPrinters = async () => {
      setLoading(true);
      try {
        const response = await searchPrinters({
          q: searchQuery,
          filters,
          page,
          per_page: 20,
        });
        
        setPrinters(response.data);
        setMeta(response.meta);
      } catch (error) {
        console.error('Failed to fetch printers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrinters();
  }, [searchQuery, filters, page]);

  // Update URL with filters
  const updateURL = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (page > 1) params.set('page', page.toString());
    
    Object.entries(filters).forEach(([key, values]) => {
      values.forEach(value => params.append(key, value));
    });
    
    router.push(`/finder?${params.toString()}`, { scroll: false });
  };

  // Toggle filter
  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return { ...prev, [key]: updated };
    });
    setPage(1); // Reset to first page
  };

  useEffect(() => {
    updateURL();
  }, [searchQuery, filters, page]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Printer Finder</h1>
      
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search printers..."
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">Filters</h2>
            
            {/* Print Type Filter */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Print Type</h3>
              {['TD', 'TT'].map(type => (
                <label key={type} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={filters.druktype?.includes(type)}
                    onChange={() => toggleFilter('druktype', type)}
                    className="mr-2"
                  />
                  {type}
                </label>
              ))}
            </div>

            {/* Width Filter */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Width (mm)</h3>
              {['25', '50', '100', '118'].map(width => (
                <label key={width} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={filters.width?.includes(width)}
                    onChange={() => toggleFilter('width', width)}
                    className="mr-2"
                  />
                  {width}mm
                </label>
              ))}
            </div>

            {/* Detection Filter */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Detection</h3>
              {['GAP', 'Blackmark', 'Endless'].map(det => (
                <label key={det} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={filters.detectie?.includes(det)}
                    onChange={() => toggleFilter('detectie', det)}
                    className="mr-2"
                  />
                  {det}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="mb-4 text-gray-600">
                {meta?.total} printers found
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {printers.map(printer => (
                  <div key={printer.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {printer.main_image && (
                      <img
                        src={printer.main_image}
                        alt={printer.title[0]}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">
                        {printer.title[0]}
                      </h3>
                      {printer.subtitle?.[0] && (
                        <p className="text-sm text-gray-600 mb-2">
                          {printer.subtitle[0]}
                        </p>
                      )}
                      <a
                        href={`/printers/${printer.slug[0]}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Details →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {page} of {meta.last_page}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                    disabled={page === meta.last_page}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
```

## Direct Elasticsearch Queries (Advanced)

If you need to query Elasticsearch directly (not recommended for production), here are examples:

### Basic Search
```bash
curl -X POST "http://localhost:9200/business_labels_catalog_printers/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "match": {
        "title": "Zebra"
      }
    },
    "size": 20
  }'
```

### Search with Multiple Fields
```json
{
  "query": {
    "multi_match": {
      "query": "thermal transfer",
      "fields": ["title", "subtitle", "content"]
    }
  }
}
```

### Filter by Property (Nested Query Required)
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "nested": {
            "path": "properties",
            "query": {
              "term": {
                "properties.druktype": "TT"
              }
            }
          }
        }
      ]
    }
  }
}
```

### Multiple Property Filters
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "nested": {
            "path": "properties",
            "query": {
              "terms": {
                "properties.druktype": ["TD", "TT"]
              }
            }
          }
        },
        {
          "nested": {
            "path": "properties",
            "query": {
              "terms": {
                "properties.width": ["25", "26", "27"]
              }
            }
          }
        }
      ]
    }
  }
}
```

### Search + Filter + Sort
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "title": "Godex"
          }
        }
      ],
      "filter": [
        {
          "nested": {
            "path": "properties",
            "query": {
              "term": {
                "properties.druktype": "TT"
              }
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "title_sort": "asc"
    }
  ],
  "size": 20,
  "from": 0
}
```

## Available Property Filters

Based on the printer metadata, you can filter by:

- `kern` - Core diameter (e.g., "38 - 76,2 mm")
- `druktype` - Print type (e.g., "TD", "TT")
- `detectie` - Detection method (e.g., "GAP", "Blackmark", "Endless")
- `buiten_diameter` - Outer diameter (e.g., "66", "75", "101", "127", "152", "203")
- `width` - Print width range (e.g., "25" to "118")
- `label_breedte` - Label width description
- `label_type` - Label type description
- `max_buiten_diameter` - Maximum outer diameter

## Performance Notes

1. **Nested Queries**: The `properties` field uses nested mapping, so you must use `nested` queries to filter by properties
2. **Caching**: Consider implementing client-side caching for filter options
3. **Debouncing**: Implement search input debouncing (300-500ms) to reduce API calls
4. **Pagination**: Always paginate results (20-50 items per page recommended)
5. **Locale Handling**: Title, subtitle, and other fields are arrays with `[en, nl]` values - use the first item or locale-specific selection

## Testing the Integration

1. Start Elasticsearch: `make elastic-up`
2. Reindex printers: `php artisan scout:import "App\Models\Post"`
3. Test API endpoint: `/api/printers/search?q=Zebra`
4. Navigate to finder page: `http://localhost:3000/finder`

## Troubleshooting

### No Results Returned
- Check index exists: `curl http://localhost:9200/_cat/indices`
- Verify printer count: `curl http://localhost:9200/business_labels_catalog_printers/_count`
- Check printer is published: Only `status = 'published'` printers are indexed

### Property Filters Not Working
- Ensure you're using nested queries for the `properties` field
- Check the actual property keys in indexed data match your filter keys
- Property values are arrays, use `terms` or `match` queries

### Locale Issues
- Multi-locale fields return arrays: `["English Value", "Dutch Value"]`
- Always access the first element or implement locale selection logic
- Use `LocalizedModelValue` helper on the backend for consistent locale handling

## See Also

- [Product Printer Compatibility Integration](./FRONTEND_PRINTER_COMPATIBILITY_INTEGRATION.md)
- [Laravel Scout Documentation](https://laravel.com/docs/scout)
- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
