# Category Hierarchy Indexing Implementation

## Overview

Enhanced Elasticsearch indexing for product categories with full hierarchical structure. Products now index complete category information including parent-child relationships, hierarchy levels, and breadcrumb paths for improved filtering and search capabilities.

## Changes Made

### 1. Product Model (`app/Models/Product.php`)

#### Elasticsearch Mapping
Added new `categories` nested field with full hierarchy structure:
- `id`: Category ID (integer)
- `name`: Localized category name (text array)
- `slug`: Localized category slug (keyword array)
- `level`: Hierarchy level (0 = root, 1 = child, 2 = grandchild, etc.)
- `hierarchy_path`: Full path slug string (e.g., "office-supplies/labels/thermal")
- `parent`: Nested parent object with id, name, slug
- `breadcrumb_ids`: Array of all ancestor IDs including self
- `breadcrumb_slugs`: Array of all ancestor slugs including self

#### New Methods
- `categoriesHierarchyForSearch()`: Builds hierarchy data for each product category
- `buildCategoryHierarchy()`: Constructs individual category hierarchy object

#### Eager Loading
Updated `makeAllSearchableUsing()` to eagerly load:
- `taxons:id,slug,parent_id,name`
- `taxons.parent:id,slug,parent_id,name`
- `taxons.parent.parent:id,slug,parent_id,name`
- `taxons.translations:...` (for localized names/slugs at all levels)

### 2. MasterProduct Model (`app/Models/MasterProduct.php`)

Applied identical enhancements:
- Added `categories` nested field to mapping
- Implemented `categoriesHierarchyForSearch()` and `buildCategoryHierarchy()` methods
- Updated eager loading with taxon translations at all levels

### 3. Documentation Updates

#### Scout Frontend Guide (`docs/SCOUT_INDEX_FRONTEND_GUIDE.md`)

Added comprehensive filtering documentation:

**Single Category Filter:**
```ts
const filters = [{
  nested: {
    path: 'categories',
    query: { bool: { must: [{ term: { 'categories.id': 123 } }] } },
  },
}];
```

**Multi-Slug Filter:**
```ts
const filters = [{
  nested: {
    path: 'categories',
    query: { terms: { 'categories.slug.keyword': ['labels', 'thermal'] } },
  },
}];
```

**Hierarchy Level Filter:**
```ts
const filters = [{
  nested: {
    path: 'categories',
    query: { term: { 'categories.level': 1 } },
  },
}];
```

**Breadcrumb Path Filter:**
```ts
const filters = [{
  nested: {
    path: 'categories',
    query: { terms: { 'categories.breadcrumb_ids': [1, 2, 3, 12] } },
  },
}];
```

## Data Structure Example

A product under: `Office Supplies > Labels > Thermal Labels`

```ts
{
  categories: [
    {
      id: 3,
      name: ["Thermal Labels"],
      slug: ["thermal-labels"],
      level: 2,
      hierarchy_path: "office-supplies/labels/thermal-labels",
      parent: {
        id: 2,
        name: ["Labels"],
        slug: ["labels"]
      },
      breadcrumb_ids: [1, 2, 3],
      breadcrumb_slugs: ["office-supplies", "labels", "thermal-labels"]
    }
  ]
}
```

## Usage for Filtering

### Frontend Benefits

1. **Hierarchical Navigation**: Build breadcrumb UI showing full paths
2. **Multi-level Filtering**: Filter by any category level (parent, child, grandchild)
3. **Smart Suggestions**: Suggest related categories at different levels
4. **Localized Support**: All names and slugs are already localized (en, nl)

### Query Patterns

**Filter products in "Labels" category and all its descendants:**
```ts
{
  nested: {
    path: 'categories',
    query: {
      terms: { 'categories.breadcrumb_ids': [2] }
    }
  }
}
```

**Filter only top-level categories:**
```ts
{
  nested: {
    path: 'categories',
    query: {
      term: { 'categories.level': 0 }
    }
  }
}
```

## Backward Compatibility

Existing flat fields remain intact:
- `category_ids`: Array of all category IDs (unchanged)
- `category_slugs`: Array of all category slugs (unchanged)

These can still be used for simple category filtering. Use `categories` nested field when you need hierarchical information or multi-level filtering.

## Index Reindexing

After deployment, reindex products to populate the new `categories` field:

```bash
make elastic-reindex
# or
php artisan scout:import App\\Models\\Product
php artisan scout:import App\\Models\\MasterProduct
```

## Performance Considerations

- **Eager Loading**: All taxon levels are eager-loaded to minimize N+1 queries
- **Nested Type**: Elasticsearch nested type allows efficient filtering by hierarchy
- **Translation Caching**: Taxon translations are loaded once during indexing
- **Localized Arrays**: Names/slugs include all supported locales (en, nl)

## Future Enhancements

- Add category metadata (description, image) to nested structure
- Implement category aggregations for filter UI
- Add category-based weighting in relevance scoring
- Support category analytics/popular categories tracking
