import { describe, expect, it } from 'vitest';
import { localizedSitemapSlug, cleanSlug } from './sitemap';

describe('localized sitemap slugs', () => {
  it('uses locale slugs, translation slugs, then the root fallback', () => {
    expect(localizedSitemapSlug({ locale_slugs: { en: 'english-product' }, slug: 'dutch-product' }, 'en')).toBe('english-product');
    expect(localizedSitemapSlug({ translations: [{ nl: { language: 'nl', slug: 'nederlands-blog' } }], slug: 'fallback' }, 'nl')).toBe('nederlands-blog');
    expect(localizedSitemapSlug({ slug: 'fallback' }, 'en')).toBe('fallback');
  });

  it('sanitizes slugs and strips invalid characters and spaces', () => {
    expect(cleanSlug('1000D Tag')).toBe('1000d-tag');
    expect(cleanSlug('  Product Name 123  ')).toBe('product-name-123');
    expect(cleanSlug('diamondlabels-nl')).toBe('diamondlabels-nl');
    expect(cleanSlug('expo_badge')).toBe('expo_badge');
    expect(cleanSlug('')).toBeNull();
    expect(cleanSlug('/')).toBeNull();
    expect(cleanSlug(null)).toBeNull();
    expect(cleanSlug(undefined)).toBeNull();
  });
});
