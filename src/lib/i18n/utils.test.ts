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
  });

  it("strips the English prefix before switching back to Dutch", () => {
    expect(stripLocalePath("/en/product")).toBe("/product");
    expect(stripLocalePath("/en")).toBe("/");
    expect(stripLocalePath("/product")).toBe("/product");
    expect(stripLocalePath("/en/software-2")).toBe("/software");
    expect(stripLocalePath("/en/knowledge-base")).toBe("/kennisbank-overzicht");
  });
});
