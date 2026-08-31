import { describe, expect, it } from "vitest";
import { mapLaravelProductToCardData, type LaravelProduct } from "./product";

describe("mapLaravelProductToCardData", () => {
  it("prefers locale title and slug translations over default product fields", () => {
    const product: LaravelProduct = {
      id: 1,
      sku: "GRP-X-001",
      title: "Test NL Product",
      slug: "test-group-1",
      type: "group",
      translations: [
        {
          nl: {
            title: "Test NL Product",
            slug: "test-group-1",
          },
        },
        {
          en: {
            title: "Test English Group",
            slug: "test-group-1",
          },
        },
      ],
    };

    expect(mapLaravelProductToCardData(product, "en")).toMatchObject({
      name: "Test English Group",
      slug: "test-group-1",
      type: "group_product",
    });

    expect(mapLaravelProductToCardData(product, "nl")).toMatchObject({
      name: "Test NL Product",
      slug: "test-group-1",
      type: "group_product",
    });
  });

  it("uses translated title before translated name for card display", () => {
    const product: LaravelProduct = {
      id: 2,
      sku: "P-X-001",
      title: "Default Dutch Title",
      name: "Default Dutch Name",
      slug: "default-dutch-slug",
      type: "simple",
      translations: [
        {
          en: {
            name: "Stale Dutch Name",
            title: "Fresh English Title",
            slug: "fresh-english-slug",
          },
        },
      ],
    };

    expect(mapLaravelProductToCardData(product, "en")).toMatchObject({
      name: "Fresh English Title",
      slug: "fresh-english-slug",
      type: "simple",
    });
  });

  it("keeps localized category names for product card badges", () => {
    const product: LaravelProduct = {
      id: 3,
      sku: "P-X-002",
      title: "CW-D6000 series Inktcartridges Magenta",
      slug: "cw-d6000-inktcartridges-magenta",
      type: "simple",
      categories: [
        {
          id: 10,
          name: "Inkt cartridges – CW-D6000 series",
          slug: "inkt-cartridges-cw-d6000",
          name_en: "Ink cartridges – CW-D6000 series",
          name_nl: "Inkt cartridges – CW-D6000 series",
        },
      ],
    };

    expect(mapLaravelProductToCardData(product, "en").categories?.[0]).toMatchObject({
      name_en: "Ink cartridges – CW-D6000 series",
      name_nl: "Inkt cartridges – CW-D6000 series",
    });
  });

  it("keeps stock delivery fields used by card availability badges", () => {
    const product: LaravelProduct = {
      id: 4,
      sku: "EOL-001",
      stock: 0,
      delivery_dates_in_stock: null,
      delivery_dates_no_stock: 100,
    };

    expect(mapLaravelProductToCardData(product)).toMatchObject({
      stock: 0,
      delivery_dates_in_stock: null,
      delivery_dates_no_stock: 100,
    });
  });
});
