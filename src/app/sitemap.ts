import { MetadataRoute } from 'next';
import { localePath } from '@/lib/i18n/utils';
import { fetchCategoryGroups, categoryPublicPath, type CategoryNode } from '@/lib/categories/tree';
import { getAccessoryCategoryPath } from '@/lib/routes/accessoryCategories';
import { getLabelCategoryPath } from '@/lib/routes/labelCategories';

// Define the API base URL
const baseUrl = process.env.BBNL_API_BASE_URL || 'http://localhost:8000';
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_ENV !== 'staging') {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://businesslabels.nl';
};

const frontendUrl = getBaseUrl();

type Locale = 'en' | 'nl';
type SitemapTranslation = {
  language?: string;
  slug?: string;
} & Partial<Record<Locale, { language?: string; slug?: string }>>;

export type SitemapApiItem = {
  id?: number | string;
  slug?: string | Partial<Record<Locale, string>>;
  slugs?: Partial<Record<Locale, string>>;
  locale_slugs?: Partial<Record<Locale, string>>;
  translations?: SitemapTranslation[];
  updated_at?: string;
};

export function localizedSitemapSlug(item: SitemapApiItem, locale: Locale): string | null {
  const direct =
    item.locale_slugs?.[locale] ||
    item.slugs?.[locale] ||
    (typeof item.slug === 'object' ? item.slug[locale] : null);
  if (direct) return direct;

  const translations = (Array.isArray(item.translations) 
    ? item.translations 
    : Object.values(item.translations ?? {})) as SitemapTranslation[];

  for (const entry of translations) {
    const keyed = entry[locale];
    if (keyed?.slug) return keyed.slug;
    if (entry.language === locale && entry.slug) return entry.slug;
  }

  return typeof item.slug === 'string' ? item.slug : null;
}

export function cleanSlug(rawSlug?: string | null): string | null {
  if (!rawSlug || typeof rawSlug !== 'string') return null;
  const trimmed = rawSlug.trim();
  if (!trimmed || trimmed === '/' || trimmed === '#') return null;

  const normalized = trimmed
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\/+/g, '')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-');

  return normalized && normalized !== '-' && normalized !== '_' ? normalized : null;
}

const BRAND_CANONICAL_SLUGS: Record<string, string> = {
  diamondlabels: 'diamondlabels-nl',
  'epson-nl': 'epson',
  expobadge: 'expo_badge',
  'expobadge-2': 'expo_badge',
  'expo-badge': 'expo_badge',
  seiko: 'sii',
  'seiko-nl': 'sii',
};

export function publicBrandSlug(slug: string): string {
  return BRAND_CANONICAL_SLUGS[slug.toLowerCase()] ?? slug;
}

const BRAND_SLUGS = [
  'epson',
  'godex',
  'sii',
  'diamondlabels-nl',
  'expo_badge',
  'zebra',
  'botlr',
  'creative',
];

