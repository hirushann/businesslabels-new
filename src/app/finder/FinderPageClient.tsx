"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";
import Accordion from "@/components/Accordion";
import RangeSlider from "@/components/RangeSlider";

type PrinterProperties = {
  printmethode?: string[]; // New: TD, TT
  druktype?: string[]; // Legacy fallback
  kern?: string[];
  breedte?: string[];
  'label-breedte-min'?: string[];
  'label-breedte-max'?: string[];
  'max-buiten-diameter'?: string[];
  max_buiten_diameter?: string; // Legacy fallback
  width?: string[]; // Legacy fallback
};

type ProductProperties = {
  printmethode?: string[];
  breedte?: string[];
  hoogte?: string[];
  kern?: string[];
  'buiten-diameter'?: string[];
  materiaal?: string[];
  afwerking?: string[];
  lijm?: string[];
  [key: string]: string[] | undefined;
};

type ProductPropertyKey = keyof ProductProperties;

type PrinterDetails = {
  id: number;
  title: string;
  subtitle?: string | null;
  slug: string;
  image?: string | null;
  properties?: PrinterProperties;
  created_at: string;
  updated_at: string;
};

type FinderProduct = ProductCardData & {
  createdAt: string | null;
  properties?: ProductProperties | null;
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
      properties?: unknown;
      [key: string]: unknown;
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

function stringValuesFromUnknown(value: unknown): string[] {
  if (value == null) return [];

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = String(value).trim();
    return text ? [text] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => stringValuesFromUnknown(item));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return stringValuesFromUnknown(record.value ?? record.values ?? record.name ?? record.label ?? record.title);
  }

  return [];
}

function propertyValueFromRawProduct(product: Record<string, unknown>, key: ProductPropertyKey): string[] {
  const properties = product.properties;

  if (properties && typeof properties === "object") {
    if (Array.isArray(properties)) {
      const values = properties.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const record = item as Record<string, unknown>;
        return record.key === key || record.name === key || record.code === key
          ? stringValuesFromUnknown(record.value ?? record.values)
          : [];
      });
      if (values.length > 0) return values;
    } else {
      const value = (properties as Record<string, unknown>)[key];
      const values = stringValuesFromUnknown(value);
      if (values.length > 0) return values;
    }
  }

  return stringValuesFromUnknown(product[key]);
}

function normalizeProductProperties(product: Record<string, unknown>): ProductProperties {
  const keys: ProductPropertyKey[] = [
    "printmethode",
    "breedte",
    "hoogte",
    "kern",
    "buiten-diameter",
    "materiaal",
    "afwerking",
    "lijm",
  ];

  return Object.fromEntries(
    keys
      .map((key) => [key, uniqueSorted(propertyValueFromRawProduct(product, key))] as const)
      .filter(([, values]) => values.length > 0),
  ) as ProductProperties;
}

