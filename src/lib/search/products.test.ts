import { describe, it, expect } from 'vitest';
import type { estypes } from '@elastic/elasticsearch';
import type { CatalogSearchParams } from './types';
import { buildCatalogFilters, exactSkuQuery, textQuery } from './products';

describe('textQuery Accuracy & Precision', () => {
  it('should prioritize SKU exact matches with highest boost (100000)', () => {
    const sku = 'DEMO-001';
    const query = textQuery(sku) as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];
    
    const skuKeywordClauses = should.filter((s) => 
      s.term && (s.term['sku.keyword'] || s.term['article_number.keyword'])
    );
    
    expect(skuKeywordClauses.length).toBeGreaterThan(0);
    const firstClause = (skuKeywordClauses[0].term!['sku.keyword'] || skuKeywordClauses[0].term!['article_number.keyword']) as estypes.QueryDslTermQuery;
    expect(firstClause.boost).toBe(100000);
  });

  it('should detect product-code-like intent (e.g. C8000) and disable description fallback', () => {
    const query = textQuery('C8000') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];
    
    // Check if description fields are present
    const hasDescription = should.some((s) => 
      s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('description')
    );
    expect(hasDescription).toBe(false);

    // Should only have SKU and Title matching
    const hasSku = should.some(s => s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.some(f => f.startsWith('sku')));
    const hasTitle = should.some(s => s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.some(f => f.startsWith('name')));
    expect(hasSku).toBe(true);
    expect(hasTitle).toBe(true);
  });

  it('should build a separate exact SKU lookup query for the preflight search', () => {
    const query = exactSkuQuery('TM-C3500') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];

    expect(query.bool?.minimum_should_match).toBe(1);
    expect(should).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          term: {
            'sku.keyword': {
              value: 'TM-C3500',
              case_insensitive: true,
            },
          },
        }),
        expect.objectContaining({
          term: {
            'sku.normalized': 'tm-c3500',
          },
        }),
      ]),
    );
  });

  it('should handle complex product codes like TM-C3500 strictly', () => {
    const query = textQuery('TM-C3500') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];
    
    const hasDescription = should.some((s) => 
      s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('description')
    );
    expect(hasDescription).toBe(false);
  });

  it('should prefer exact title phrase and all-token title matches over fuzzy title matches', () => {
    const query = textQuery('epson printer') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];

    const phraseBoost = should.find((s) => s.multi_match && s.multi_match.type === 'phrase')!.multi_match!.boost;
    const titleAndBoost = should.find((s) => s.multi_match && s.multi_match.type === 'cross_fields')!.multi_match!.boost;
    const fuzzyBoost = should.find((s) => s.multi_match && s.multi_match.fuzziness === 'AUTO')!.multi_match!.boost;

    expect(phraseBoost).toBe(5000);
    expect(titleAndBoost).toBe(2500);
    expect(fuzzyBoost).toBe(50);
  });

  it('should rank title/model-code matches above partial SKU matches for searches like C4000', () => {
    const query = textQuery('C4000') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];

    const titleWildcardBoost = should.find((s) => s.query_string)?.query_string?.boost;
    const titlePhraseBoost = should.find((s) => s.multi_match && s.multi_match.type === 'phrase')!.multi_match!.boost as number;
    const titleTokenBoost = should.find((s) => s.multi_match && s.multi_match.type === 'best_fields')!.multi_match!.boost as number;
    const skuPhraseBoost = (should.find((s) => s.match_phrase)?.match_phrase as Record<string, estypes.QueryDslMatchPhraseQuery>).sku.boost as number;
    const skuPrefix = should.find((s) => s.multi_match && s.multi_match.type === 'phrase_prefix' && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('sku'));

    expect(titleWildcardBoost).toBe(2500);
    expect(titlePhraseBoost).toBeGreaterThan(skuPhraseBoost);
    expect(titleTokenBoost).toBeGreaterThan(skuPhraseBoost);
    expect(skuPhraseBoost).toBe(400);
    expect(skuPrefix!.multi_match!.boost).toBe(150);
    expect(skuPrefix!.multi_match!.fields).toEqual(['sku', 'variant_skus']);
  });

  it('should require BOTH words for 2-word search (e.g. inkt 8500)', () => {
    const query = textQuery('inkt 8500') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];

    // Title 'and' match should be present
    const titleAndMatch = should.find((s) => s.multi_match && s.multi_match.type === 'cross_fields' && s.multi_match.operator === 'and');
    expect(titleAndMatch).toBeDefined();

    const looseDescriptionMatch = should.find((s) => s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('description'));
    expect(looseDescriptionMatch).toBeUndefined();
  });

  it('should apply fuzziness only to text queries, not numeric or product-code queries', () => {
    const text = textQuery('printer ink') as estypes.QueryDslQueryContainer;
    const fuzzyText = shouldFindFuzzy(text);
    expect(fuzzyText).toBeDefined();
    expect(fuzzyText!.multi_match!.query).toBe('printer ink');

    const queryCode = textQuery('TM-C3500') as estypes.QueryDslQueryContainer;
    expect(shouldFindFuzzy(queryCode)).toBeUndefined();

    const queryNumeric = textQuery('inkt 8500') as estypes.QueryDslQueryContainer;
    expect(shouldFindFuzzy(queryNumeric)).toBeUndefined();
  });

  it('should allow partial numeric matching (e.g. inkt 8000) using query_string wildcard', () => {
    const query = textQuery('inkt 8000') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];
    
    const wildcardMatch = should.find((s) => s.query_string);
    expect(wildcardMatch).toBeDefined();
    expect(wildcardMatch!.query_string!.query).toBe('inkt AND *8000*');
  });

  it('should verify ranking hierarchy: exact SKU (100k) > Title (5k) > partial SKU (400) > Description (1)', () => {
    const query = textQuery('test product') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];
    
    const skuTerm = should.find((s) => s.term && s.term['sku.keyword'])?.term?.['sku.keyword'] as
      | estypes.QueryDslTermQuery
      | undefined;
    const skuBoost = skuTerm?.boost;
    const titleBoost = should.find((s) => s.multi_match && s.multi_match.type === 'phrase')!.multi_match!.boost;
    const skuPhraseBoost = (should.find((s) => s.match_phrase)?.match_phrase as Record<string, estypes.QueryDslMatchPhraseQuery>).sku.boost;
    const descriptionBoost = should.find((s) => s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('description'))!.multi_match!.boost;
    const shortDescriptionBoost = should.find((s) => s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('short_description'))!.multi_match!.boost;
    
    expect(skuBoost).toBe(100000);
    expect(titleBoost).toBe(5000);
    expect(skuPhraseBoost).toBe(400);
    expect(descriptionBoost).toBe(1);
    expect(shortDescriptionBoost).toBe(0.5);
  });

  it('should keep multi-term matching in should clauses so min_score can reject weak matches', () => {
    const query = textQuery('inkt 8500') as estypes.QueryDslQueryContainer;
    const must = query.bool?.must as estypes.QueryDslQueryContainer[];
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];

    expect(must).toBeUndefined();
    expect(should.length).toBeGreaterThan(0);
    expect(query.bool?.minimum_should_match).toBe(1);
  });

  it('should construct a per-token fuzzy-prefix query for multi-term queries to handle partial search typos', () => {
    const query = textQuery('epson colow') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];

    const perTokenClause = should.find((s) => s.bool && s.bool.must && s.bool.boost === 150);
    expect(perTokenClause).toBeDefined();

    const mustClauses = perTokenClause!.bool!.must as estypes.QueryDslQueryContainer[];
    expect(mustClauses.length).toBe(2);

    mustClauses.forEach((clause) => {
      expect(clause.bool).toBeDefined();
      expect(clause.bool?.minimum_should_match).toBe(1);
      expect(shouldClauses(clause).length).toBe(2);
    });
  });
});

