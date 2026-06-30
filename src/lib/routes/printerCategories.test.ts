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

  it("uses Dutch source slugs for printer category lookup", () => {
    expect(getPrinterCategoryLookupSlug("label-printers")).toBe("labelprinters");
    expect(getPrinterCategoryLookupSlug("color-labelprinters")).toBe("kleuren-labelprinters-nl");
    expect(getPrinterCategoryLookupSlug("thermal-labelprinters")).toBe("thermische-labelprinters-nl");
    expect(getPrinterCategoryLookupSlug("starterkits")).toBe("starterkits");
    expect(getPrinterCategoryLookupSlug("starterkits-2")).toBe("starterkits");
    expect(getPrinterCategoryLookupSlug("starter-kits")).toBe("starterkits");
    expect(getPrinterCategoryLookupSlug("consumables")).toBe("verbruiksmaterialen-nl");
  });

  it("uses Dutch slugs for Dutch printer category lookup", () => {
    expect(getPrinterCategoryLookupSlug("kleuren-labelprinters-nl")).toBe("kleuren-labelprinters-nl");
    expect(getPrinterCategoryLookupSlug("thermische-labelprinters-nl")).toBe("thermische-labelprinters-nl");
    expect(getPrinterCategoryLookupSlug("verbruiksmaterialen-nl")).toBe("verbruiksmaterialen-nl");
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
