import { describe, expect, it } from "vitest";
import {
  getAccessoryCategoryPath,
  getAccessoryVirtualGroupForSegments,
  getLocalizedAccessoryCategoryPathForPath,
} from "./accessoryCategories";

describe("getAccessoryCategoryPath", () => {
  it("builds live Dutch accessory category routes", () => {
    expect(getAccessoryCategoryPath("nl")).toBe("/product-categorie/labelprinters/accessoires");
    expect(getAccessoryCategoryPath("nl", "reUnwinders")).toBe(
      "/product-categorie/labelprinters/accessoires/re-unwinders-nl",
    );
    expect(getAccessoryCategoryPath("nl", "applicators")).toBe(
      "/product-categorie/labelprinters/accessoires/applicatoren",
    );
    expect(getAccessoryCategoryPath("nl", "applicatorsDispensers")).toBe(
      "/product-categorie/labelprinters/accessoires/applicatoren-en-dispensers",
    );
    expect(getAccessoryCategoryPath("nl", "dispensers")).toBe(
      "/product-categorie/labelprinters/accessoires/dispenser-nl",
    );
    expect(getAccessoryCategoryPath("nl", "printerAddOns")).toBe(
      "/product-categorie/labelprinters/accessoires/printer-add-ons",
    );
    expect(getAccessoryCategoryPath("nl", "cables")).toBe(
      "/product-categorie/labelprinters/accessoires/diversen/kabels",
    );
  });

  it("builds live English accessory category routes", () => {
    expect(getAccessoryCategoryPath("en")).toBe("/en/product-category/labelprinters/accessories-1");
    expect(getAccessoryCategoryPath("en", "reUnwinders")).toBe(
      "/en/product-category/labelprinters/accessories-1/re-unwinders",
    );
    expect(getAccessoryCategoryPath("en", "applicators")).toBe(
      "/en/product-category/labelprinters/accessories-1/applicators",
    );
    expect(getAccessoryCategoryPath("en", "applicatorsDispensers")).toBe(
      "/en/product-category/labelprinters/accessories-1/applicators-and-dispensers",
    );
    expect(getAccessoryCategoryPath("en", "dispensers")).toBe(
      "/en/product-category/labelprinters/accessories-1/dispenser",
    );
    expect(getAccessoryCategoryPath("en", "printerAddOns")).toBe(
      "/en/product-category/labelprinters/accessories-1/printer-add-ons",
    );
    expect(getAccessoryCategoryPath("en", "cables")).toBe(
      "/en/product-category/labelprinters/accessories-1/miscellaneous/cables",
    );
  });

  it("translates live and legacy accessory routes", () => {
    expect(
      getLocalizedAccessoryCategoryPathForPath(
        "/product-categorie/labelprinters/accessoires/diversen/onderhoud",
        "en",
      ),
    ).toBe("/en/product-category/labelprinters/accessories-1/miscellaneous/maintenance");

    expect(
      getLocalizedAccessoryCategoryPathForPath(
        "/en/product-category/labelprinters/accessories-1/cw-c4000-accessories",
        "nl",
      ),
    ).toBe("/product-categorie/labelprinters/accessoires/cw-c4000-accessoires");

    expect(getLocalizedAccessoryCategoryPathForPath("/category/re-unwinders-nl", "nl")).toBe(
      "/product-categorie/labelprinters/accessoires/re-unwinders-nl",
    );
  });

  it("detects virtual accessory group route segments", () => {
    expect(
      getAccessoryVirtualGroupForSegments(
        ["labelprinters", "accessoires", "applicatoren-en-dispensers"],
        "nl",
      )?.childKeys,
    ).toEqual(["applicators", "dispensers"]);

    expect(
      getAccessoryVirtualGroupForSegments(
        ["labelprinters", "accessories-1", "printer-add-ons"],
        "en",
      )?.childKeys,
    ).toEqual(["cutters", "wifiBluetooth", "cwC4000"]);
  });
});
