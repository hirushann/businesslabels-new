# Backend Instructions: Elasticsearch Index for Finder Page

## Overview
The `/finder` page now queries Elasticsearch directly (like `/products`), showing a searchable, filterable list of printers.

## Required Elasticsearch Index

### Printers Index
**Index name:** `{SCOUT_PREFIX}catalog_printers`

**Required fields:**
```
- id (integer)
- title (text array for multi-locale: ["English Title", "Dutch Title"])
- title_sort (keyword, lowercase for sorting)
- subtitle (text array, optional)
- slug (text array for multi-locale)
- excerpt (text array, optional)
- content (text array, optional)
- status ("published" | "draft")
- properties (object with nested fields):
  - druktype (keyword array) - e.g., ["TD", "TT"]
  - kern (keyword array) - e.g., ["38 - 76,2 mm"]
  - detectie (keyword array) - e.g., ["GAP", "Blackmark"]
  - width (keyword array) - e.g., ["25", "26", "50"]
  - buiten_diameter (keyword array) - e.g., ["66", "75", "101"]
- image (keyword, optional)
- main_image (keyword, optional)
- price (float, optional)
- original_price (float, optional)
- created_at (date)
- created_at_timestamp (long, for sorting)
```

## Implementation Steps

1. **Create/Update Printer Scout Model**
   ```php
   // In your Printer or Post model (for post_type='printer')
   use Laravel\Scout\Searchable;
   
   class Printer extends Model
   {
       use Searchable;
       
       public function toSearchableArray()
       {
           return [
               'id' => $this->id,
               'title' => [$this->title_en, $this->title_nl], // Multi-locale
               'title_sort' => strtolower($this->title_en),
               'subtitle' => [$this->subtitle_en, $this->subtitle_nl],
               'slug' => [$this->slug_en, $this->slug_nl],
               'excerpt' => [$this->excerpt_en, $this->excerpt_nl],
               'content' => [$this->content_en, $this->content_nl],
               'status' => $this->status,
               'properties' => [
                   'druktype' => $this->getMeta('druktype'),
                   'kern' => $this->getMeta('kern'),
                   'detectie' => $this->getMeta('detectie'),
                   'width' => $this->getMeta('width'),
                   'buiten_diameter' => $this->getMeta('buiten_diameter'),
                   // Add other properties as needed
               ],
               'image' => $this->image,
               'price' => $this->price,
               'original_price' => $this->original_price,
               'created_at' => $this->created_at,
               'created_at_timestamp' => $this->created_at->timestamp,
           ];
       }
   }
   ```

2. **Index the Data**
   ```bash
   php artisan scout:import "App\Models\Printer"
   # or if using Post model with printer type
   php artisan scout:import "App\Models\Post" --where="post_type=printer"
   ```

## ES Field Mapping Requirements

The `properties` field should allow nested keyword arrays for filtering:

```json
{
  "mappings": {
    "properties": {
      "properties": {
        "type": "object",
        "properties": {
          "druktype": { "type": "keyword" },
          "kern": { "type": "keyword" },
          "detectie": { "type": "keyword" },
          "width": { "type": "keyword" },
          "buiten_diameter": { "type": "keyword" }
        }
      },
      "title": { "type": "text" },
      "title_sort": { "type": "keyword" },
      "status": { "type": "keyword" },
      "created_at_timestamp": { "type": "long" }
    }
  }
}
```

## Testing

After indexing, verify with:
```bash
# Check printer index exists and has data
curl -X GET "localhost:9200/{prefix}catalog_printers/_search?pretty" -H 'Content-Type: application/json' -d '
{
  "query": { "match_all": {} },
  "size": 1
}'

# Test property filter
curl -X GET "localhost:9200/{prefix}catalog_printers/_search?pretty" -H 'Content-Type: application/json' -d '
{
  "query": {
    "bool": {
      "must": [
        { "term": { "status": "published" } }
      ],
      "filter": [
        { "terms": { "properties.druktype": ["TT"] } }
      ]
    }
  }
}'
```

## Frontend Implementation

The frontend now directly queries ES via:
- `/api/printers` - Returns printer search results with filters
- Server-side: `src/lib/search/printers.ts` - Direct ES queries
- Component: `src/components/FinderListing.tsx` - Listing with search & filters
- Page: `/finder` - Shows printer listing (not printer selection)

## Notes

- Frontend queries ES directly via Next.js server components
- No Laravel API proxy needed for printer listing
- Individual printer detail pages (`/printers/[slug]`) still use Laravel API
- Properties are stored as keyword arrays to support multi-value filters
- Multi-locale fields (title, slug, etc.) are arrays: `[en_value, nl_value]`

