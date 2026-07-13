import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging' || process.env.VERCEL_ENV === 'preview';

  if (isStaging) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  // Production robots.txt
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    // sitemap: 'https://yourdomain.com/sitemap.xml',
  };
}
