"use client";

import Link from "next/link";
import { useState } from "react";
import EmptyState from "@/components/EmptyState";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";

export type ListingProductCardData = ProductCardData;

type ProductsListingProps = {
  products: ListingProductCardData[];
  currentPage: number;
  lastPage: number;
  basePath?: string;
};

type SortOption = "latest" | "oldest" | "name_asc" | "name_desc" | "price_asc" | "price_desc";

const SORT_LABELS: Record<SortOption, string> = {
  latest: "Latest",
  oldest: "Oldest",
  name_asc: "Name: A to Z",
  name_desc: "Name: Z to A",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

function buildVisiblePages(currentPage: number, lastPage: number): Array<number | "ellipsis"> {
  if (lastPage <= 1) {
    return [1];
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(lastPage);

  const start = Math.max(1, currentPage - 3);
  const end = Math.min(lastPage, currentPage + 3);

  for (let page = start; page <= end; page += 1) {
    pages.add(page);
  }

  const sortedPages = [...pages].sort((left, right) => left - right);
  const visible: Array<number | "ellipsis"> = [];

  for (let index = 0; index < sortedPages.length; index += 1) {
    const page = sortedPages[index];
    const previous = sortedPages[index - 1];

    if (previous && page - previous > 1) {
      visible.push("ellipsis");
    }

    visible.push(page);
  }

  return visible;
}

function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export default function ProductsListing({
  products,
  currentPage,
  lastPage,
  basePath = "/products",
}: ProductsListingProps) {
  const [sort] = useState<SortOption>("latest");
  const visiblePages = buildVisiblePages(currentPage, lastPage);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-4 rounded-[42px] border border-slate-200 px-5 py-2 text-neutral-800"
        >
          <span className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5H17" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M5.5 10H14.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 15H12" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-semibold font-['Segoe_UI'] leading-6">Filters</span>
          </span>
        </button>

        <label className="flex h-10 items-center gap-3 rounded-[42px] border border-slate-200 px-5 py-2 text-neutral-800">
          <span className="sr-only">Sort products</span>
          <select
            value={sort}
            readOnly
            className="bg-transparent text-base font-normal font-['Segoe_UI'] leading-5 outline-none"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="There are currently no products available in this listing."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => {
              const href = product.slug
                ? product.type
                  ? { pathname: `/products/${product.slug}`, query: { type: product.type } }
                  : { pathname: `/products/${product.slug}` }
                : undefined;

              return <ProductCard key={product.id} product={product} href={href} />;
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {currentPage > 1 ? (
              <Link
                href={pageHref(basePath, currentPage - 1)}
                className="rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-medium text-neutral-800"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-medium text-neutral-800 opacity-50">
                Previous
              </span>
            )}

            {visiblePages.map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="px-2 text-sm font-semibold text-zinc-500">
                  ...
                </span>
              ) : (
                <Link
                  key={item}
                  href={pageHref(basePath, item)}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-[50px] border border-slate-100 px-3 text-sm font-semibold ${
                    item === currentPage ? "bg-amber-500 text-white" : "text-neutral-700"
                  }`}
                >
                  {item}
                </Link>
              )
            )}

            {currentPage < lastPage ? (
              <Link
                href={pageHref(basePath, currentPage + 1)}
                className="rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-semibold text-neutral-800"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-semibold text-neutral-800 opacity-50">
                Next
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
