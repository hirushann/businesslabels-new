import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import sitemap, { localizedSitemapSlug, cleanSlug, publicBrandSlug } from './sitemap';

describe('localized sitemap slugs', () => {
  it('uses locale slugs, slugs map, translation slugs, then the root fallback', () => {
    expect(localizedSitemapSlug({ locale_slugs: { en: 'english-product' }, slug: 'dutch-product' }, 'en')).toBe('english-product');
    expect(localizedSitemapSlug({ slugs: { en: 'english-faq' }, slug: 'dutch-faq' }, 'en')).toBe('english-faq');
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

  it('resolves brand canonical slugs', () => {
    expect(publicBrandSlug('diamondlabels')).toBe('diamondlabels-nl');
    expect(publicBrandSlug('seiko')).toBe('sii');
    expect(publicBrandSlug('epson-nl')).toBe('epson');
    expect(publicBrandSlug('expo-badge')).toBe('expo_badge');
    expect(publicBrandSlug('godex')).toBe('godex');
  });
});

describe('sitemap generation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/materials')) {
        return Promise.resolve(new Response(JSON.stringify({ data: [{ slug: 'sample-mat', updated_at: '2026-01-01' }] })));
      }
      if (urlStr.includes('/api/products')) {
        return Promise.resolve(new Response(JSON.stringify({ data: [{ slug: 'sample-prod', updated_at: '2026-01-01' }] })));
      }
      if (urlStr.includes('/api/printers')) {
        return Promise.resolve(new Response(JSON.stringify({ data: [{ slug: 'sample-printer', updated_at: '2026-01-01' }] })));
      }
      if (urlStr.includes('/api/posts?type=post')) {
        return Promise.resolve(new Response(JSON.stringify({ data: [{ id: 1, slug: 'sample-post', updated_at: '2026-01-01' }] })));
      }
      if (urlStr.includes('/api/posts?type=kennisbank')) {
        return Promise.resolve(new Response(JSON.stringify({ data: [{ id: 2, slug: 'sample-kennis', updated_at: '2026-01-01' }] })));
      }
      if (urlStr.includes('/api/pages')) {
        return Promise.resolve(new Response(JSON.stringify({ data: [{ slug: 'custom-cms-page', updated_at: '2026-01-01' }] })));
      }
      if (urlStr.includes('/api/group-products')) {
        return Promise.resolve(new Response(JSON.stringify({ data: [{ slug: 'sample-group-prod', updated_at: '2026-01-01' }] })));
      }
      if (urlStr.includes('/api/faq')) {
        return Promise.resolve(new Response(JSON.stringify({ data: [{ slugs: { nl: 'sample-faq-nl', en: 'sample-faq-en' }, updated_at: '2026-01-01' }] })));
      }
      if (urlStr.includes('/api/brands')) {
        return Promise.resolve(new Response(JSON.stringify({ data: [] })));
      }
      return Promise.resolve(new Response(JSON.stringify({ data: [] })));
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('includes static routes, blogs, categories, brands, faq topics, and products in both languages', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    // Static pages
    expect(urls).toContain('https://businesslabels.nl/blog');
    expect(urls).toContain('https://businesslabels.nl/en/blog');
    expect(urls).toContain('https://businesslabels.nl/contact-us');
    expect(urls).toContain('https://businesslabels.nl/en/contact-us');

    // Dynamic blogs
    expect(urls).toContain('https://businesslabels.nl/blog/sample-post');
    expect(urls).toContain('https://businesslabels.nl/en/blog/sample-post');
    expect(urls).toContain('https://businesslabels.nl/blog/sample-kennis');
    expect(urls).toContain('https://businesslabels.nl/en/blog/sample-kennis');

    // Dynamic products and materials
    expect(urls).toContain('https://businesslabels.nl/product/sample-prod');
    expect(urls).toContain('https://businesslabels.nl/en/product/sample-prod');
    expect(urls).toContain('https://businesslabels.nl/material/sample-mat');
    expect(urls).toContain('https://businesslabels.nl/en/material/sample-mat');

    // Dynamic printers
    expect(urls).toContain('https://businesslabels.nl/printers/sample-printer');
    expect(urls).toContain('https://businesslabels.nl/en/printers/sample-printer');

    // Dynamic brands
    expect(urls).toContain('https://businesslabels.nl/brand/epson');
    expect(urls).toContain('https://businesslabels.nl/en/brand/epson');
    expect(urls).toContain('https://businesslabels.nl/brand/godex');
    expect(urls).toContain('https://businesslabels.nl/en/brand/godex');

    // Dynamic FAQ pages
    expect(urls).toContain('https://businesslabels.nl/epson-colorworks-faq?topic=sample-faq-nl');
    expect(urls).toContain('https://businesslabels.nl/en/epson-colorworks-faq?topic=sample-faq-en');

    // Dynamic CMS pages
    expect(urls).toContain('https://businesslabels.nl/custom-cms-page');
    expect(urls).toContain('https://businesslabels.nl/en/custom-cms-page');
  });
});
