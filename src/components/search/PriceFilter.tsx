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
};

type RangeFilterField = "price" | "meta_width_mm" | "meta_height_mm";

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
    };
  };

  const value =
    field === "price"
      ? stats.priceStats?.max
      : field === "meta_width_mm"
        ? stats.dimensionStats?.width?.max
        : stats.dimensionStats?.height?.max;

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

export default function PriceFilter() {
  const { filters, rawResponse, removeFilter, setFilter } = useSearch((state) => ({
    filters: state.filters,
    rawResponse: state.rawResponse,
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
    </div>
  );
}
