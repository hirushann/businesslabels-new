import type { LinkProps } from "next/link";
import type { ProductCardData } from "@/components/ProductCard";

export const CATALOG_SORT_VALUES = [
  "relevance",
  "latest",
  "oldest",
  "title_asc",
  "title_desc",
  "price_asc",
  "price_desc",
] as const;

export type CatalogSortValue = (typeof CATALOG_SORT_VALUES)[number];
export type CatalogProductType = "simple" | "variable";

export type CatalogRangeKey =
  | "price"
  | "width"
  | "height"
  | "core"
  | "outer_diameter";

export type CatalogOptionFilterKey =
  | "category"
  | "brand"
  | "material_code"
  | "material"
  | "finishing"
  | "glue"
  | "print_method"
  | "printer_type"
  | "detectie"
  | "merken";

export type CatalogFilterOption = {
  value: string;
  label: string;
  count: number;
};

export type CatalogRangeFilter = {
  key: CatalogRangeKey;
  title: string;
  min: number;
  max: number;
  unitPrefix?: string;
  unitSuffix?: string;
};

export type CatalogOptionFilter = {
  key: CatalogOptionFilterKey;
  title: string;
  options: CatalogFilterOption[];
};

export type CatalogFilters = {
  ranges: CatalogRangeFilter[];
  options: CatalogOptionFilter[];
};

export type CatalogSearchParams = {
  search: string;
  type?: CatalogProductType;
  page: number;
  perPage: number;
  sort: CatalogSortValue;
  priceMin?: number;
  priceMax?: number;
  widthMin?: number;
  widthMax?: number;
  heightMin?: number;
  heightMax?: number;
  coreMin?: number;
  coreMax?: number;
  outerDiameterMin?: number;
  outerDiameterMax?: number;
  inStock?: boolean;
  ids: number[];
  slugs: string[];
  skus: string[];
  articleNumbers: string[];
  categories: string[];
  categoryIds: number[];
  brands: string[];
  materialIds: number[];
  materialCategories: string[];
  materialCategoryIds: number[];
  materialCodes: string[];
  materials: string[];
  finishings: string[];
  glues: string[];
  printMethods: string[];
  printerTypes: string[];
  detections: string[];
  marks: string[];
};

export type CatalogProductResult = {
  id: string;
  product: ProductCardData;
  href?: LinkProps["href"];
};

export type CatalogSearchResponse = {
  products: CatalogProductResult[];
  total: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
  filters: CatalogFilters;
};
