import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging' || process.env.VERCEL_ENV === 'preview';

  const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_ENV !== 'staging') {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://businesslabels.nl';
  };

  const baseUrl = getBaseUrl();

  if (isStaging) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  // Production robots.txt
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
