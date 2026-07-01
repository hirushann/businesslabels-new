import type { ProductCardData } from "@/components/ProductCard";

export type PrinterCardData = ProductCardData & {
  properties?: Record<string, string[]>;
  featured?: boolean | string | number | null;
};

export type PrinterSortValue = "latest" | "oldest" | "title_asc" | "title_desc";

export const PRINTER_SORT_VALUES: PrinterSortValue[] = ["latest", "oldest", "title_asc", "title_desc"];

export type PrinterOptionFilterKey = "druktype" | "kern" | "detectie" | "width" | "buiten_diameter";

export type PrinterFilterOption = {
  value: string;
  label: string;
  count: number;
};

export type PrinterOptionFilter = {
  key: PrinterOptionFilterKey;
  title: string;
  options: PrinterFilterOption[];
};

export type PrinterFilters = {
  options: PrinterOptionFilter[];
};

export type PrinterSearchParams = {
  search: string;
  page: number;
  perPage: number;
  sort: PrinterSortValue;
  druktype: string[];
  kern: string[];
  detectie: string[];
  width: string[];
  buitenDiameter: string[];
  locale?: "en" | "nl";
};

export type PrinterSearchResponse = {
  printers: PrinterCardData[];
  total: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
  filters: PrinterFilters;
};
