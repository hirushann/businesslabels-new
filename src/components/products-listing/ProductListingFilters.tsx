"use client";

import { useSearch } from "@elastic/react-search-ui";
import type { Filter, FilterValueRange } from "@elastic/search-ui";
import Accordion from "@/components/Accordion";
import RangeSlider from "@/components/RangeSlider";
import type { DynamicOptionFilter, DynamicProductFilter, DynamicRangeFilter } from "@/lib/search/dynamicFilters";

const INITIAL_MIN = 0;
const FALLBACK_MAX_BY_FIELD: Record<RangeFilterField, number> = {
  price: 5000,
  meta_width_mm: 100,
  meta_height_mm: 100,
  meta_kern_mm: 100,
};

type RangeFilterField = "price" | "meta_width_mm" | "meta_height_mm" | "meta_kern_mm";

type RangeFilterConfig = {
  field: RangeFilterField;
  name: string;
  unitPrefix?: string;
  unitSuffix?: string;
};

type LegacyOptionResponseKey = "category" | "brand" | "materialCode" | "material" | "finishing" | "glue";

type LegacyRangeFilterConfig = RangeFilterConfig & {
  key: string;
  title: string;
};

type LegacyOptionFilterConfig = {
  key: string;
  title: string;
  field: string;
  responseKey: LegacyOptionResponseKey;
};

type FilterOption = {
  value: string;
  label: string;
  count: number;
};

const RANGE_FILTERS: LegacyRangeFilterConfig[] = [
  { key: "price", title: "Price Range", field: "price", name: "price", unitPrefix: "€" },
  { key: "width", title: "Label Width", field: "meta_width_mm", name: "width", unitSuffix: "mm" },
  { key: "height", title: "Label Height", field: "meta_height_mm", name: "height", unitSuffix: "mm" },
  { key: "kern", title: "Core Size", field: "meta_kern_mm", name: "kern", unitSuffix: "mm" },
];

const OPTION_FILTERS: LegacyOptionFilterConfig[] = [
  { key: "category", title: "Product Type", field: "search_category_slug", responseKey: "category" },
  { key: "brand", title: "Brand", field: "search_brand_slug", responseKey: "brand" },
  { key: "materialCode", title: "Material Code", field: "meta_material_code", responseKey: "materialCode" },
  { key: "material", title: "Material Type", field: "meta_material", responseKey: "material" },
  { key: "finishing", title: "Finishing", field: "meta_finishing", responseKey: "finishing" },
  { key: "glue", title: "Glue", field: "meta_glue", responseKey: "glue" },
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

function formatRangeValue(value: number, config: DynamicRangeFilter): string {
  return `${config.unitPrefix ?? ""}${value}${config.unitSuffix ? ` ${config.unitSuffix}` : ""}`;
}

function optionsFor(rawResponse: unknown, responseKey: LegacyOptionResponseKey): FilterOption[] {
  if (!rawResponse || typeof rawResponse !== "object") return [];

  const options = (rawResponse as {
    pillFilters?: Record<LegacyOptionResponseKey, { options?: unknown } | undefined>;
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
        count: typeof item.count === "number" ? item.count : 0,
      };
    })
    .filter((option): option is FilterOption => option !== null);
}

function isDynamicFilter(value: unknown): value is DynamicProductFilter {
  if (!value || typeof value !== "object") return false;

  const filter = value as Partial<DynamicProductFilter>;
  if (filter.type === "range") {
    const rangeFilter = filter as Partial<DynamicRangeFilter>;
    return (
      typeof rangeFilter.key === "string" &&
      typeof rangeFilter.field === "string" &&
      typeof rangeFilter.label === "string" &&
      typeof rangeFilter.name === "string" &&
      typeof rangeFilter.min === "number" &&
      Number.isFinite(rangeFilter.min) &&
      typeof rangeFilter.max === "number" &&
      Number.isFinite(rangeFilter.max) &&
      rangeFilter.max > rangeFilter.min
    );
  }

  if (filter.type === "option") {
    const optionFilter = filter as Partial<DynamicOptionFilter>;
    return (
      typeof optionFilter.key === "string" &&
      typeof optionFilter.field === "string" &&
      typeof optionFilter.label === "string" &&
      Array.isArray(optionFilter.options)
    );
  }

  return false;
}

