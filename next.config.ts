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
        source: '/en/software',
        destination: '/en/software-2',
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
      {
        source: '/faq',
        destination: '/epson-colorworks-faq',
        permanent: true,
      },
      {
        source: '/en/faq',
        destination: '/en/epson-colorworks-faq',
        permanent: true,
      },
      {
        source: '/knowledge',
        destination: '/kennisbank-overzicht',
        permanent: true,
      },
      {
        source: '/en/knowledge',
        destination: '/en/knowledge-base',
        permanent: true,
      },
      {
        source: '/en/kennisbank-overzicht',
        destination: '/en/knowledge-base',
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
// Force dev server reload 2
