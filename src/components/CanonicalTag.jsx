"use client";

import { usePathname } from "next/navigation";

export default function CanonicalTag() {
  const pathname = usePathname();
  
  // Skip pages that already explicitly define canonicals in their generateMetadata to avoid duplicates
  if (!pathname || pathname === '/' || pathname.startsWith('/product/')) return null;

  // Use the public environment variables to form the base URL
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://businesslabels.nl";
  
  // Clean up double slashes just in case
  const baseUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
  const canonicalUrl = `${baseUrl}${pathname}`;

  return <link rel="canonical" href={canonicalUrl} />;
}
