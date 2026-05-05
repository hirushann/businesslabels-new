'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { LinkProps } from 'next/link';
import type { ReactNode } from 'react';

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
  const cardBody = (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[2px_6px_20px_0px_rgba(109,109,120,0.06)]">
      <div className="flex gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          <Image src={imageSrc} alt={name} fill sizes="96px" className="p-2 object-contain" unoptimized />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-neutral-800 text-base font-semibold leading-6">{name}</h3>
              <p className="text-blue-400 text-sm leading-5">SKU: {sku}</p>
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

          <div className="mt-auto flex items-end justify-between gap-3">
            {priceNode}
            {actionNode}
          </div>
        </div>
      </div>
    </div>
  );

  if (!href) {
    return cardBody;
  }

  return (
    <Link href={href} onClick={onCardClick} className="block">
      {cardBody}
    </Link>
  );
}