function shouldFindFuzzy(query: estypes.QueryDslQueryContainer) {
  return shouldClauses(query).find((s) => s.multi_match && s.multi_match.fuzziness === 'AUTO');
}

function shouldClauses(query: estypes.QueryDslQueryContainer): estypes.QueryDslQueryContainer[] {
  const should = query.bool?.should;
  return Array.isArray(should) ? should as estypes.QueryDslQueryContainer[] : [];
}

describe('catalog filter metadata from Elasticsearch aggregations', () => {
  it('keeps category visible for a category-filtered scoped result set', () => {
    const filters = buildCatalogFilters({
      options_category: {
        doc_count: 2,
        facet: {
          buckets: [{ key: 'applicatoren', doc_count: 2 }],
        },
      },
    });

    expect(filters.options).toEqual([
      {
        key: 'category',
        title: 'Product Type',
        options: [{ value: 'applicatoren', label: 'Applicatoren', count: 2 }],
      },
    ]);
  });

  it('uses localized indexed category titles for category facet labels', () => {
    const filters = buildCatalogFilters(
      {
        options_category: {
          facet: {
            buckets: [
              {
                key: 'accessories-1',
                doc_count: 2,
                label_source: {
                  hits: {
                    hits: [
                      {
                        _source: {
                          category_slugs: ['accessories-1'],
                          category_titles_en: ['Accessories'],
                          category_titles_nl: ['Accessoires'],
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      catalogParams({ locale: 'nl' }),
    );

    expect(filters.options).toEqual([
      {
        key: 'category',
        title: 'Product Type',
        options: [{ value: 'accessories-1', label: 'Accessoires', count: 2 }],
      },
    ]);
  });

  it('localizes known filter option values for the active locale', () => {
    const filters = buildCatalogFilters(
      {
        options_material: {
          facet: {
            buckets: [{ key: 'paper', doc_count: 3 }],
          },
        },
      },
      catalogParams({ locale: 'nl', materials: ['paper'] }),
    );

    expect(filters.options).toEqual([
      {
        key: 'material',
        title: 'Material Type',
        options: [{ value: 'paper', label: 'Papier', count: 3 }],
      },
    ]);
  });

  it('uses scoped min and max price stats from matching documents', () => {
    const filters = buildCatalogFilters({
      stats_price: {
        count: 2,
        min: 129.25,
        max: 349.5,
        avg: 239.875,
        sum: 479.75,
      },
      stats_width: {
        count: 0,
        min: null,
        max: null,
      },
    });

    expect(filters.ranges).toEqual([
      {
        key: 'price',
        title: 'Price Range',
        min: 129,
        max: 350,
        unitPrefix: '€',
        unitSuffix: undefined,
      },
    ]);
  });

  it('reads range stats from the scoped aggregation used to ignore the active range itself', () => {
    const filters = buildCatalogFilters({
      stats_price: {
        doc_count: 5,
        scoped: {
          doc_count: 2,
          stats: {
            count: 2,
            min: 49,
            max: 499,
          },
        },
      },
    });

    expect(filters.ranges).toEqual([
      {
        key: 'price',
        title: 'Price Range',
        min: 49,
        max: 499,
        unitPrefix: '€',
      },
    ]);
  });

  it('hides empty attribute range filters when matching documents have no valid values', () => {
    const filters = buildCatalogFilters({
      stats_price: { count: 2, min: 10, max: 20 },
      stats_width: { count: 0, min: null, max: null },
      stats_height: { count: 0, min: null, max: null },
      stats_core: { count: 0, min: null, max: null },
      stats_outer_diameter: { count: 0, min: null, max: null },
    });

    expect(filters.ranges.map((filter) => filter.key)).toEqual(['price']);
  });

  it('hides range filters when the scoped min and max are the same', () => {
    const filters = buildCatalogFilters({
      stats_price: { count: 2, min: 149, max: 149 },
      stats_width: { count: 2, min: 80, max: 80 },
      stats_height: { count: 2, min: 40, max: 40 },
      stats_core: { count: 2, min: 76, max: 76 },
      stats_outer_diameter: { count: 2, min: 120, max: 120 },
    });

    expect(filters.ranges).toEqual([]);
  });

  it('hides range filters when rounded bounds would display as the same value', () => {
    const filters = buildCatalogFilters({
      stats_price: { count: 2, min: 3950, max: 3950.1 },
    });

    expect(filters.ranges).toEqual([]);
  });

  it('preserves relevant option filters while hiding empty or non-narrowing attributes', () => {
    const filters = buildCatalogFilters({
      options_category: {
        facet: {
          buckets: [{ key: 'applicatoren', doc_count: 2 }],
        },
      },
      options_brand: {
        facet: {
          buckets: [
            { key: 'Afinia', doc_count: 1 },
            { key: 'Labelmate', doc_count: 1 },
          ],
        },
      },
      options_material: {
        facet: {
          buckets: [{ key: 'paper', doc_count: 2 }],
        },
      },
      options_glue: {
        facet: {
          buckets: [],
        },
      },
    });

    expect(filters.options.map((filter) => filter.key)).toEqual(['category', 'brand']);
  });

  it('keeps an actively selected brand visible when it is the only matching brand', () => {
    const filters = buildCatalogFilters(
      {
        options_category: {
          facet: {
            buckets: [{ key: 'accessories-1', doc_count: 4 }],
          },
        },
        options_brand: {
          facet: {
            buckets: [{ key: 'Epson', doc_count: 2 }],
          },
        },
      },
      catalogParams({
        categories: ['accessories-1'],
        brands: ['Epson'],
      }),
    );

    expect(filters.options).toEqual([
      {
        key: 'category',
        title: 'Product Type',
        options: [{ value: 'accessories-1', label: 'Accessories 1', count: 4 }],
      },
      {
        key: 'brand',
        title: 'Brand',
        options: [{ value: 'Epson', label: 'Epson', count: 2 }],
      },
    ]);
  });

  it('adds an active selected option back with a zero count if ES has no bucket for it', () => {
    const filters = buildCatalogFilters(
      {
        options_brand: {
          facet: {
            buckets: [],
          },
        },
      },
      catalogParams({
        brands: ['Epson'],
      }),
    );

    expect(filters.options).toEqual([
      {
        key: 'brand',
        title: 'Brand',
        options: [{ value: 'Epson', label: 'Epson', count: 0 }],
      },
    ]);
  });
});

function catalogParams(overrides: Partial<CatalogSearchParams>): CatalogSearchParams {
  return {
    search: '',
    page: 1,
    perPage: 24,
    sort: 'latest',
    kernStrings: [],
    outerDiameterStrings: [],
    ids: [],
    slugs: [],
    skus: [],
    articleNumbers: [],
    printerIds: [],
    categories: [],
    scopeCategories: [],
    categoryIds: [],
    brands: [],
    materialIds: [],
    materialCategories: [],
    materialCategoryIds: [],
    materialCodes: [],
    materials: [],
    finishings: [],
    glues: [],
    printMethods: [],
    printerTypes: [],
    detections: [],
    marks: [],
    ...overrides,
  };
}
