"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductsListing, { type ListingProductCardData } from "@/components/ProductsListing";
import EmptyState from "@/components/EmptyState";

type SearchResponse = {
  data: Array<{
    id: number;
    type: "simple" | "variable" | string;
    slug?: string | null;
    title?: string | null;
    name: string;
    sku: string;
    subtitle?: string | null;
    excerpt?: string | null;
    price: number;
    original_price?: number | null;
    in_stock: boolean;
    main_image?: string | null;
    created_at?: string | null;
    material?: {
      title?: string | null;
    } | null;
    categories?: Array<{
      id?: number;
      name?: string | null;
    }>;
  }>;
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

function normalizeType(raw: string | undefined): "simple" | "variable" | null {
  if (raw === "simple" || raw === "variable") return raw;
  return null;
}

function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === "") return null;
  const trimmed = url.trim();
  
  // If it's already a local path, data URI, or blob, use as-is
  if (trimmed.startsWith("/") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // Proxy remote images through our API to avoid CORS issues
  return `/api/media-proxy?url=${encodeURIComponent(trimmed)}`;
}

export default function FinderPageClient() {
  const searchParams = useSearchParams();
  const printerIds = searchParams.get("printer_ids");
  const productType = searchParams.get("product_type");
  const page = searchParams.get("page") || "1";

  const [products, setProducts] = useState<ListingProductCardData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (printerIds) params.set("printer_ids", printerIds);
        if (productType) params.set("product_type", productType);
        params.set("page", page);
        params.set("per_page", "24");

        const response = await fetch(`/api/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const json: SearchResponse = await response.json();

        console.log("=== FINDER DEBUG ===");
        console.log("First product raw data:", json.data[0]);
        console.log("First product main_image:", json.data[0]?.main_image);
        console.log("After toDisplayImageUrl:", toDisplayImageUrl(json.data[0]?.main_image));

        setProducts(
          json.data.map((product) => ({
            id: product.id.toString(),
            sku: product.sku,
            name: product.title?.trim() || product.name,
            subtitle: product.subtitle ?? null,
            excerpt: product.excerpt ?? null,
            materialTitle: product.material?.title ?? null,
            price: product.price,
            originalPrice: product.original_price ?? null,
            inStock: product.in_stock,
            mainImage: toDisplayImageUrl(product.main_image),
            categories: product.categories ?? [],
            slug: product.slug ?? null,
            type: normalizeType(product.type),
          }))
        );

        setCurrentPage(json.current_page);
        setLastPage(json.last_page);
      } catch (err) {
        console.error("Error loading products:", err);
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, [printerIds, productType, page]);

  const productTypeLabel = productType === "labels" ? "Labels" : productType === "ink" ? "Ink" : "Products";

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-360 px-10 py-12">
        <div className="mb-8 flex flex-col gap-4">
          <h1 className="text-4xl font-bold text-neutral-800">Compatible {productTypeLabel}</h1>
          <p className="text-lg text-neutral-600">
            {printerIds && "Showing products compatible with your selected printer(s)"}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-96 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-red-700">
            {error}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No compatible products found"
            description="Try adjusting your selection or browse all products."
          />
        ) : (
          <ProductsListing
            products={products}
            currentPage={currentPage}
            lastPage={lastPage}
            basePath={`/finder?${new URLSearchParams({ 
              ...(printerIds && { printer_ids: printerIds }), 
              ...(productType && { product_type: productType }) 
            }).toString()}`}
          />
        )}
      </div>
    </div>
  );
}
