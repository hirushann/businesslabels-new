"use client";

import { useSearch } from "@elastic/react-search-ui";
import type { FilterValueRange } from "@elastic/search-ui";
import Accordion from "@/components/Accordion";
import RangeSlider from "@/components/RangeSlider";

const INITIAL_MIN = 0;
const INITIAL_MAX = 5000;

function isPriceRangeFilter(value: unknown): value is FilterValueRange {
  return typeof value === "object" && value !== null && "name" in value;
}

function numericValue(value: FilterValueRange["from"]): number | null {
  return typeof value === "number" ? value : null;
}

export default function PriceFilter() {
  const { filters, removeFilter, setFilter } = useSearch((state) => ({
    filters: state.filters,
    removeFilter: state.removeFilter,
    setFilter: state.setFilter,
  }));

  const activeFilters = filters ?? [];
  const priceFilter = activeFilters.find((filter) => filter.field === "price");
  const priceRange = priceFilter?.values.find(isPriceRangeFilter);

  const range: [number, number] = [
    numericValue(priceRange?.from) ?? INITIAL_MIN,
    numericValue(priceRange?.to) ?? INITIAL_MAX,
  ];

  const handleAfterChange = (newRange: [number, number]) => {
    if (newRange[0] === INITIAL_MIN && newRange[1] === INITIAL_MAX) {
      removeFilter("price");
    } else {
      setFilter("price", { name: "price", from: newRange[0], to: newRange[1] });
    }
  };

  return (
    <Accordion title="Price" defaultOpen={true}>
      <div className="pt-4">
        <RangeSlider
          min={INITIAL_MIN}
          max={INITIAL_MAX}
          value={range}
          onChange={() => {}}
          onAfterChange={handleAfterChange}
          formatValue={(v) => `€${v}`}
        />
      </div>
    </Accordion>
  );
}
