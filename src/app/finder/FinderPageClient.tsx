"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";
import Accordion from "@/components/Accordion";
import RangeSlider from "@/components/RangeSlider";

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

type FinderProduct = ProductCardData & {
  createdAt: string | null;
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

type SortOption = "latest" | "oldest" | "name_asc" | "name_desc" | "price_asc" | "price_desc";

const SORT_LABELS: Record<SortOption, string> = {
  latest: "Latest",
  oldest: "Oldest",
  name_asc: "Name: A to Z",
  name_desc: "Name: Z to A",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

function normalizeType(raw: string | undefined): "simple" | "variable" | null {
  if (raw === "simple" || raw === "variable") return raw;
  return null;
}

function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === "") return null;
  const trimmed = url.trim();

  if (trimmed.startsWith("/") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  return `/api/media-proxy?url=${encodeURIComponent(trimmed)}`;
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) set.add(trimmed);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export default function FinderPageClient() {
  const searchParams = useSearchParams();
  const printerId = searchParams.get("printer_id");
  const productType = searchParams.get("product_type");

  const [printer, setPrinter] = useState<PrinterDetails | null>(null);
  const [allProducts, setAllProducts] = useState<FinderProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [sort, setSort] = useState<SortOption>("latest");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const filterScopeKey = `${printerId ?? ""}|${productType ?? ""}`;
  const [previousScopeKey, setPreviousScopeKey] = useState(filterScopeKey);
  if (filterScopeKey !== previousScopeKey) {
    setPreviousScopeKey(filterScopeKey);
    setSelectedMaterials(new Set());
    setSelectedCategories(new Set());
    setInStockOnly(false);
    setPriceRange(null);
    setSort("latest");
  }

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        if (!printerId) {
          setError("Printer ID is required");
          return;
        }

        const requestBody: {
          printer_id: number;
          product_type?: string;
          per_page: number;
        } = {
          printer_id: parseInt(printerId, 10),
          per_page: 100,
        };

        if (productType) {
          requestBody.product_type = productType;
        }

        const response = await fetch('/api/products/printer-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch products");
        }

        const json: SearchResponse = await response.json();

        setPrinter(json.printer);

        setAllProducts(
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
            createdAt: product.created_at ?? null,
          }))
        );
      } catch (err) {
        console.error("Error loading products:", err);
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, [printerId, productType]);

  const materialOptions = useMemo(
    () => uniqueSorted(allProducts.map((p) => p.materialTitle)),
    [allProducts],
  );

  const categoryOptions = useMemo(() => {
    const labels: string[] = [];
    for (const product of allProducts) {
      for (const category of product.categories ?? []) {
        if (category?.name) labels.push(category.name);
      }
    }
    return uniqueSorted(labels);
  }, [allProducts]);

  const priceBounds = useMemo<[number, number]>(() => {
    if (allProducts.length === 0) return [0, 0];
    let min = Infinity;
    let max = -Infinity;
    for (const product of allProducts) {
      if (typeof product.price === "number" && Number.isFinite(product.price)) {
        if (product.price < min) min = product.price;
        if (product.price > max) max = product.price;
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 0];
    return [Math.floor(min), Math.ceil(max)];
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    const result = allProducts.filter((product) => {
      if (inStockOnly && !product.inStock) return false;

      if (selectedMaterials.size > 0) {
        const material = product.materialTitle?.trim();
        if (!material || !selectedMaterials.has(material)) return false;
      }

      if (selectedCategories.size > 0) {
        const productCategoryNames = (product.categories ?? [])
          .map((category) => category?.name?.trim())
          .filter((name): name is string => Boolean(name));
        const matches = productCategoryNames.some((name) => selectedCategories.has(name));
        if (!matches) return false;
      }

      if (priceRange) {
        const price = typeof product.price === "number" ? product.price : null;
        if (price === null) return false;
        if (price < priceRange[0] || price > priceRange[1]) return false;
      }

      return true;
    });

    const sorted = [...result];
    sorted.sort((a, b) => {
      switch (sort) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "price_asc":
          return (a.price ?? 0) - (b.price ?? 0);
        case "price_desc":
          return (b.price ?? 0) - (a.price ?? 0);
        case "oldest":
          return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
        case "latest":
        default:
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      }
    });

    return sorted;
  }, [allProducts, inStockOnly, selectedMaterials, selectedCategories, priceRange, sort]);

  const productTypeLabel = productType === "labels" ? "Labels" : productType === "ink" ? "Ink" : "Products";

  const togglePill = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
  ) => {
    setter((previous) => {
      const next = new Set(previous);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const activeFilterCount =
    selectedMaterials.size +
    selectedCategories.size +
    (inStockOnly ? 1 : 0) +
    (priceRange ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedMaterials(new Set());
    setSelectedCategories(new Set());
    setInStockOnly(false);
    setPriceRange(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-360 px-10 py-12">
        {printer && !isLoading && (
          <div className="mb-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="flex gap-8">
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

        <div className="mb-8 flex flex-col gap-4">
          <h2 className="text-4xl font-bold text-neutral-800">
            Compatible {productTypeLabel}
          </h2>
          <p className="text-lg text-neutral-600">
            {printer && !isLoading && `Showing ${filteredProducts.length} of ${allProducts.length} compatible products for ${printer.title}`}
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
        ) : allProducts.length === 0 ? (
          <EmptyState
            title="No compatible products found"
            description="Try adjusting your selection or browse all products."
          />
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <aside className={`${filtersOpen ? "block" : "hidden"} w-full shrink-0 lg:block lg:w-72`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-neutral-800">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm font-medium text-amber-600 hover:text-amber-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Accordion title="Availability" defaultOpen size="compact">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(event) => setInStockOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-sm text-neutral-700">In stock only</span>
                  </label>
                </Accordion>

                {priceBounds[1] > priceBounds[0] && (
                  <Accordion title="Price" defaultOpen size="compact">
                    <RangeSlider
                      min={priceBounds[0]}
                      max={priceBounds[1]}
                      value={priceRange ?? priceBounds}
                      onChange={() => {}}
                      onAfterChange={(next) => {
                        if (next[0] === priceBounds[0] && next[1] === priceBounds[1]) {
                          setPriceRange(null);
                        } else {
                          setPriceRange(next);
                        }
                      }}
                      formatValue={(value) => `€${value}`}
                      inputPrefix="€"
                    />
                  </Accordion>
                )}

                {materialOptions.length > 0 && (
                  <Accordion title="Material" defaultOpen size="compact">
                    <div className="flex flex-wrap gap-2">
                      {materialOptions.map((option) => {
                        const selected = selectedMaterials.has(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => togglePill(option, setSelectedMaterials)}
                            className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                              selected
                                ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                                : "bg-slate-100 text-neutral-700 hover:bg-amber-50 hover:text-amber-600"
                            }`}
                            aria-pressed={selected}
                          >
                            <span>{option}</span>
                            {selected && <span className="text-base leading-none text-white/80">×</span>}
                          </button>
                        );
                      })}
                    </div>
                  </Accordion>
                )}

                {categoryOptions.length > 0 && (
                  <Accordion title="Category" defaultOpen size="compact">
                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map((option) => {
                        const selected = selectedCategories.has(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => togglePill(option, setSelectedCategories)}
                            className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                              selected
                                ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                                : "bg-slate-100 text-neutral-700 hover:bg-amber-50 hover:text-amber-600"
                            }`}
                            aria-pressed={selected}
                          >
                            <span>{option}</span>
                            {selected && <span className="text-base leading-none text-white/80">×</span>}
                          </button>
                        );
                      })}
                    </div>
                  </Accordion>
                )}
              </div>
            </aside>

            <div className="flex-1 flex flex-col gap-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  className="inline-flex h-10 w-fit items-center gap-2 rounded-[42px] border border-slate-200 px-5 text-neutral-800 lg:hidden"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M3 5H17" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M5.5 10H14.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8 15H12" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-base font-semibold leading-6">
                    Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                  </span>
                </button>

                <label className="flex h-10 w-fit items-center gap-3 rounded-[42px] border border-slate-200 px-5 text-neutral-800 md:ml-auto">
                  <span className="sr-only">Sort products</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortOption)}
                    className="bg-transparent text-base leading-5 outline-none cursor-pointer"
                  >
                    {Object.entries(SORT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {filteredProducts.length === 0 ? (
                <EmptyState
                  title="No products match your filters"
                  description="Try removing some filters to see more results."
                />
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => {
                    const href = product.slug
                      ? product.type
                        ? { pathname: `/products/${product.slug}`, query: { type: product.type } }
                        : { pathname: `/products/${product.slug}` }
                      : undefined;

                    return <ProductCard key={product.id} product={product} href={href} />;
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
