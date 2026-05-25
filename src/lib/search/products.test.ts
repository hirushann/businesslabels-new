import { describe, it, expect } from 'vitest';
import type { estypes } from '@elastic/elasticsearch';
import { textQuery } from './products';

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

  it('should handle complex product codes like TM-C3500 strictly', () => {
    const query = textQuery('TM-C3500') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];
    
    const hasDescription = should.some((s) => 
      s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('description')
    );
    expect(hasDescription).toBe(false);
  });

  it('should boost Genuine Brand fields above compatible brands', () => {
    const query = textQuery('epson') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];
    
    const brandBoost = should.find((s) => s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('catalog_brand'))!.multi_match!.boost;
    const compatibleBoost = should.find((s) => s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('compatible_brands'))!.multi_match!.boost;
    
    expect(brandBoost).toBe(50);
    expect(compatibleBoost).toBe(10);
  });

  it('should require BOTH words for 2-word search (e.g. inkt 8500)', () => {
    const query = textQuery('inkt 8500') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];
    
    // Check feature fields and description fields use 'and' operator
    const featureMatch = should.find((s) => s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('subtitle'));
    expect(featureMatch!.multi_match!.operator).toBe('and');

    // Title 'and' match should be present
    const titleAndMatch = should.find((s) => s.multi_match && s.multi_match.type === 'cross_fields' && s.multi_match.operator === 'and');
    expect(titleAndMatch).toBeDefined();
  });

  it('should apply fuzziness only to text tokens, not numeric or product-code tokens', () => {
    // Numeric tokens should be excluded from fuzzy query
    const queryNum = textQuery('inkt 8500') as estypes.QueryDslQueryContainer;
    const fuzzyNum = shouldFindFuzzy(queryNum);
    expect(fuzzyNum).toBeDefined();
    expect(fuzzyNum!.multi_match!.query).toBe('inkt');
    expect(fuzzyNum!.multi_match!.query).not.toContain('8500');

    const queryCode = textQuery('C8000') as estypes.QueryDslQueryContainer;
    const fuzzyCode = shouldFindFuzzy(queryCode);
    expect(fuzzyCode).toBeUndefined(); // Product code intent disables fuzzy entirely
  });

  it('should allow partial numeric matching (e.g. inkt 8000) using query_string wildcard', () => {
    const query = textQuery('inkt 8000') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];
    
    const wildcardMatch = should.find((s) => s.query_string);
    expect(wildcardMatch).toBeDefined();
    expect(wildcardMatch!.query_string!.query).toBe('inkt AND *8000*');
  });

  it('should verify ranking hierarchy: SKU (100k) > Title (5k) > Features (1k) > Brand (50) > Description (0.05)', () => {
    const query = textQuery('test product') as estypes.QueryDslQueryContainer;
    const should = query.bool?.should as estypes.QueryDslQueryContainer[];
    
    const skuBoost = (should.find((s) => s.term && s.term['sku.keyword'])?.term?.['sku.keyword'] as any).boost;
    const titleBoost = should.find((s) => s.multi_match && s.multi_match.type === 'phrase')!.multi_match!.boost;
    const featureBoost = should.find((s) => s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('subtitle'))!.multi_match!.boost;
    const brandBoost = should.find((s) => s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('catalog_brand'))!.multi_match!.boost;
    const descriptionBoost = should.find((s) => s.multi_match && Array.isArray(s.multi_match.fields) && s.multi_match.fields.includes('description'))!.multi_match!.boost;
    
    expect(skuBoost).toBe(100000);
    expect(titleBoost).toBe(5000);
    expect(featureBoost).toBe(1000);
    expect(brandBoost).toBe(50);
    expect(descriptionBoost).toBe(0.05);
  });

  it('should add a must clause with bool_prefix type and operator: "and" for multi-term queries', () => {
    const query = textQuery('inkt 8500') as estypes.QueryDslQueryContainer;
    const must = query.bool?.must as estypes.QueryDslQueryContainer[];
    expect(must).toBeDefined();
    expect(must.length).toBe(1);
    expect(must[0].multi_match!.type).toBe('bool_prefix');
    expect(must[0].multi_match!.operator).toBe('and');
    expect(must[0].multi_match!.query).toBe('inkt 8500');
  });
});

function shouldFindFuzzy(query: estypes.QueryDslQueryContainer) {
  return (query.bool?.should as any[])?.find(s => s.multi_match && s.multi_match.fuzziness === 'AUTO');
}
