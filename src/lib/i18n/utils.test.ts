import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, normalizeLocale } from "./config";
import { localePath, stripLocalePath } from "./utils";

describe("i18n routing utilities", () => {
  it("uses Dutch as the clean-path fallback locale", () => {
    expect(DEFAULT_LOCALE).toBe("nl");
    expect(normalizeLocale(undefined)).toBe("nl");
    expect(localePath("/product?focus=true", normalizeLocale(undefined))).toBe("/product?focus=true");
  });

  it("adds the English prefix only for English routes", () => {
    expect(localePath("/product?focus=true", "en")).toBe("/en/product?focus=true");
    expect(localePath("/product?focus=true", "nl")).toBe("/product?focus=true");
    expect(localePath("/software", "en")).toBe("/en/software-2");
    expect(localePath("/software", "nl")).toBe("/software");
    expect(localePath("/kennisbank-overzicht", "en")).toBe("/en/knowledge-base");
    expect(localePath("/kennisbank-overzicht", "nl")).toBe("/kennisbank-overzicht");
    expect(localePath("/brands", "en")).toBe("/en/brands");
    expect(localePath("/brands", "nl")).toBe("/merken");
    expect(localePath("/support", "en")).toBe("/en/support-2/");
    expect(localePath("/support", "nl")).toBe("/support");
    expect(localePath("/maatwerk", "en")).toBe("/en/material-customization");
    expect(localePath("/maatwerk", "nl")).toBe("/maatwerk");
    expect(localePath("/maatwerk?materialId=123", "en")).toBe("/en/material-customization?materialId=123");
    expect(localePath("/winkelmand", "en")).toBe("/en/cart");
    expect(localePath("/cart", "nl")).toBe("/winkelmand");
    expect(localePath("/winkelmand", "nl")).toBe("/winkelmand");
    expect(localePath("/winkel", "en")).toBe("/en/shop");
    expect(localePath("/shop", "nl")).toBe("/winkel");
    expect(localePath("/winkel", "nl")).toBe("/winkel");

    expect(localePath("/afrekenen", "nl")).toBe("/afrekenen");
    expect(localePath("/contact", "en")).toBe("/en/contact-us");
    expect(localePath("/contact", "nl")).toBe("/contact-us");
  });

  it("strips the English prefix before switching back to Dutch", () => {
    expect(stripLocalePath("/en/product")).toBe("/product");
    expect(stripLocalePath("/en")).toBe("/");
    expect(stripLocalePath("/product")).toBe("/product");
    expect(stripLocalePath("/en/software-2")).toBe("/software");
    expect(stripLocalePath("/en/knowledge-base")).toBe("/kennisbank-overzicht");
    expect(stripLocalePath("/merken")).toBe("/brands");
    expect(stripLocalePath("/en/brands")).toBe("/brands");
    expect(stripLocalePath("/en/support-2/")).toBe("/support");
    expect(stripLocalePath("/en/support-2")).toBe("/support");
    expect(stripLocalePath("/en/material-customization")).toBe("/maatwerk");
    expect(stripLocalePath("/en/material-customization?materialId=123")).toBe("/maatwerk?materialId=123");
    expect(stripLocalePath("/en/shop")).toBe("/winkel");
    expect(stripLocalePath("/winkel")).toBe("/shop");
    expect(stripLocalePath("/en/cart")).toBe("/winkelmand");
    expect(stripLocalePath("/winkelmand")).toBe("/cart");

    expect(stripLocalePath("/en/contact")).toBe("/contact-us");
    expect(stripLocalePath("/contact")).toBe("/contact-us");
  });
});
