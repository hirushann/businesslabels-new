import { describe, expect, it, vi } from "vitest";
import {
  categoryName,
  categoryRouteSlug,
  categorySlug,
  fetchCategoryGroups,
  findCategoryBySlug,
  localizedProductCategoryPath,
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

  it("rebuilds a nested Dutch category URL with every English slug", () => {
    expect(
      localizedProductCategoryPath(
        nestedCategoryGroups,
        "/product-categorie/labelprinters/kleuren-labelprinters-nl/desktop-labelprinters-nl",
        "en",
      ),
    ).toBe(
      "/en/product-category/label-printers/color-labelprinters/desktop-label-printers",
    );
  });

  it("rebuilds a nested English category URL with every Dutch slug", () => {
    expect(
      localizedProductCategoryPath(
        nestedCategoryGroups,
        "/en/product-category/label-printers/color-labelprinters/desktop-label-printers",
        "nl",
      ),
    ).toBe(
      "/product-categorie/labelprinters/kleuren-labelprinters-nl/desktop-labelprinters-nl",
    );
  });

  it("only falls back to the stored slug for a category missing a translation", () => {
    const missingLeafTranslation = structuredClone(nestedCategoryGroups);
    missingLeafTranslation[0].categories[0].children![0].children![0].translations!.en!.slug = null;

    expect(
      localizedProductCategoryPath(
        missingLeafTranslation,
        "/product-categorie/labelprinters/kleuren-labelprinters-nl/desktop-labelprinters-nl",
        "en",
      ),
    ).toBe(
      "/en/product-category/label-printers/color-labelprinters/desktop-labelprinters-nl",
    );
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

const nestedCategoryGroups: CategoryGroup[] = [
  {
    id: 10,
    name: "Category",
    slug: "category",
    count: 3,
    categories: [
      {
        id: 46,
        name: "Labelprinters",
        slug: "labelprinters",
        translations: {
          nl: { name: "Labelprinters", slug: "labelprinters" },
          en: { name: "Label printers", slug: "label-printers" },
        },
        parent_id: null,
        count: 3,
        children: [
          {
            id: 56,
            name: "Kleuren labelprinters",
            slug: "kleuren-labelprinters-nl",
            translations: {
              nl: { name: "Kleuren labelprinters", slug: "kleuren-labelprinters-nl" },
              en: { name: "Color labelprinters", slug: "color-labelprinters" },
            },
            parent_id: 46,
            count: 3,
            children: [
              {
                id: 73,
                name: "Desktop Labelprinters",
                slug: "desktop-labelprinters-nl",
                translations: {
                  nl: { name: "Desktop Labelprinters", slug: "desktop-labelprinters-nl" },
                  en: { name: "Desktop Label printers", slug: "desktop-label-printers" },
                },
                parent_id: 56,
                count: 3,
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
];
