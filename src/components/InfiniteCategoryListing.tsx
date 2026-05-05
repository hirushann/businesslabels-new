"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";

type SortOption = "name_asc";
const SORT_LABELS: Record<SortOption, string> = {
  name_asc: "Name: A to Z",
};

export default function InfiniteCategoryListing({
  categoryTitle,
  initialProducts,
  categorySlug,
  fetchMoreProducts,
}: {
  categoryTitle: string;
  initialProducts: ProductCardData[];
  categorySlug: string;
  fetchMoreProducts: (slug: string, page: number) => Promise<ProductCardData[]>;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sort] = useState<SortOption>("name_asc");
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const nextPage = page + 1;
      const newProducts = await fetchMoreProducts(categorySlug, nextPage);
      
      if (newProducts.length === 0) {
        setHasMore(false);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [categorySlug, page, hasMore, isLoading, fetchMoreProducts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold text-neutral-900">All {categoryTitle}</h2>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-neutral-800"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5H17" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5.5 10H14.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8 15H12" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-base font-bold font-['Segoe_UI'] leading-6 text-neutral-800">Filters</span>
        </button>

        <label className="flex items-center gap-3 text-neutral-800">
          <span className="sr-only">Sort products</span>
          <select
            value={sort}
            disabled
            className="bg-transparent text-sm font-normal font-['Segoe_UI'] leading-5 outline-none cursor-pointer text-neutral-600 appearance-none pr-4 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201.5L6%206.5L11%201.5%22%20stroke%3D%22%2352525B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const href = product.slug
            ? product.type
              ? { pathname: `/products/${product.slug}`, query: { type: product.type } }
              : { pathname: `/products/${product.slug}` }
            : undefined;

          // Make sure to add a unique key even for infinite scroll appending
          return <ProductCard key={`prod-${product.id}`} product={product} href={href} />;
        })}
        
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={`loading-skeleton-${i}`} className="flex flex-col gap-4 w-full bg-white border border-gray-100/50 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-pulse">
            <div className="w-full aspect-[4/3] bg-slate-100 rounded-xl mb-2"></div>
            <div className="w-2/3 h-5 bg-slate-100 rounded-full mt-2"></div>
            <div className="w-1/2 h-5 bg-slate-100 rounded-full"></div>
            <div className="w-1/3 h-5 bg-slate-100 rounded-full mt-1"></div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="h-20 w-full flex justify-center items-center mt-4">
          {!isLoading && <div className="text-gray-400">Scroll for more...</div>}
        </div>
      )}
    </div>
  );
}
