"use client";

import { useSearch } from "@elastic/react-search-ui";
import type { Filter, FilterValueRange } from "@elastic/search-ui";
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
  title: string;
  field: RangeFilterField;
  name: string;
  unitPrefix?: string;
  unitSuffix?: string;
};

const RANGE_FILTERS: RangeFilterConfig[] = [
  {
    title: "Price",
    field: "price",
    name: "price",
    unitPrefix: "€",
  },
  {
    title: "Width",
    field: "meta_width_mm",
    name: "width",
    unitSuffix: "mm",
  },
  {
    title: "Height",
    field: "meta_height_mm",
    name: "height",
    unitSuffix: "mm",
  },
];

const KERN_RANGE_FILTER: RangeFilterConfig = {
  title: "Kern",
  field: "meta_kern_mm",
  name: "kern",
  unitSuffix: "mm",
};

const MATERIAL_CODE_FIELD = "meta_material_code";
const MATERIAL_FIELD = "meta_material";
const FINISHING_FIELD = "meta_finishing";
const GLUE_FIELD = "meta_glue";

type PillOption = {
  value: string;
  label: string;
  count?: number;
};

type PillFilterConfig = {
  title: string;
  field: string;
  responseKey: "materialCode" | "material" | "finishing" | "glue";
};

const PILL_FILTERS: PillFilterConfig[] = [
  {
    title: "Material Code",
    field: MATERIAL_CODE_FIELD,
    responseKey: "materialCode",
  },
  {
    title: "Material",
    field: MATERIAL_FIELD,
    responseKey: "material",
  },
  {
    title: "Finishing",
    field: FINISHING_FIELD,
    responseKey: "finishing",
  },
  {
    title: "Glue",
    field: GLUE_FIELD,
    responseKey: "glue",
  },
];

function isPriceRangeFilter(value: unknown): value is FilterValueRange {
  return typeof value === "object" && value !== null && "name" in value;
}

function numericValue(value: FilterValueRange["from"]): number | null {
  return typeof value === "number" ? value : null;
}

function rawMaxValue(rawResponse: unknown, field: RangeFilterField): number | null {
  if (!rawResponse || typeof rawResponse !== "object") {
    return null;
  }

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
  const maxValue = rawMaxValue(rawResponse, field);
  if (maxValue === null) {
    return FALLBACK_MAX_BY_FIELD[field];
  }

  return Math.ceil(maxValue);
}

function formatRangeValue(value: number, config: RangeFilterConfig): string {
  return `${config.unitPrefix ?? ""}${value}${config.unitSuffix ? ` ${config.unitSuffix}` : ""}`;
}

function pillOptions(rawResponse: unknown, responseKey: PillFilterConfig["responseKey"]): PillOption[] {
  if (!rawResponse || typeof rawResponse !== "object") {
    return [];
  }

  const options = (rawResponse as {
    pillFilters?: {
      materialCode?: {
        options?: unknown;
      };
      material?: {
        options?: unknown;
      };
      finishing?: {
        options?: unknown;
      };
      glue?: {
        options?: unknown;
      };
    };
  }).pillFilters?.[responseKey]?.options;

  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option): PillOption | null => {
      if (!option || typeof option !== "object") {
        return null;
      }

      const item = option as { value?: unknown; label?: unknown; count?: unknown };
      if (typeof item.value !== "string" || item.value.trim() === "") {
        return null;
      }

      return {
        value: item.value,
        label: typeof item.label === "string" && item.label.trim() !== "" ? item.label : item.value,
        count: typeof item.count === "number" ? item.count : undefined,
      };
    })
    .filter((option) => option !== null);
}

function isSelectedValue(value: unknown): value is string {
  return typeof value === "string";
}

function RangeFilter({
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
  const max = sliderMax(rawResponse, config.field);
  const filter = activeFilters.find((activeFilter) => activeFilter.field === config.field);
  const filterRange = filter?.values.find(isPriceRangeFilter);
  const range: [number, number] = [
    Math.min(numericValue(filterRange?.from) ?? INITIAL_MIN, max),
    Math.min(numericValue(filterRange?.to) ?? max, max),
  ];

  const handleAfterChange = (newRange: [number, number]) => {
    if (newRange[0] === INITIAL_MIN && newRange[1] === max) {
      removeFilter(config.field);
    } else {
      setFilter(config.field, { name: config.name, from: newRange[0], to: newRange[1] });
    }
  };

  return (
    <Accordion title={config.title} defaultOpen={true} size="compact">
      <RangeSlider
        min={INITIAL_MIN}
        max={max}
        value={range}
        onChange={() => { }}
        onAfterChange={handleAfterChange}
        formatValue={(value) => formatRangeValue(value, config)}
        inputPrefix={config.unitPrefix}
      />
    </Accordion>
  );
}

function PillSelectFilter({
  config,
  activeFilters,
  rawResponse,
  addFilter,
  removeFilter,
}: {
  config: PillFilterConfig;
  activeFilters: Filter[];
  rawResponse: unknown;
  addFilter: (name: string, value: string, type?: "any") => void;
  removeFilter: (name: string, value?: string, type?: "any") => void;
}) {
  const options = pillOptions(rawResponse, config.responseKey);
  const selectedValues = new Set(
    activeFilters
      .find((activeFilter) => activeFilter.field === config.field && activeFilter.type === "any")
      ?.values.filter(isSelectedValue) ?? [],
  );

  return (
    <Accordion title={config.title} defaultOpen={true} size="compact">
      {options.length === 0 ? (
        <p className="text-sm text-slate-400">No options available</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
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

export default function SearchFilters() {
  const { filters, rawResponse, addFilter, removeFilter, setFilter } = useSearch((state) => ({
    filters: state.filters,
    rawResponse: state.rawResponse,
    addFilter: state.addFilter,
    removeFilter: state.removeFilter,
    setFilter: state.setFilter,
  }));

  const activeFilters = filters ?? [];

  return (
    <div className="flex flex-col gap-3">
      {RANGE_FILTERS.map((config) => (
        <RangeFilter
          key={config.field}
          config={config}
          activeFilters={activeFilters}
          rawResponse={rawResponse}
          removeFilter={removeFilter}
          setFilter={setFilter}
        />
      ))}
      {PILL_FILTERS.map((config) => (
        <PillSelectFilter
          key={config.field}
          config={config}
          activeFilters={activeFilters}
          rawResponse={rawResponse}
          addFilter={addFilter}
          removeFilter={removeFilter}
        />
      ))}
      <RangeFilter
        config={KERN_RANGE_FILTER}
        activeFilters={activeFilters}
        rawResponse={rawResponse}
        removeFilter={removeFilter}
        setFilter={setFilter}
      />
    </div>
  );
}