function dynamicFiltersFor(rawResponse: unknown): DynamicProductFilter[] | null {
  if (!rawResponse || typeof rawResponse !== "object") return null;

  const filters = (rawResponse as { filters?: unknown }).filters;
  if (!Array.isArray(filters)) return null;

  return filters.filter(isDynamicFilter);
}

function legacyFiltersFor(rawResponse: unknown): DynamicProductFilter[] {
  return [
    ...RANGE_FILTERS.map(
      (config): DynamicRangeFilter => ({
        type: "range",
        key: config.key,
        field: config.field,
        label: config.title,
        name: config.name,
        min: INITIAL_MIN,
        max: sliderMax(rawResponse, config.field),
        unitPrefix: config.unitPrefix,
        unitSuffix: config.unitSuffix,
      }),
    ),
    ...OPTION_FILTERS.map(
      (config): DynamicOptionFilter => ({
        type: "option",
        key: config.key,
        field: config.field,
        label: config.title,
        options: optionsFor(rawResponse, config.responseKey),
      }),
    ),
  ];
}

function isSelectedValue(value: unknown): value is string {
  return typeof value === "string";
}

function ProductRangeFilter({
  config,
  activeFilters,
  removeFilter,
  setFilter,
}: {
  config: DynamicRangeFilter;
  activeFilters: Filter[];
  removeFilter: (name: string) => void;
  setFilter: (name: string, value: FilterValueRange) => void;
}) {
  const min = Math.floor(config.min);
  const max = Math.ceil(config.max);
  const filter = activeFilters.find((activeFilter) => activeFilter.field === config.field);
  const filterRange = filter?.values.find(isRangeFilter);
  const range: [number, number] = [
    Math.max(min, Math.min(numericValue(filterRange?.from) ?? min, max)),
    Math.min(numericValue(filterRange?.to) ?? max, max),
  ];

  const handleAfterChange = (newRange: [number, number]) => {
    if (newRange[0] === min && newRange[1] === max) {
      removeFilter(config.field);
      return;
    }

    setFilter(config.field, { name: config.name, from: newRange[0], to: newRange[1] });
  };

  return (
    <Accordion title={config.label} defaultOpen={true} size="compact" className="bg-white">
      <RangeSlider
        min={min}
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
  addFilter,
  removeFilter,
}: {
  config: DynamicOptionFilter;
  activeFilters: Filter[];
  addFilter: (name: string, value: string, type?: "any") => void;
  removeFilter: (name: string, value?: string, type?: "any") => void;
}) {
  const selectedValues = new Set(
    activeFilters
      .find((activeFilter) => activeFilter.field === config.field && activeFilter.type === "any")
      ?.values.filter(isSelectedValue) ?? [],
  );

  return (
    <Accordion title={config.label} defaultOpen={true} size="compact" className="bg-white">
      {config.options.length === 0 ? (
        <p className="text-sm text-slate-400">No options available</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {config.options.map((option) => {
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
  const filters = dynamicFiltersFor(rawResponse) ?? legacyFiltersFor(rawResponse);

  return (
    <div className="flex flex-col gap-3">
      {filters.map((config) =>
        config.type === "range" ? (
          <ProductRangeFilter
            key={`${config.type}-${config.key}-${config.field}`}
            config={config}
            activeFilters={activeFilters}
            removeFilter={removeFilter}
            setFilter={setFilter}
          />
        ) : (
          <ProductOptionFilter
            key={`${config.type}-${config.key}-${config.field}`}
            config={config}
            activeFilters={activeFilters}
            addFilter={addFilter}
            removeFilter={removeFilter}
          />
        ),
      )}
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
