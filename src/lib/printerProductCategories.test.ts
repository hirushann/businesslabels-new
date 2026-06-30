import { describe, expect, it } from "vitest";
import { getAvailablePrinterProductCategoryIds } from "@/lib/printerProductCategories";
import type { CatalogSearchResponse } from "@/lib/search/types";

function catalogWithCategorySlugs(slugs: string[]): CatalogSearchResponse {
  return {
    products: [],
    total: 0,
    currentPage: 1,
    lastPage: 1,
    perPage: 24,
    filters: {
      ranges: [],
      options: [
        {
          key: "category",
          title: "Product Type",
          options: slugs.map((slug) => ({
            value: slug,
            label: slug,
            count: 1,
          })),
        },
      ],
    },
  };
}

describe("getAvailablePrinterProductCategoryIds", () => {
  it("returns only ink and labels when ribbons are unavailable", () => {
    expect(
      getAvailablePrinterProductCategoryIds(
        catalogWithCategorySlugs([
          "inkt-cartridges-nl",
          "maintenance-boxen-nl",
          "labels-en-tickets",
        ]),
      ),
    ).toEqual(["ink", "labels"]);
  });

  it("returns only ribbons and labels when ink is unavailable", () => {
    expect(
      getAvailablePrinterProductCategoryIds(
        catalogWithCategorySlugs(["tt-printlinten-nl", "labels-en-tickets"]),
      ),
    ).toEqual(["ribbons", "labels"]);
  });

  it("returns no categories without a category facet", () => {
    expect(
      getAvailablePrinterProductCategoryIds({
        filters: { ranges: [], options: [] },
      }),
    ).toEqual([]);
  });
});