async function fetchApi<T extends SitemapApiItem>(path: string): Promise<T[]> {
  try {
    const separator = path.includes('?') ? '&' : '?';
    let page = 1;
    let allData: T[] = [];
    let hasMore = true;

    while (hasMore) {
      const url = `${baseUrl}${path}${separator}page=${page}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const json = (await res.json()) as { data?: T[]; meta?: { last_page?: number; current_page?: number } };
      
      if (Array.isArray(json.data)) {
        allData = allData.concat(json.data);
      }

      const lastPage = json.meta?.last_page;
      const currentPage = json.meta?.current_page || page;
      if (lastPage && currentPage < lastPage) {
        page++;
      } else {
        hasMore = false;
      }
    }
    return allData;
  } catch (e) {
    console.error(`Failed to fetch ${path} for sitemap:`, e);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes = [
    { path: '' },
    { path: '/contact-us' },
    { path: '/epson-colorworks-faq' },
    { path: '/material' },
    { path: '/material/inkjet' },
    { path: '/material/thermal-direct' },
    { path: '/material/thermal-transfer' },
    { path: '/product' },
    { path: '/winkel' },
    { path: '/categories' },
    { path: '/blog' },
    { path: '/kennisbank-overzicht' },
    { path: '/brands' },
    { path: '/printers' },
    { path: '/maatwerk' },
    { path: '/support' },
    { path: '/support/samples' },
    { path: '/privacy-policy' },
    { path: '/algemene-voorwaarden' },
    { path: '/badge-maken' },
    { path: '/epson-colorworks-labelprinters' },
    { path: '/epson-cw-c4000-printer-preview' },
    { path: '/inkt-recyclen-epson-colorworks' },
    { path: '/print-sample' },
    { path: '/software' },
    { path: '/videos' },
  ];

  const nlEntries: MetadataRoute.Sitemap = [];
  const enEntries: MetadataRoute.Sitemap = [];
  const seenUrls = new Set<string>();

  // Helper to add matching NL/EN entries
  const addEntry = (
    nlPath: string,
    enPath: string,
    lastModified: Date = new Date(),
    priority: number = 0.8,
    changeFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ) => {
    const nlUrl = `${frontendUrl}${nlPath}`;
    const enUrl = `${frontendUrl}${enPath}`;

    if (!seenUrls.has(nlUrl)) {
      seenUrls.add(nlUrl);
      nlEntries.push({
        url: nlUrl,
        lastModified,
        changeFrequency,
        priority,
      });
    }

    if (!seenUrls.has(enUrl)) {
      seenUrls.add(enUrl);
      enEntries.push({
        url: enUrl,
        lastModified,
        changeFrequency,
        priority,
      });
    }
  };

  // Add static routes
  for (const route of staticRoutes) {
    const nlPath = localePath(route.path, 'nl');
    const enPath = localePath(route.path, 'en');
    const priority = route.path === '' ? 1.0 : 0.8;
    addEntry(nlPath, enPath, new Date(), priority, 'daily');
  }

  // Fetch dynamic content
  const [
    materials,
    products,
    printers,
    posts,
    kennisbank,
    cmsPages,
    groupProducts,
    faqPages,
    apiBrands,
  ] = await Promise.all([
    fetchApi<SitemapApiItem>('/api/materials?per_page=1000'),
    fetchApi<SitemapApiItem>('/api/products?per_page=1000'),
    fetchApi<SitemapApiItem>('/api/printers?per_page=1000'),
    fetchApi<SitemapApiItem>('/api/posts?type=post'),
    fetchApi<SitemapApiItem>('/api/posts?type=kennisbank'),
    fetchApi<SitemapApiItem>('/api/pages'),
    fetchApi<SitemapApiItem>('/api/group-products?per_page=1000'),
    fetchApi<SitemapApiItem>('/api/faq'),
    fetchApi<SitemapApiItem>('/api/brands?per_page=1000'),
  ]);

  // Combine and deduplicate blog posts and knowledge base articles
  const blogMap = new Map<string | number, SitemapApiItem>();
  [...posts, ...kennisbank].forEach((item) => {
    const key = item.id ?? (typeof item.slug === 'string' ? item.slug : JSON.stringify(item.slug));
    if (key) blogMap.set(key, item);
  });
  const blogs = Array.from(blogMap.values());

  // Add Materials
  materials.forEach((material) => {
    const rawNl = cleanSlug(localizedSitemapSlug(material, 'nl'));
    const rawEn = cleanSlug(localizedSitemapSlug(material, 'en'));
    const nlSlug = rawNl || rawEn;
    const enSlug = rawEn || rawNl;
    if (nlSlug && enSlug) {
      addEntry(`/material/${nlSlug}`, `/en/material/${enSlug}`, new Date(material.updated_at || new Date()), 0.7, 'weekly');
    }
  });

  // Add Products
  products.forEach((product) => {
    const rawNl = cleanSlug(localizedSitemapSlug(product, 'nl'));
    const rawEn = cleanSlug(localizedSitemapSlug(product, 'en'));
    const nlSlug = rawNl || rawEn;
    const enSlug = rawEn || rawNl;
    if (nlSlug && enSlug) {
      addEntry(`/product/${nlSlug}`, `/en/product/${enSlug}`, new Date(product.updated_at || new Date()), 0.9, 'weekly');
    }
  });

  // Add Categories from tree structure
  try {
    const categoryGroups = await fetchCategoryGroups();

    const walkCategoryTree = (node: CategoryNode, ancestors: CategoryNode[] = []) => {
      const rawNl = node.canonical_urls?.nl || categoryPublicPath(node, ancestors, 'nl');
      const rawEn = node.canonical_urls?.en || categoryPublicPath(node, ancestors, 'en');
      if (rawNl && rawEn) {
        addEntry(localePath(rawNl, 'nl'), localePath(rawEn, 'en'), new Date(), 0.8, 'weekly');
      }
      node.children?.forEach((child) => walkCategoryTree(child, [...ancestors, node]));
    };

    categoryGroups.forEach((group) => {
      group.categories?.forEach((cat) => walkCategoryTree(cat, []));
    });
  } catch (e) {
    console.error('Failed to parse categories for sitemap:', e);
  }

  addEntry(
    getAccessoryCategoryPath('nl', 'applicatorsDispensers'),
    getAccessoryCategoryPath('en', 'applicatorsDispensers'),
  );
  addEntry(
    getAccessoryCategoryPath('nl', 'printerAddOns'),
    getAccessoryCategoryPath('en', 'printerAddOns'),
  );
  addEntry(
    getLabelCategoryPath('nl', 'applications'),
    getLabelCategoryPath('en', 'applications'),
  );

  // Add Printers
  printers.forEach((printer) => {
    const rawNl = cleanSlug(localizedSitemapSlug(printer, 'nl'));
    const rawEn = cleanSlug(localizedSitemapSlug(printer, 'en'));
    const nlSlug = rawNl || rawEn;
    const enSlug = rawEn || rawNl;
    if (nlSlug && enSlug) {
      addEntry(`/printers/${nlSlug}`, `/en/printers/${enSlug}`, new Date(printer.updated_at || new Date()), 0.7, 'weekly');
    }
  });

  // Add Blogs & Knowledge Base articles
  blogs.forEach((blog) => {
    const rawNl = cleanSlug(localizedSitemapSlug(blog, 'nl'));
    const rawEn = cleanSlug(localizedSitemapSlug(blog, 'en'));
    const nlSlug = rawNl || rawEn;
    const enSlug = rawEn || rawNl;
    if (nlSlug && enSlug) {
      addEntry(`/blog/${nlSlug}`, `/en/blog/${enSlug}`, new Date(blog.updated_at || new Date()), 0.7, 'monthly');
    }
  });

  // Add CMS Pages
  cmsPages.forEach((page) => {
    const rawNl = cleanSlug(localizedSitemapSlug(page, 'nl'));
    const rawEn = cleanSlug(localizedSitemapSlug(page, 'en'));
    const nlSlug = rawNl || rawEn;
    const enSlug = rawEn || rawNl;
    if (nlSlug && enSlug) {
      addEntry(`/${nlSlug}`, `/en/${enSlug}`, new Date(page.updated_at || new Date()), 0.6, 'monthly');
    }
  });

  // Add Group Products
  groupProducts.forEach((groupProduct) => {
    const rawNl = cleanSlug(localizedSitemapSlug(groupProduct, 'nl'));
    const rawEn = cleanSlug(localizedSitemapSlug(groupProduct, 'en'));
    const nlSlug = rawNl || rawEn;
    const enSlug = rawEn || rawNl;
    if (nlSlug && enSlug) {
      addEntry(`/product/${nlSlug}`, `/en/product/${enSlug}`, new Date(groupProduct.updated_at || new Date()), 0.8, 'weekly');
    }
  });

  // Add FAQ Pages / Topics
  faqPages.forEach((faq) => {
    const rawNl = cleanSlug(faq.slugs?.nl ?? localizedSitemapSlug(faq, 'nl'));
    const rawEn = cleanSlug(faq.slugs?.en ?? localizedSitemapSlug(faq, 'en'));
    const nlSlug = rawNl || rawEn;
    const enSlug = rawEn || rawNl;
    if (nlSlug && enSlug) {
      addEntry(
        `/epson-colorworks-faq?topic=${encodeURIComponent(nlSlug)}`,
        `/en/epson-colorworks-faq?topic=${encodeURIComponent(enSlug)}`,
        new Date(faq.updated_at || new Date()),
        0.6,
        'monthly',
      );
    }
  });

  // Add Brands
  const seenBrands = new Set<string>();
  BRAND_SLUGS.forEach((slug) => {
    const canonical = publicBrandSlug(slug);
    if (!seenBrands.has(canonical)) {
      seenBrands.add(canonical);
      addEntry(`/brand/${canonical}`, `/en/brand/${canonical}`, new Date(), 0.7, 'weekly');
    }
  });

  apiBrands.forEach((brand) => {
    const rawNl = cleanSlug(localizedSitemapSlug(brand, 'nl'));
    const rawEn = cleanSlug(localizedSitemapSlug(brand, 'en'));
    const nlSlug = rawNl || rawEn;
    const enSlug = rawEn || rawNl;
    if (nlSlug && enSlug && nlSlug !== 'brand' && enSlug !== 'brand') {
      const publicNl = publicBrandSlug(nlSlug);
      const publicEn = publicBrandSlug(enSlug);
      if (publicNl && publicEn && !seenBrands.has(publicNl)) {
        seenBrands.add(publicNl);
        addEntry(`/brand/${publicNl}`, `/en/brand/${publicEn}`, new Date(), 0.7, 'weekly');
      }
    }
  });

  return [...nlEntries, ...enEntries];
}
