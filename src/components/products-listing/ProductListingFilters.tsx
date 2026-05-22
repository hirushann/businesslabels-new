"use client";

import { useState } from "react";
import { useSearch } from "@elastic/react-search-ui";
import type { Filter, FilterValueRange } from "@elastic/search-ui";
import { useTranslations } from "next-intl";
import Accordion from "@/components/Accordion";
import RangeSlider from "@/components/RangeSlider";

const INITIAL_MIN = 0;
const FALLBACK_MAX_BY_FIELD: Record<RangeFilterField, number> = {
  price: 5000,
  meta_width_mm: 100,
  meta_height_mm: 100,
  meta_kern_mm: 100,
};

type RangeFilterField = "price" | "meta_width_mm" | "meta_height_mm" | "meta_kern_mm";

type RangeFilterConfig = {
  titleKey: string;
  field: RangeFilterField;
  name: string;
  unitPrefix?: string;
  unitSuffix?: string;
};

type OptionFilterConfig = {
  titleKey: string;
  field: string;
  responseKey: "category" | "brand" | "materialCode" | "material" | "finishing" | "glue" | "kern";
};

type FilterOption = {
  value: string;
  label: string;
  count?: number;
};

const RANGE_FILTERS: RangeFilterConfig[] = [
  { titleKey: "filters.priceRange", field: "price", name: "price", unitPrefix: "€" },
  { titleKey: "filters.labelWidth", field: "meta_width_mm", name: "width", unitSuffix: "mm" },
  { titleKey: "filters.labelHeight", field: "meta_height_mm", name: "height", unitSuffix: "mm" },
  { titleKey: "filters.coreSize", field: "meta_kern_mm", name: "kern", unitSuffix: "mm" },
];

const OPTION_FILTERS: OptionFilterConfig[] = [
  { titleKey: "filters.productType", field: "search_category_slug", responseKey: "category" },
  { titleKey: "filters.brand", field: "search_brand_slug", responseKey: "brand" },
  { titleKey: "filters.material_code", field: "meta_material_code", responseKey: "materialCode" },
  { titleKey: "filters.materialType", field: "meta_material", responseKey: "material" },
  { titleKey: "filters.finishing", field: "meta_finishing", responseKey: "finishing" },
  { titleKey: "filters.glue", field: "meta_glue", responseKey: "glue" },
  { titleKey: "filters.coreType", field: "meta_kern_string", responseKey: "kern" },
];

function isRangeFilter(value: unknown): value is FilterValueRange {
  return typeof value === "object" && value !== null && "name" in value;
}

function numericValue(value: FilterValueRange["from"]): number | null {
  return typeof value === "number" ? value : null;
}

