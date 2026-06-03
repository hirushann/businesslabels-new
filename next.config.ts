import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "businesslabels.test",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "bbnl.dayzsolutions.com",
      },
    ],
    localPatterns: [
      {
        pathname: '/api/media-proxy',
        search: '',
      },
      {
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async redirects() {
    return [
      {
        source: '/products/:slug*',
        destination: '/product/:slug*',
        permanent: true,
      },
      {
        source: '/en/products/:slug*',
        destination: '/en/product/:slug*',
        permanent: true,
      },
      {
        source: '/en/software-2',
        destination: '/en/software',
        permanent: true,
      },
      {
        source: '/brand/diamondlabels',
        destination: '/brand/diamondlabels-nl',
        permanent: true,
      },
      {
        source: '/en/brand/diamondlabels',
        destination: '/en/brand/diamondlabels-nl',
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
// Force dev server reload 1
