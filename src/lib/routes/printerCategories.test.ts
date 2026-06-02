import { describe, expect, it } from "vitest";
import {
  getLocalizedPrinterCategoryPathForPath,
  getPrinterCategoryLookupSlug,
  getPrinterCategoryPath,
} from "./printerCategories";

describe("getPrinterCategoryPath", () => {
  it("builds live English printer category routes without double slashes", () => {
    expect(getPrinterCategoryPath("en")).toBe("/en/product-category/labelprinters");
    expect(getPrinterCategoryPath("en", "color")).toBe(
      "/en/product-category/labelprinters/color-labelprinters",
    );
    expect(getPrinterCategoryPath("en", "thermal")).toBe(
      "/en/product-category/labelprinters/thermal-labelprinters",
    );
    expect(getPrinterCategoryPath("en", "starterkits")).toBe(
      "/en/product-category/labelprinters/starterkits-2",
    );
    expect(getPrinterCategoryPath("en", "consumables")).toBe(
      "/en/product-category/labelprinters/consumables",
    );
  });

  it("builds live Dutch printer category routes without a locale prefix", () => {
    expect(getPrinterCategoryPath("nl")).toBe("/product-categorie/labelprinters");
    expect(getPrinterCategoryPath("nl", "color")).toBe(
      "/product-categorie/labelprinters/kleuren-labelprinters-nl",
    );
    expect(getPrinterCategoryPath("nl", "thermal")).toBe(
      "/product-categorie/labelprinters/thermische-labelprinters-nl",
    );
    expect(getPrinterCategoryPath("nl", "starterkits")).toBe(
      "/product-categorie/labelprinters/starterkits",
    );
    expect(getPrinterCategoryPath("nl", "consumables")).toBe(
      "/product-categorie/labelprinters/verbruiksmaterialen-nl",
    );
  });

  it("uses English slugs for printer category lookup", () => {
    expect(getPrinterCategoryLookupSlug("color-labelprinters", "en")).toBe("color-labelprinters");
    expect(getPrinterCategoryLookupSlug("thermal-labelprinters", "en")).toBe("thermal-labelprinters");
    expect(getPrinterCategoryLookupSlug("starterkits", "en")).toBe("starterkits-2");
    expect(getPrinterCategoryLookupSlug("starterkits-2", "en")).toBe("starterkits-2");
    expect(getPrinterCategoryLookupSlug("consumables", "en")).toBe("consumables");
  });

  it("uses Dutch slugs for Dutch printer category lookup", () => {
    expect(getPrinterCategoryLookupSlug("kleuren-labelprinters-nl", "nl")).toBe("kleuren-labelprinters-nl");
    expect(getPrinterCategoryLookupSlug("thermische-labelprinters-nl", "nl")).toBe("thermische-labelprinters-nl");
    expect(getPrinterCategoryLookupSlug("verbruiksmaterialen-nl", "nl")).toBe("verbruiksmaterialen-nl");
  });

  it("translates live printer category paths when switching languages", () => {
    expect(
      getLocalizedPrinterCategoryPathForPath(
        "/en/product-category/labelprinters/color-labelprinters",
        "nl",
      ),
    ).toBe("/product-categorie/labelprinters/kleuren-labelprinters-nl");

    expect(
      getLocalizedPrinterCategoryPathForPath(
        "/product-categorie/labelprinters/thermische-labelprinters-nl",
        "en",
      ),
    ).toBe("/en/product-category/labelprinters/thermal-labelprinters");
  });
});
