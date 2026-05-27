import { describe, it, expect } from 'vitest';
import type { estypes } from '@elastic/elasticsearch';
import { exactSkuQuery, textQuery } from './products';

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
    
    const skuBoost = (should.find((s) => s.term && s.term['sku.keyword'])?.term?.['sku.keyword'] as any).boost;
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
});

function shouldFindFuzzy(query: estypes.QueryDslQueryContainer) {
  return (query.bool?.should as any[])?.find(s => s.multi_match && s.multi_match.fuzziness === 'AUTO');
}
