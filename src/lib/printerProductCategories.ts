import type { CatalogSearchResponse } from "@/lib/search/types";

export type PrinterProductCategoryId = "ink" | "ribbons" | "labels";

const CATEGORY_ORDER: PrinterProductCategoryId[] = ["ink", "ribbons", "labels"];

const CATEGORY_SLUGS: Record<PrinterProductCategoryId, string[]> = {
  ink: ["inkt-cartridges-nl", "maintenance-boxen-nl"],
  ribbons: ["tt-printlinten-nl"],
  labels: ["labels-en-tickets", "labels-en-tickets-en"],
};

export function getAvailablePrinterProductCategoryIds(
  catalog: Pick<CatalogSearchResponse, "filters"> | null | undefined,
): PrinterProductCategoryId[] {
  const categoryFilter = catalog?.filters.options.find(
    (filter) => filter.key === "category",
  );

  if (!categoryFilter) return [];

  const availableSlugs = new Set(
    categoryFilter.options.map((option) => option.value.toLowerCase()),
  );

  return CATEGORY_ORDER.filter((categoryId) =>
    CATEGORY_SLUGS[categoryId].some((slug) => availableSlugs.has(slug)),
  );
}
