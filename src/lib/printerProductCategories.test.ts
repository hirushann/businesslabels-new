import { describe, expect, it } from "vitest";
import { getAvailablePrinterProductCategories } from "@/lib/printerProductCategories";
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

describe("getAvailablePrinterProductCategories", () => {
  it("returns only ink and labels when ribbons are unavailable", () => {
    expect(
      getAvailablePrinterProductCategories(
        catalogWithCategorySlugs([
          "inkt-cartridges-nl",
          "maintenance-boxen-nl",
          "labels-en-tickets",
        ]),
      ),
    ).toEqual([
      { id: "ink", slug: "inkt-cartridges-nl" },
      { id: "labels", slug: "labels-en-tickets" },
    ]);
  });

  it("returns only ribbons and labels when ink is unavailable", () => {
    expect(
      getAvailablePrinterProductCategories(
        catalogWithCategorySlugs(["tt-printlinten-nl", "labels-en-tickets"]),
      ),
    ).toEqual([
      { id: "ribbons", slug: "tt-printlinten-nl" },
      { id: "labels", slug: "labels-en-tickets" },
    ]);
  });

  it("returns ink, ribbons, and labels when all are available", () => {
    expect(
      getAvailablePrinterProductCategories(
        catalogWithCategorySlugs([
          "inkt-cartridges-nl",
          "tt-printlinten-nl",
          "labels-en-tickets",
        ]),
      ),
    ).toEqual([
      { id: "ink", slug: "inkt-cartridges-nl" },
      { id: "ribbons", slug: "tt-printlinten-nl" },
      { id: "labels", slug: "labels-en-tickets" },
    ]);
  });

  it("returns no categories without a category facet", () => {
    expect(
      getAvailablePrinterProductCategories({
        filters: { ranges: [], options: [] },
      }),
    ).toEqual([]);
  });
});