function rawMaxValue(rawResponse: unknown, field: RangeFilterField): number | null {
  if (!rawResponse || typeof rawResponse !== "object") return null;

  const stats = rawResponse as {
    priceStats?: { max?: unknown };
    dimensionStats?: {
      width?: { max?: unknown };
      height?: { max?: unknown };
      kern?: { max?: unknown };
    };
  };

  const value =
    field === "price"
      ? stats.priceStats?.max
      : field === "meta_width_mm"
        ? stats.dimensionStats?.width?.max
        : field === "meta_height_mm"
          ? stats.dimensionStats?.height?.max
          : stats.dimensionStats?.kern?.max;

  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function sliderMax(rawResponse: unknown, field: RangeFilterField): number {
  return Math.ceil(rawMaxValue(rawResponse, field) ?? FALLBACK_MAX_BY_FIELD[field]);
}

function formatRangeValue(value: number, config: RangeFilterConfig): string {
  return `${config.unitPrefix ?? ""}${value}${config.unitSuffix ? ` ${config.unitSuffix}` : ""}`;
}

function optionsFor(rawResponse: unknown, responseKey: OptionFilterConfig["responseKey"]): FilterOption[] {
  if (!rawResponse || typeof rawResponse !== "object") return [];

  const options = (rawResponse as {
    pillFilters?: Record<OptionFilterConfig["responseKey"], { options?: unknown } | undefined>;
  }).pillFilters?.[responseKey]?.options;

  if (!Array.isArray(options)) return [];

  return options
    .map((option): FilterOption | null => {
      if (!option || typeof option !== "object") return null;

      const item = option as { value?: unknown; label?: unknown; count?: unknown };
      if (typeof item.value !== "string" || item.value.trim() === "") return null;

      return {
        value: item.value,
        label: typeof item.label === "string" && item.label.trim() !== "" ? item.label : item.value,
        count: typeof item.count === "number" ? item.count : undefined,
      };
    })
    .filter((option): option is FilterOption => option !== null);
}

function isSelectedValue(value: unknown): value is string {
  return typeof value === "string";
}

function ProductRangeFilter({
  config,
  activeFilters,
  rawResponse,
  removeFilter,
  setFilter,
}: {
  config: RangeFilterConfig;
  activeFilters: Filter[];
  rawResponse: unknown;
  removeFilter: (name: string) => void;
  setFilter: (name: string, value: FilterValueRange) => void;
}) {
  const t = useTranslations();
  const max = sliderMax(rawResponse, config.field);
  const filter = activeFilters.find((activeFilter) => activeFilter.field === config.field);
  const filterRange = filter?.values.find(isRangeFilter);
  const range: [number, number] = [
    Math.min(numericValue(filterRange?.from) ?? INITIAL_MIN, max),
    Math.min(numericValue(filterRange?.to) ?? max, max),
  ];

  const handleAfterChange = (newRange: [number, number]) => {
    if (newRange[0] === INITIAL_MIN && newRange[1] === max) {
      removeFilter(config.field);
      return;
    }

    setFilter(config.field, { name: config.name, from: newRange[0], to: newRange[1] });
  };

  return (
    <Accordion title={t(config.titleKey)} defaultOpen={true} size="compact" className="bg-white">
      <RangeSlider
        min={INITIAL_MIN}
        max={max}
        value={range}
        onChange={() => {}}
        onAfterChange={handleAfterChange}
        formatValue={(value) => formatRangeValue(value, config)}
        inputPrefix={config.unitPrefix}
      />
    </Accordion>
  );
}

function ProductOptionFilter({
  config,
  activeFilters,
  rawResponse,
  addFilter,
  removeFilter,
}: {
  config: OptionFilterConfig;
  activeFilters: Filter[];
  rawResponse: unknown;
  addFilter: (name: string, value: string, type?: "any") => void;
  removeFilter: (name: string, value?: string, type?: "any") => void;
}) {
  const t = useTranslations();
  const [showAll, setShowAll] = useState(false);
  const options = optionsFor(rawResponse, config.responseKey);
  if (
    config.responseKey === "kern" &&
    !options.some((option) => option.value.toLowerCase() === "fan-fold")
  ) {
    options.unshift({ value: "Fan-fold", label: "Fan-fold", count: 0 });
  }

  const selectedValues = new Set(
    activeFilters
      .find((activeFilter) => activeFilter.field === config.field && activeFilter.type === "any")
      ?.values.filter(isSelectedValue) ?? [],
  );

  const DISPLAY_LIMIT = 10;
  const displayedOptions = showAll ? options : options.slice(0, DISPLAY_LIMIT);
  const hasMore = options.length > DISPLAY_LIMIT;

  return (
    <Accordion title={t(config.titleKey)} defaultOpen={true} size="compact" className="bg-white">
      {options.length === 0 ? (
        <p className="text-sm text-slate-400">{t("filters.noOptionsAvailable")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {displayedOptions.map((option) => {
              const selected = selectedValues.has(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (selected) {
                      removeFilter(config.field, option.value, "any");
                    } else {
                      addFilter(config.field, option.value, "any");
                    }
                  }}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                      : "bg-slate-100 text-neutral-700 hover:bg-amber-50 hover:text-amber-600"
                  }`}
                  aria-pressed={selected}
                >
                  <span>{option.label}</span>
                  {typeof option.count === "number" ? (
                    <span className={selected ? "text-white/75" : "text-slate-400"}>{option.count}</span>
                  ) : null}
                  {selected ? <span className="text-base leading-none text-white/80">×</span> : null}
                </button>
              );
            })}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              {showAll ? t("filters.showLess") : t("filters.showMore", { count: options.length - DISPLAY_LIMIT })}
            </button>
          )}
        </div>
      )}
    </Accordion>
  );
}

export function ProductListingFiltersView({
  activeFilters,
  rawResponse,
  addFilter,
  removeFilter,
  setFilter,
}: {
  activeFilters: Filter[];
  rawResponse: unknown;
  addFilter: (name: string, value: string, type?: "any") => void;
  removeFilter: (name: string, value?: string, type?: "any") => void;
  setFilter: (name: string, value: FilterValueRange) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {RANGE_FILTERS.map((config) => (
        <ProductRangeFilter
          key={config.field}
          config={config}
          activeFilters={activeFilters}
          rawResponse={rawResponse}
          removeFilter={removeFilter}
          setFilter={setFilter}
        />
      ))}
      {OPTION_FILTERS.map((config) => (
        <ProductOptionFilter
          key={config.field}
          config={config}
          activeFilters={activeFilters}
          rawResponse={rawResponse}
          addFilter={addFilter}
          removeFilter={removeFilter}
        />
      ))}
    </div>
  );
}

export default function ProductListingFilters() {
  const { filters, rawResponse, addFilter, removeFilter, setFilter } = useSearch((state) => ({
    filters: state.filters,
    rawResponse: state.rawResponse,
    addFilter: state.addFilter,
    removeFilter: state.removeFilter,
    setFilter: state.setFilter,
  }));
  const activeFilters = filters ?? [];

  return (
    <ProductListingFiltersView
      activeFilters={activeFilters}
      rawResponse={rawResponse}
      addFilter={addFilter}
      removeFilter={removeFilter}
      setFilter={setFilter}
    />
  );
}
