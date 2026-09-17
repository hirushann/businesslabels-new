/**
 * Environment and SEO indexing utility.
 * When DEVELOPMENT=true (or staging), search engine indexing is strictly disabled site-wide.
 */

export function isDevelopmentMode(): boolean {
  const dev = process.env.DEVELOPMENT;
  if (dev === 'true' || dev === '1') return true;
  if (dev === 'false' || dev === '0') return false;

  const nextDev = process.env.NEXT_PUBLIC_DEVELOPMENT;
  if (nextDev === 'true' || nextDev === '1') return true;
  if (nextDev === 'false' || nextDev === '0') return false;

  // Staging / preview environments fallback to noindex by default
  return (
    process.env.NEXT_PUBLIC_APP_ENV === 'staging' ||
    process.env.VERCEL_ENV === 'preview'
  );
}

export function getRobotsMetadata(options?: { defaultIndex?: boolean }) {
  if (isDevelopmentMode()) {
    return {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    };
  }

  const shouldIndex = options?.defaultIndex ?? true;
  return {
    index: shouldIndex,
    follow: shouldIndex,
  };
}
