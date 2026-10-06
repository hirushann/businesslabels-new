'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { localePath } from '@/lib/i18n/utils';

export type PostCategoryData = {
  id: number;
  parent_id?: number | null;
  name: any;
  slug: any;
  post_count: number;
  children?: PostCategoryData[];
};

interface BlogCategoryTabsProps {
  categories: PostCategoryData[];
  activeCategory: string;
  locale: string;
  allLabel: string;
  basePath?: string;
}

function resolveText(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    const record = val as Record<string, unknown>;
    const text = record.nl ?? record.en ?? Object.values(record)[0];
    return typeof text === 'string' ? text : '';
  }
  return '';
}

export default function BlogCategoryTabs({
  categories,
  activeCategory,
  locale,
  allLabel,
  basePath = '/blog',
}: BlogCategoryTabsProps) {
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenCategoryId(null);
    }, 150);
  };

  const handleMouseEnterTab = (catId: number, hasChildren: boolean) => {
    clearCloseTimeout();
    if (hasChildren) {
      setOpenCategoryId(catId);
    } else {
      setOpenCategoryId(null);
    }
  };

  const handleMouseEnterDropdown = () => {
    clearCloseTimeout();
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  const buildHref = (slug?: string) => {
    if (!slug) return localePath(basePath, locale);
    const sep = basePath.includes('?') ? '&' : '?';
    return localePath(`${basePath}${sep}category=${encodeURIComponent(slug)}`, locale);
  };

  return (
    <div className="w-full flex flex-col justify-end items-start">
      <div className="w-full flex overflow-x-auto no-scrollbar items-start">
        {/* 'All' Category Tab */}
        <Link
          href={buildHref()}
          onMouseEnter={() => {
            clearCloseTimeout();
            setOpenCategoryId(null);
          }}
          className={`px-2.5 flex justify-center items-center gap-2.5 relative transition-colors ${
            activeCategory === 'all'
              ? 'text-brand font-bold'
              : 'text-neutral-700 font-semibold hover:text-brand'
          }`}
        >
          <span className="text-base leading-5 whitespace-nowrap p-3">{allLabel}</span>
          {activeCategory === 'all' && (
            <div className="w-full h-0.5 absolute bottom-0 bg-brand rounded-sm z-10" />
          )}
        </Link>

        {/* Categories */}
        {categories.map((category) => {
          const catName = resolveText(category.name);
          const catSlug = resolveText(category.slug);
          if (!catSlug) return null;

          const hasChildren = Boolean(category.children && category.children.length > 0);
          const isSelfActive = activeCategory === catSlug;
          const isChildActive = Boolean(
            category.children?.some((child) => resolveText(child.slug) === activeCategory)
          );
          const isActive = isSelfActive || isChildActive;
          const isOpen = openCategoryId === category.id;

          if (!hasChildren) {
            return (
              <Link
                key={catSlug}
                href={buildHref(catSlug)}
                onMouseEnter={() => handleMouseEnterTab(category.id, false)}
                className={`px-2.5 flex justify-center items-center gap-2.5 relative transition-colors ${
                  isActive
                    ? 'text-brand font-bold'
                    : 'text-neutral-700 font-semibold hover:text-brand'
                }`}
              >
                <span className="text-base leading-5 whitespace-nowrap p-3">{catName || catSlug}</span>
                {isActive && (
                  <div className="w-full h-0.5 absolute bottom-0 bg-brand rounded-sm z-10" />
                )}
              </Link>
            );
          }

          return (
            <Popover
              key={catSlug}
              open={isOpen}
              onOpenChange={(open) => {
                if (!open) setOpenCategoryId(null);
              }}
            >
              <PopoverAnchor asChild>
                <div
                  onMouseEnter={() => handleMouseEnterTab(category.id, true)}
                  onMouseLeave={scheduleClose}
                  className="relative flex items-center group cursor-pointer"
                >
                  <Link
                    href={buildHref(catSlug)}
                    className={`pl-3 pr-1 py-3 flex items-center gap-1.5 relative transition-colors ${
                      isActive
                        ? 'text-brand font-bold'
                        : 'text-neutral-700 font-semibold group-hover:text-brand hover:text-brand'
                    }`}
                  >
                    <span className="text-base leading-5 whitespace-nowrap">{catName || catSlug}</span>
                    {isActive && (
                      <div className="w-full h-0.5 absolute bottom-0 left-0 bg-brand rounded-sm z-10" />
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearCloseTimeout();
                      setOpenCategoryId(isOpen ? null : category.id);
                    }}
                    aria-label={`Toggle ${catName || catSlug} subcategories`}
                    className={`p-1 pr-3 flex items-center justify-center transition-colors cursor-pointer ${
                      isActive
                        ? 'text-brand'
                        : 'text-neutral-500 group-hover:text-brand hover:text-brand'
                    }`}
                  >
                    <ChevronDown
                      className={`size-3.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </PopoverAnchor>

              <PopoverContent
                align="start"
                sideOffset={4}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                onMouseEnter={handleMouseEnterDropdown}
                onMouseLeave={scheduleClose}
                className="w-auto min-w-[210px] max-w-xs p-1.5 bg-white rounded-xl shadow-xl border border-slate-100 z-50 flex flex-col gap-0.5 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
              >
                {category.children?.map((child) => {
                  const childName = resolveText(child.name);
                  const childSlug = resolveText(child.slug);
                  if (!childSlug) return null;

                  const isCurrentChild = activeCategory === childSlug;
                  return (
                    <Link
                      key={childSlug}
                      href={buildHref(childSlug)}
                      onClick={() => setOpenCategoryId(null)}
                      className={`px-3.5 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between gap-3 ${
                        isCurrentChild
                          ? 'bg-amber-50 text-brand font-bold'
                          : 'text-neutral-700 font-medium hover:bg-amber-50/60 hover:text-brand'
                      }`}
                    >
                      <span className="truncate">{childName || childSlug}</span>
                      {child.post_count > 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isCurrentChild
                              ? 'bg-amber-100 text-brand font-bold'
                              : 'bg-slate-100 text-neutral-400'
                          }`}
                        >
                          {child.post_count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
      <div className="w-full h-px bg-slate-200" />
    </div>
  );
}
