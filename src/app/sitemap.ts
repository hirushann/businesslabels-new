import { MetadataRoute } from 'next';
import { LOCALES } from '@/lib/i18n/config';

// Define the API base URL
const baseUrl = process.env.BBNL_API_BASE_URL || 'http://localhost:8000';
const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://businesslabels.nl';

async function fetchApi(path: string) {
  try {
    const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error(`Failed to fetch ${path} for sitemap:`, e);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/faq',
    '/materials',
    '/materials/inkjet',
    '/materials/thermal-direct',
    '/materials/thermal-transfer',
    '/products',
    '/categories',
    '/printers',
    '/blogs',
    '/brand',
    '/finder',
    '/custom-made-form',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add static routes
  for (const route of staticRoutes) {
    sitemapEntries.push({
      url: `${frontendUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: route === '' ? 1 : 0.8,
    });
  }

  // Fetch dynamic content
  const [materials, products, categories, printers, blogs, brands] = await Promise.all([
    fetchApi('/api/materials?per_page=1000'),
    fetchApi('/api/products?per_page=1000'),
    fetchApi('/api/categories?per_page=1000'),
    fetchApi('/api/printers?per_page=1000'),
    fetchApi('/api/blogs?per_page=1000'),
    fetchApi('/api/brands?per_page=1000'), // Assuming brands endpoint exists
  ]);

  // Add Materials
  materials.forEach((material: any) => {
    if (material.slug) {
      sitemapEntries.push({
        url: `${frontendUrl}/materials/${material.slug}`,
        lastModified: new Date(material.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  });

  // Add Products
  products.forEach((product: any) => {
    if (product.slug) {
      sitemapEntries.push({
        url: `${frontendUrl}/products/${product.slug}`,
        lastModified: new Date(product.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  });

  // Add Categories
  categories.forEach((category: any) => {
    if (category.slug) {
      sitemapEntries.push({
        url: `${frontendUrl}/category/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  });

  // Add Printers
  printers.forEach((printer: any) => {
    if (printer.slug) {
      sitemapEntries.push({
        url: `${frontendUrl}/printers/${printer.slug}`,
        lastModified: new Date(printer.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  });

  // Add Blogs
  blogs.forEach((blog: any) => {
    if (blog.slug) {
      sitemapEntries.push({
        url: `${frontendUrl}/blogs/${blog.slug}`,
        lastModified: new Date(blog.updated_at || new Date()),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  });

  // Add Brands
  brands.forEach((brand: any) => {
    if (brand.slug) {
      sitemapEntries.push({
        url: `${frontendUrl}/brand/${brand.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  });

  return sitemapEntries;
}
