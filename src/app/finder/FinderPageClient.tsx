"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import ProductsListing, { type ListingProductCardData } from "@/components/ProductsListing";
import EmptyState from "@/components/EmptyState";

type PrinterMeta = {
  druktype?: string[];
  kern?: string;
  width?: string[];
  max_buiten_diameter?: string;
};

type PrinterDetails = {
  id: number;
  title: string;
  subtitle?: string | null;
  slug: string;
  image?: string | null;
  meta?: PrinterMeta;
  created_at: string;
  updated_at: string;
};

type SearchResponse = {
  printer: PrinterDetails;
  products: {
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
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
  };
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
  const printerId = searchParams.get("printer_id");
  const productType = searchParams.get("product_type");
  const page = searchParams.get("page") || "1";

  const [printer, setPrinter] = useState<PrinterDetails | null>(null);
  const [products, setProducts] = useState<ListingProductCardData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        if (!printerId) {
          throw new Error("Printer ID is required");
        }

        const requestBody: {
          printer_id: number;
          product_type?: string;
          per_page: number;
        } = {
          printer_id: parseInt(printerId, 10),
          per_page: 24,
        };

        if (productType) {
          requestBody.product_type = productType;
        }

        const response = await fetch('/api/products/printer-products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch products");
        }

        const json: SearchResponse = await response.json();

        console.log("=== FINDER DEBUG ===");
        console.log("Printer data:", json.printer);
        console.log("First product raw data:", json.products.data[0]);
        console.log("First product main_image:", json.products.data[0]?.main_image);
        console.log("After toDisplayImageUrl:", toDisplayImageUrl(json.products.data[0]?.main_image));

        // Store printer details
        setPrinter(json.printer);

        // Parse products from nested structure
        setProducts(
          json.products.data.map((product) => ({
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

        setCurrentPage(json.products.meta.current_page);
        setLastPage(json.products.meta.last_page);
        setTotalProducts(json.products.meta.total);
      } catch (err) {
        console.error("Error loading products:", err);
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, [printerId, productType, page]);

  const productTypeLabel = productType === "labels" ? "Labels" : productType === "ink" ? "Ink" : "Products";

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-360 px-10 py-12">
        {/* Printer Details Section */}
        {printer && !isLoading && (
          <div className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="flex gap-8">
                {/* Left side - Printer info and specs */}
                <div className="flex-1">
                  <div className="mb-6">
                    <h1 className="text-4xl font-bold text-neutral-800 mb-2">
                      {printer.title}
                    </h1>
                    {printer.subtitle && (
                      <p className="text-lg text-sky-600">
                        {printer.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Media Specifications */}
                  {printer.meta && (
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-800 mb-4">
                        MEDIA SPECIFICATIES
                      </h2>
                      <div className="space-y-3">
                        {printer.meta.druktype && printer.meta.druktype.length > 0 && (
                          <div className="flex gap-2">
                            <span className="text-neutral-600 font-medium">
                              Afdruktechniek:
                            </span>
                            <span className="text-neutral-800">
                              {printer.meta.druktype.includes("TD") && printer.meta.druktype.includes("TT")
                                ? "Thermal Direct & Thermal Transfer"
                                : printer.meta.druktype.join(", ")}
                            </span>
                          </div>
                        )}
                        {printer.meta.kern && (
                          <div className="flex gap-2">
                            <span className="text-neutral-600 font-medium">Kern:</span>
                            <span className="text-neutral-800">{printer.meta.kern}</span>
                          </div>
                        )}
                        {printer.meta.width && printer.meta.width.length > 0 && (
                          <div className="flex gap-2">
                            <span className="text-neutral-600 font-medium">
                              Media breedte:
                            </span>
                            <span className="text-neutral-800">
                              Min {Math.min(...printer.meta.width.map(Number))} mm, Max{" "}
                              {Math.max(...printer.meta.width.map(Number))} mm
                            </span>
                          </div>
                        )}
                        {printer.meta.max_buiten_diameter && (
                          <div className="flex gap-2">
                            <span className="text-neutral-600 font-medium">
                              Max buiten diameter:
                            </span>
                            <span className="text-neutral-800">
                              {printer.meta.max_buiten_diameter}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side - Printer image */}
                {printer.image && (
                  <div className="w-96 shrink-0">
                    <div className="relative w-full h-80">
                      <Image
                        src={toDisplayImageUrl(printer.image) || "/placeholder-printer.png"}
                        alt={printer.title}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products Section Header */}
        <div className="mb-8 flex flex-col gap-4">
          <h2 className="text-4xl font-bold text-neutral-800">
            Compatible {productTypeLabel}
          </h2>
          <p className="text-lg text-neutral-600">
            {printer && `Showing ${totalProducts} compatible products for ${printer.title}`}
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
              ...(printerId && { printer_id: printerId }), 
              ...(productType && { product_type: productType }) 
            }).toString()}`}
          />
        )}
      </div>
    </div>
  );
}
