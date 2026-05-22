'use client';

import Link from 'next/link';
import type { LinkProps } from 'next/link';
import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { localePath } from '@/lib/i18n/utils';

type LocaleLinkProps = Omit<LinkProps, 'href'> & {
  href: string;
  className?: string;
  children: ReactNode;
};

/**
 * Drop-in replacement for Next.js `<Link>` that automatically prepends the
 * locale prefix (`/en`) for English users.
 *
 * Use this instead of `<Link>` for any internal navigation link.
 * NL users see the path unchanged; EN users see `/en` prepended.
 */
export default function LocaleLink({ href, children, ...props }: LocaleLinkProps) {
  const locale = useLocale();
  const prefixedHref = localePath(href, locale);
  return (
    <Link href={prefixedHref} {...props}>
      {children}
    </Link>
  );
}
