import { describe, expect, it, vi } from "vitest";
import {
  categoryName,
  categoryRouteSlug,
  categorySlug,
  fetchCategoryGroups,
  findCategoryBySlug,
  type CategoryGroup,
} from "./tree";

const translatedCategory = {
  id: 1,
  name: "Etiketten",
  slug: "etiketten",
  translations: {
    nl: { name: "Etiketten", slug: "etiketten" },
    en: { name: "Labels", slug: "labels" },
  },
  parent_id: null,
  count: 12,
};

describe("category tree helpers", () => {
  it("uses translations for display while keeping stored fields as fallback", () => {
    expect(categoryName(translatedCategory, "en")).toBe("Labels");
    expect(categorySlug(translatedCategory, "en")).toBe("labels");
    expect(categoryRouteSlug(translatedCategory, "nl")).toBe("etiketten");
  });

  it("finds categories through translated or stored slugs", () => {
    const groups: CategoryGroup[] = [
      {
        id: 10,
        name: "Productcategorieen",
        slug: "productcategorieen",
        count: 12,
        categories: [translatedCategory],
      },
    ];

    expect(findCategoryBySlug(groups, "labels", "en")?.category.id).toBe(1);
    expect(findCategoryBySlug(groups, "etiketten", "nl")?.category.id).toBe(1);
  });

  it("fetches categories without a lang query or persistent cache", async () => {
    const originalBaseUrl = process.env.BBNL_API_BASE_URL;
    process.env.BBNL_API_BASE_URL = "https://example.test";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchCategoryGroups();

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/categories", {
      cache: "no-store",
    });

    vi.unstubAllGlobals();
    process.env.BBNL_API_BASE_URL = originalBaseUrl;
  });
});
