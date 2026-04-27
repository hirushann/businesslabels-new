"use client";

import { useSearch } from "@elastic/react-search-ui";
import type { FilterValueRange } from "@elastic/search-ui";
import Accordion from "@/components/Accordion";
import RangeSlider from "@/components/RangeSlider";

const INITIAL_MIN = 0;
const FALLBACK_MAX = 5000;

function isPriceRangeFilter(value: unknown): value is FilterValueRange {
  return typeof value === "object" && value !== null && "name" in value;
}

function numericValue(value: FilterValueRange["from"]): number | null {
  return typeof value === "number" ? value : null;
}

function rawMaxPrice(rawResponse: unknown): number | null {
  if (!rawResponse || typeof rawResponse !== "object") {
    return null;
  }

  const priceStats = (rawResponse as { priceStats?: { max?: unknown } }).priceStats;
  const maxPrice = priceStats?.max;
  return typeof maxPrice === "number" && Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : null;
}

function sliderMax(rawResponse: unknown): number {
  const maxPrice = rawMaxPrice(rawResponse);
  if (maxPrice === null) {
    return FALLBACK_MAX;
  }

  return Math.ceil(maxPrice);
}

export default function PriceFilter() {
  const { filters, rawResponse, removeFilter, setFilter } = useSearch((state) => ({
    filters: state.filters,
    rawResponse: state.rawResponse,
    removeFilter: state.removeFilter,
    setFilter: state.setFilter,
  }));

  const max = sliderMax(rawResponse);
  const activeFilters = filters ?? [];
  const priceFilter = activeFilters.find((filter) => filter.field === "price");
  const priceRange = priceFilter?.values.find(isPriceRangeFilter);

  const range: [number, number] = [
    numericValue(priceRange?.from) ?? INITIAL_MIN,
    Math.min(numericValue(priceRange?.to) ?? max, max),
  ];

  const handleAfterChange = (newRange: [number, number]) => {
    if (newRange[0] === INITIAL_MIN && newRange[1] === max) {
      removeFilter("price");
    } else {
      setFilter("price", { name: "price", from: newRange[0], to: newRange[1] });
    }
  };

  return (
    <Accordion title="Price" defaultOpen={true} size="compact">
      <RangeSlider
        min={INITIAL_MIN}
        max={max}
        value={range}
        onChange={() => { }}
        onAfterChange={handleAfterChange}
        formatValue={(v) => `€${v}`}
      />
    </Accordion>
  );
}
