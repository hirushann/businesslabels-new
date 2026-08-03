import { describe, expect, it } from 'vitest';
import { localizedSitemapSlug } from './sitemap';

describe('localized sitemap slugs', () => {
  it('uses locale slugs, translation slugs, then the root fallback', () => {
    expect(localizedSitemapSlug({ locale_slugs: { en: 'english-product' }, slug: 'dutch-product' }, 'en')).toBe('english-product');
    expect(localizedSitemapSlug({ translations: [{ nl: { language: 'nl', slug: 'nederlands-blog' } }], slug: 'fallback' }, 'nl')).toBe('nederlands-blog');
    expect(localizedSitemapSlug({ slug: 'fallback' }, 'en')).toBe('fallback');
  });
});