export default function FinderPageClient() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const printerId = searchParams.get("printer_id");
  const productType = searchParams.get("product_type");

  const SORT_LABELS: Record<SortOption, string> = {
    latest: t('sort.latest'),
    oldest: t('sort.oldest'),
    name_asc: t('sort.nameAsc'),
    name_desc: t('sort.nameDesc'),
    price_asc: t('sort.priceAsc'),
    price_desc: t('sort.priceDesc'),
  };

  const [printer, setPrinter] = useState<PrinterDetails | null>(null);
  const [allProducts, setAllProducts] = useState<FinderProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedPrintMethods, setSelectedPrintMethods] = useState<Set<string>>(new Set());
  const [selectedWidths, setSelectedWidths] = useState<Set<string>>(new Set());
  const [selectedCores, setSelectedCores] = useState<Set<string>>(new Set());
  const [selectedOuterDiameters, setSelectedOuterDiameters] = useState<Set<string>>(new Set());
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
    setSelectedPrintMethods(new Set());
    setSelectedWidths(new Set());
    setSelectedCores(new Set());
    setSelectedOuterDiameters(new Set());
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
          setError(t('finder.printerIdRequired'));
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
          throw new Error(errorData.message || t('finder.failedToFetchProducts'));
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
            properties: normalizeProductProperties(product),
          }))
        );
      } catch (err) {
        console.error("Error loading products:", err);
        setError(err instanceof Error ? err.message : t('finder.failedToLoadProducts'));
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, [printerId, productType, t]);

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

  const printMethodOptions = useMemo(
    () => uniqueSorted(allProducts.flatMap((product) => product.properties?.printmethode ?? [])),
    [allProducts],
  );

  const widthOptions = useMemo(
    () => uniqueSorted(allProducts.flatMap((product) => product.properties?.breedte ?? [])),
    [allProducts],
  );

  const coreOptions = useMemo(
    () => uniqueSorted(allProducts.flatMap((product) => product.properties?.kern ?? [])),
    [allProducts],
  );

  const outerDiameterOptions = useMemo(
    () => uniqueSorted(allProducts.flatMap((product) => product.properties?.["buiten-diameter"] ?? [])),
    [allProducts],
  );

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

      if (selectedPrintMethods.size > 0) {
        const methods = product.properties?.printmethode ?? [];
        if (!methods.some((method) => selectedPrintMethods.has(method))) return false;
      }

      if (selectedWidths.size > 0) {
        const widths = product.properties?.breedte ?? [];
        if (!widths.some((width) => selectedWidths.has(width))) return false;
      }

      if (selectedCores.size > 0) {
        const cores = product.properties?.kern ?? [];
        if (!cores.some((core) => selectedCores.has(core))) return false;
      }

      if (selectedOuterDiameters.size > 0) {
        const outerDiameters = product.properties?.["buiten-diameter"] ?? [];
        if (!outerDiameters.some((outerDiameter) => selectedOuterDiameters.has(outerDiameter))) return false;
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
  }, [
    allProducts,
    inStockOnly,
    selectedMaterials,
    selectedCategories,
    selectedPrintMethods,
    selectedWidths,
    selectedCores,
    selectedOuterDiameters,
    priceRange,
    sort,
  ]);

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
    selectedPrintMethods.size +
    selectedWidths.size +
    selectedCores.size +
    selectedOuterDiameters.size +
    (inStockOnly ? 1 : 0) +
    (priceRange ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedMaterials(new Set());
    setSelectedCategories(new Set());
    setSelectedPrintMethods(new Set());
    setSelectedWidths(new Set());
    setSelectedCores(new Set());
    setSelectedOuterDiameters(new Set());
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

                  {printer.properties && (
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-800 mb-4">
                        {t('finder.mediaSpecifications')}
                      </h2>
                      <div className="space-y-3">
                        {(() => {
                          const printMethods = printer.properties.printmethode || printer.properties.druktype;
                          return printMethods && printMethods.length > 0 && (
                            <div className="flex gap-2">
                              <span className="text-neutral-600 font-medium">
                                {t('finder.printTechnology')}
                              </span>
                              <span className="text-neutral-800">
                                {printMethods.includes("TD") && printMethods.includes("TT")
                                  ? "Thermal Direct & Thermal Transfer"
                                  : printMethods.join(", ")}
                              </span>
                            </div>
                          );
                        })()}
                        {printer.properties.kern && printer.properties.kern.length > 0 && (
                          <div className="flex gap-2">
                            <span className="text-neutral-600 font-medium">{t('finder.core')}</span>
                            <span className="text-neutral-800">{printer.properties.kern.join(", ")} mm</span>
                          </div>
                        )}
                        {(() => {
                          const minWidth = printer.properties['label-breedte-min']?.[0];
                          const maxWidth = printer.properties['label-breedte-max']?.[0];
                          const widths = printer.properties.breedte || printer.properties.width;
                          
                          if (minWidth && maxWidth) {
                            return (
                              <div className="flex gap-2">
                                <span className="text-neutral-600 font-medium">
                                  {t('finder.mediaWidth')}
                                </span>
                                <span className="text-neutral-800">
                                  {t('finder.min')} {minWidth} mm, {t('finder.max')} {maxWidth} mm
                                </span>
                              </div>
                            );
                          } else if (widths && widths.length > 0) {
                            return (
                              <div className="flex gap-2">
                                <span className="text-neutral-600 font-medium">
                                  {t('finder.mediaWidth')}
                                </span>
                                <span className="text-neutral-800">
                                  {t('finder.min')} {Math.min(...widths.map(Number))} mm, {t('finder.max')}{" "}
                                  {Math.max(...widths.map(Number))} mm
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {(() => {
                          const maxOD = printer.properties['max-buiten-diameter']?.[0] || printer.properties.max_buiten_diameter;
                          return maxOD && (
                            <div className="flex gap-2">
                              <span className="text-neutral-600 font-medium">
                                {t('finder.maxOuterDiameter')}
                              </span>
                              <span className="text-neutral-800">
                                {maxOD} mm
                              </span>
                            </div>
                          );
                        })()}
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
            {t('finder.compatibleProductsTitle', { type: productTypeLabel })}
          </h2>
          <p className="text-lg text-neutral-600">
            {printer && !isLoading && t('finder.showingCompatibleProducts', {
              filtered: filteredProducts.length,
              total: allProducts.length,
              printer: printer.title,
            })}
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
            title={t('common.noProductsFound')}
            description={t('finder.noProductsDescription')}
          />
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <aside className={`${filtersOpen ? "block" : "hidden"} w-full shrink-0 lg:block lg:w-72`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-neutral-800">{t('finder.filters')}</h3>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm font-medium text-amber-600 hover:text-amber-700"
                  >
                    {t('finder.clearFilters')}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Accordion title={t('common.availability')} defaultOpen size="compact">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(event) => setInStockOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-sm text-neutral-700">{t('finder.inStockOnly')}</span>
                  </label>
                </Accordion>

                {priceBounds[1] > priceBounds[0] && (
                  <Accordion title={t('finder.priceRange')} defaultOpen size="compact">
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

                {printMethodOptions.length > 0 && (
                  <Accordion title={t('filters.print_method')} defaultOpen size="compact">
                    <div className="flex flex-wrap gap-2">
                      {printMethodOptions.map((option) => {
                        const selected = selectedPrintMethods.has(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => togglePill(option, setSelectedPrintMethods)}
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

                {widthOptions.length > 0 && (
                  <Accordion title={t('filters.width')} defaultOpen size="compact">
                    <div className="flex flex-wrap gap-2">
                      {widthOptions.map((option) => {
                        const selected = selectedWidths.has(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => togglePill(option, setSelectedWidths)}
                            className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                              selected
                                ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                                : "bg-slate-100 text-neutral-700 hover:bg-amber-50 hover:text-amber-600"
                            }`}
                            aria-pressed={selected}
                          >
                            <span>{option} mm</span>
                            {selected && <span className="text-base leading-none text-white/80">×</span>}
                          </button>
                        );
                      })}
                    </div>
                  </Accordion>
                )}

                {coreOptions.length > 0 && (
                  <Accordion title={t('filters.core')} defaultOpen size="compact">
                    <div className="flex flex-wrap gap-2">
                      {coreOptions.map((option) => {
                        const selected = selectedCores.has(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => togglePill(option, setSelectedCores)}
                            className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                              selected
                                ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                                : "bg-slate-100 text-neutral-700 hover:bg-amber-50 hover:text-amber-600"
                            }`}
                            aria-pressed={selected}
                          >
                            <span>{option} mm</span>
                            {selected && <span className="text-base leading-none text-white/80">×</span>}
                          </button>
                        );
                      })}
                    </div>
                  </Accordion>
                )}

                {outerDiameterOptions.length > 0 && (
                  <Accordion title={t('filters.outer_diameter')} defaultOpen size="compact">
                    <div className="flex flex-wrap gap-2">
                      {outerDiameterOptions.map((option) => {
                        const selected = selectedOuterDiameters.has(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => togglePill(option, setSelectedOuterDiameters)}
                            className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                              selected
                                ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                                : "bg-slate-100 text-neutral-700 hover:bg-amber-50 hover:text-amber-600"
                            }`}
                            aria-pressed={selected}
                          >
                            <span>{option} mm</span>
                            {selected && <span className="text-base leading-none text-white/80">×</span>}
                          </button>
                        );
                      })}
                    </div>
                  </Accordion>
                )}

                {materialOptions.length > 0 && (
                  <Accordion title={t('finder.material')} defaultOpen size="compact">
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
                  <Accordion title={t('finder.category')} defaultOpen size="compact">
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
                    {t('finder.filters')}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                  </span>
                </button>

                <label className="flex h-10 w-fit items-center gap-3 rounded-[42px] border border-slate-200 px-5 text-neutral-800 md:ml-auto">
                  <span className="sr-only">{t('sort.sortBy')}</span>
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
                  title={t('finder.noProductsMatchFilters')}
                  description={t('finder.removeFiltersDescription')}
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
