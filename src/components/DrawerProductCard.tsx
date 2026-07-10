'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { LinkProps } from 'next/link';
import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { localePath } from '@/lib/i18n/utils';

type DrawerProductCardProps = {
  name: string;
  sku: string;
  imageSrc: string;
  removeLabel: string;
  onRemove: () => void;
  priceNode: ReactNode;
  actionNode: ReactNode;
  descriptionNode?: ReactNode;
  href?: LinkProps['href'];
  onCardClick?: () => void;
};

export default function DrawerProductCard({
  name,
  sku,
  imageSrc,
  removeLabel,
  onRemove,
  priceNode,
  actionNode,
  descriptionNode,
  href,
  onCardClick,
}: DrawerProductCardProps) {
  const locale = useLocale();

  const localizedHref: LinkProps['href'] | undefined = (() => {
    if (!href) return undefined;
    if (typeof href === 'string') return localePath(href, locale);
    if (typeof href === 'object' && 'pathname' in href && typeof href.pathname === 'string') {
      return { ...href, pathname: localePath(href.pathname, locale) };
    }
    return href;
  })();

  const cardBody = (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[2px_6px_20px_0px_rgba(109,109,120,0.06)]">
      <div className="flex gap-4">
        {localizedHref ? (
          <Link
            href={localizedHref}
            onClick={onCardClick}
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100"
            aria-label={name}
          >
            <Image src={imageSrc} alt={name} fill sizes="96px" className="p-2 object-contain" unoptimized />
          </Link>
        ) : (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image src={imageSrc} alt={name} fill sizes="96px" className="p-2 object-contain" unoptimized />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-neutral-800 text-base font-semibold leading-6">
                {localizedHref ? (
                  <Link href={localizedHref} onClick={onCardClick} className="hover:text-brand transition-colors">
                    {name}
                  </Link>
                ) : (
                  name
                )}
              </h3>
              <p className="text-link text-sm leading-5">
                {localizedHref ? (
                  <Link href={localizedHref} onClick={onCardClick} className="hover:text-brand transition-colors">
                    SKU: {sku}
                  </Link>
                ) : (
                  <>SKU: {sku}</>
                )}
              </p>
              {descriptionNode}
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRemove();
              }}
              aria-label={removeLabel}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            {priceNode}
            <div
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
              }}
            >
              {actionNode}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return cardBody;
}
