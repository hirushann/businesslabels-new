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
      disallow: [
        '/*?add-to-cart=*',
        '/*&add-to-cart=*',
        '/favorites',
        '/en/favorites',
        '/api/',
        '/login',
        '/en/login',
        '/login/*',
        '/en/login/*',
        '/register',
        '/en/register',
        '/my-account',
        '/en/my-account',
        '/my-account/*',
        '/en/my-account/*',
        '/account',
        '/en/account',
        '/account/*',
        '/en/account/*',
        '/winkelmand',
        '/en/cart',
        '/afrekenen',
        '/en/checkout',
        '/bedankt',
        '/en/thank-you',
        '/reset-password',
        '/en/reset-password',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
