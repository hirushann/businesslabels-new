import { describe, expect, it } from "vitest";
import {
  getLabelCategoryPath,
  getLabelVirtualGroupForSegments,
  getLocalizedLabelCategoryPathForPath,
} from "./labelCategories";

describe("getLabelCategoryPath", () => {
  it("builds live Dutch label category routes", () => {
    expect(getLabelCategoryPath("nl")).toBe("/product-categorie/labels-en-tickets");
    expect(getLabelCategoryPath("nl", "inkjet")).toBe(
      "/product-categorie/labels-en-tickets/inkjet-printer-media",
    );
    expect(getLabelCategoryPath("nl", "thermalDirect")).toBe(
      "/product-categorie/labels-en-tickets/thermal-direct",
    );
    expect(getLabelCategoryPath("nl", "thermalTransfer")).toBe(
      "/product-categorie/labels-en-tickets/thermal-transfer",
    );
    expect(getLabelCategoryPath("nl", "applications")).toBe(
      "/product-categorie/labels-en-tickets/toepassingen",
    );
    expect(getLabelCategoryPath("nl", "shippingLabels")).toBe(
      "/product-categorie/labels-en-tickets/thermal-direct/verzendetiketten",
    );
    expect(getLabelCategoryPath("nl", "visitorBadges")).toBe(
      "/product-categorie/labels-en-tickets/inkjet-printer-media/bezoekersbadges",
    );
    expect(getLabelCategoryPath("nl", "jewelryLabels")).toBe(
      "/product-categorie/labels-en-tickets/thermal-transfer/juweliersetiketten-thermische-overdracht-printer-media",
    );
  });

  it("builds live English label category routes", () => {
    expect(getLabelCategoryPath("en")).toBe("/en/product-category/labels-en-tickets-en");
    expect(getLabelCategoryPath("en", "inkjet")).toBe(
      "/en/product-category/labels-en-tickets-en/inkjet-printer-media",
    );
    expect(getLabelCategoryPath("en", "thermalDirect")).toBe(
      "/en/product-category/labels-en-tickets-en/thermal-direct-printer-media",
    );
    expect(getLabelCategoryPath("en", "thermalTransfer")).toBe(
      "/en/product-category/labels-en-tickets-en/thermal-transfer-printer-media",
    );
    expect(getLabelCategoryPath("en", "applications")).toBe(
      "/en/product-category/labels-en-tickets-en/applications",
    );
    expect(getLabelCategoryPath("en", "shippingLabels")).toBe(
      "/en/product-category/labels-en-tickets-en/thermal-direct-printer-media/shipping-labels",
    );
    expect(getLabelCategoryPath("en", "visitorBadges")).toBe(
      "/en/product-category/labels-en-tickets-en/inkjet-printer-media/visitors-badges",
    );
    expect(getLabelCategoryPath("en", "jewelryLabels")).toBe(
      "/en/product-category/jewellery-labels",
    );
  });

  it("translates between live and legacy label routes", () => {
    expect(
      getLocalizedLabelCategoryPathForPath(
        "/category/thermisch-directe-printer-media",
        "nl",
      ),
    ).toBe("/product-categorie/labels-en-tickets/thermal-direct");

    expect(
      getLocalizedLabelCategoryPathForPath(
        "/product-categorie/labels-en-tickets/thermal-transfer",
        "en",
      ),
    ).toBe("/en/product-category/labels-en-tickets-en/thermal-transfer-printer-media");

    expect(
      getLocalizedLabelCategoryPathForPath(
        "/product-categorie/labels-en-tickets/thermal-direct/verzendetiketten",
        "en",
      ),
    ).toBe("/en/product-category/labels-en-tickets-en/thermal-direct-printer-media/shipping-labels");

    expect(
      getLocalizedLabelCategoryPathForPath(
        "/product-categorie/labels-en-tickets/toepassingen",
        "en",
      ),
    ).toBe("/en/product-category/labels-en-tickets-en/applications");

    expect(
      getLocalizedLabelCategoryPathForPath(
        "/en/product-category/jewellery-labels",
        "nl",
      ),
    ).toBe("/product-categorie/labels-en-tickets/thermal-transfer/juweliersetiketten-thermische-overdracht-printer-media");
  });

  it("detects virtual label application route segments", () => {
    expect(
      getLabelVirtualGroupForSegments(
        ["labels-en-tickets", "toepassingen"],
        "nl",
      )?.childKeys,
    ).toEqual(["visitorBadges", "shippingLabels", "jewelryLabels"]);

    expect(
      getLabelVirtualGroupForSegments(
        ["labels-en-tickets-en", "applications"],
        "en",
      )?.childKeys,
    ).toEqual(["visitorBadges", "shippingLabels", "jewelryLabels"]);
  });
});
