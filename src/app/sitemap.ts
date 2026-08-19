import { MetadataRoute } from 'next';
import { localePath } from '@/lib/i18n/utils';
import { fetchCategoryGroups, categoryRouteSlug, type CategoryNode } from '@/lib/categories/tree';

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

type SitemapApiItem = {
  slug?: string | Partial<Record<'en' | 'nl', string>>;
  locale_slugs?: Partial<Record<'en' | 'nl', string>>;
  translations?: SitemapTranslation[];
  updated_at?: string;
};

export function localizedSitemapSlug(item: SitemapApiItem, locale: Locale): string | null {
  const direct = item.locale_slugs?.[locale] || (typeof item.slug === 'object' ? item.slug[locale] : null);
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

function publicBrandSlug(slug: string): string {
  return slug === 'diamondlabels' ? 'diamondlabels-nl' : slug;
}

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
  const [materials, products, printers, blogs, brands] = await Promise.all([
    fetchApi<SitemapApiItem>('/api/materials?per_page=1000'),
    fetchApi<SitemapApiItem>('/api/products?per_page=1000'),
    fetchApi<SitemapApiItem>('/api/printers?per_page=1000'),
    fetchApi<SitemapApiItem>('/api/blogs?per_page=1000'),
    fetchApi<SitemapApiItem>('/api/brands?per_page=1000'),
  ]);

  // Add Materials
  materials.forEach((material) => {
    const nlSlug = cleanSlug(localizedSitemapSlug(material, 'nl'));
    const enSlug = cleanSlug(localizedSitemapSlug(material, 'en'));
    if (nlSlug && enSlug) {
      addEntry(`/material/${nlSlug}`, `/en/material/${enSlug}`, new Date(material.updated_at || new Date()), 0.7, 'weekly');
    }
  });

  // Add Products
  products.forEach((product) => {
    const nlSlug = cleanSlug(localizedSitemapSlug(product, 'nl'));
    const enSlug = cleanSlug(localizedSitemapSlug(product, 'en'));
    if (nlSlug && enSlug) {
      addEntry(`/product/${nlSlug}`, `/en/product/${enSlug}`, new Date(product.updated_at || new Date()), 0.9, 'weekly');
    }
  });

    // Add Categories from tree structure
  try {
    const categoryGroups = await fetchCategoryGroups();
    
    const getCategoryPath = (node: CategoryNode, ancestors: CategoryNode[], locale: 'nl' | 'en') => {
      const segments = [...ancestors, node]
        .map((category) => categoryRouteSlug(category, locale))
        .filter(Boolean)
        .map((slug) => encodeURIComponent(slug));
      
      const base = locale === 'en' ? '/en/product-category' : '/product-categorie';
      return `${base}/${segments.join('/')}`;
    };

    const walkCategoryTree = (node: CategoryNode, ancestors: CategoryNode[]) => {
      if (node.slug) {
        const nlPath = getCategoryPath(node, ancestors, 'nl');
        const enPath = getCategoryPath(node, ancestors, 'en');
        addEntry(nlPath, enPath, new Date(), 0.8, 'weekly');
      }
      if (node.children) {
        node.children.forEach((child) => walkCategoryTree(child, [...ancestors, node]));
      }
    };

    categoryGroups.forEach((group) => {
      if (group.categories) {
        group.categories.forEach((category) => walkCategoryTree(category, []));
      }
    });
  } catch (e) {
    console.error('Failed to parse categories for sitemap:', e);
  }

  // Add Printers
  printers.forEach((printer) => {
    const nlSlug = cleanSlug(localizedSitemapSlug(printer, 'nl'));
    const enSlug = cleanSlug(localizedSitemapSlug(printer, 'en'));
    if (nlSlug && enSlug) {
      addEntry(`/printers/${nlSlug}`, `/en/printers/${enSlug}`, new Date(printer.updated_at || new Date()), 0.7, 'weekly');
    }
  });

  // Add Blogs
  blogs.forEach((blog) => {
    const nlSlug = cleanSlug(localizedSitemapSlug(blog, 'nl'));
    const enSlug = cleanSlug(localizedSitemapSlug(blog, 'en'));
    if (nlSlug && enSlug) {
      addEntry(`/blog/${nlSlug}`, `/en/blog/${enSlug}`, new Date(blog.updated_at || new Date()), 0.6, 'monthly');
    }
  });

  brands.forEach((brand) => {
    const nlSlug = cleanSlug(localizedSitemapSlug(brand, 'nl'));
    const enSlug = cleanSlug(localizedSitemapSlug(brand, 'en'));
    if (nlSlug && enSlug && nlSlug !== 'brand' && enSlug !== 'brand') {
      const publicNl = publicBrandSlug(nlSlug);
      const publicEn = publicBrandSlug(enSlug);
      if (publicNl && publicEn) {
        addEntry(`/brand/${publicNl}`, `/en/brand/${publicEn}`, new Date(), 0.7, 'weekly');
      }
    }
  });

  return [...nlEntries, ...enEntries];
}
