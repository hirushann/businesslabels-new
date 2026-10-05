import { describe, expect, it } from "vitest";
import { MESSAGES_V4 } from "@/lib/i18n/messages";
import {
  formatQuantityDisplay,
  getProductDisplaySubtitle,
  getProductDisplayTitle,
  getProductUnitType,
  getQuantityDisplay,
  type DisplayLocale,
  type DisplayTranslator,
} from "./productDisplay";

function translator(locale: DisplayLocale): DisplayTranslator {
  return (key, values = {}) => {
    const message = key
      .split(".")
      .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], MESSAGES_V4[locale]);
    if (typeof message !== "string") throw new Error(`Missing message: ${key}`);
    return message.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
  };
}

const en = translator("en");
const nl = translator("nl");

describe("formatQuantityDisplay", () => {
  it("shows quantity per unit when quantity > 1", () => {
    expect(formatQuantityDisplay({ quantity: 650, heightMm: 51, unitType: "roll" }, "en", en)).toBe("650 per roll");
    expect(formatQuantityDisplay({ quantity: 500, heightMm: 51, unitType: "stack" }, "nl", nl)).toBe("500 per stapel");
  });

  it("shows meters when quantity is exactly 1", () => {
    expect(formatQuantityDisplay({ quantity: 1, heightMm: 29000, unitType: "roll" }, "en", en)).toBe("29 meter per roll");
    expect(formatQuantityDisplay({ quantity: 1, heightMm: 29000, unitType: "roll" }, "nl", nl)).toBe("29 meter per rol");
  });

  it("formats non-integer meters with locale decimals", () => {
    expect(formatQuantityDisplay({ quantity: 1, heightMm: 12500, unitType: "roll" }, "en", en)).toBe("12.5 meter per roll");
    expect(formatQuantityDisplay({ quantity: 1, heightMm: 12500, unitType: "roll" }, "nl", nl)).toBe("12,5 meter per rol");
  });

  it("formats large quantities with locale grouping", () => {
    expect(formatQuantityDisplay({ quantity: 1000, heightMm: null, unitType: "roll" }, "en", en)).toBe("1,000 per roll");
    expect(formatQuantityDisplay({ quantity: 1000, heightMm: null, unitType: "roll" }, "nl", nl)).toBe("1.000 per rol");
  });

  it("returns null when data is missing", () => {
    expect(formatQuantityDisplay({ quantity: null, heightMm: 51, unitType: "roll" }, "en", en)).toBeNull();
    expect(formatQuantityDisplay({ quantity: 1, heightMm: null, unitType: "roll" }, "en", en)).toBeNull();
  });
});

describe("getProductUnitType", () => {
  it("prefers an explicit unit_type", () => {
    expect(getProductUnitType({ unit_type: "stack", properties: { kern: "76" } })).toBe("stack");
  });

  it("treats fan-fold cores as stacks", () => {
    expect(getProductUnitType({ properties: { kern: ["Fan-fold"] } })).toBe("stack");
    expect(getProductUnitType({ properties: { kern: { value: "fan-fold" } } })).toBe("stack");
  });

  it("defaults to roll", () => {
    expect(getProductUnitType({ properties: { kern: "76" } })).toBe("roll");
    expect(getProductUnitType({})).toBe("roll");
  });
});

describe("getQuantityDisplay", () => {
  it("reads quantity, height and unit from product data", () => {
    const product = { labels_per_roll: "1", properties: { hoogte: ["29000 mm"], kern: "76" } };
    expect(getQuantityDisplay(product, "en", en)).toBe("29 meter per roll");
  });

  it("reads nested Elasticsearch properties arrays", () => {
    const product = { labels_per_roll: 500, properties: [{ hoogte: "51" }, { kern: "fan-fold" }] };
    expect(getQuantityDisplay(product, "nl", nl)).toBe("500 per stapel");
  });
});

describe("getProductDisplayTitle", () => {
  it("builds the title from material code, dimensions and quantity", () => {
    const product = {
      labels_per_roll: 450,
      properties: { material_code: "DIA055", breedte: "76", hoogte: "51 mm", kern: "76" },
    };
    expect(getProductDisplayTitle(product, "en", en)).toEqual({
      main: "DIA055, 76 x 51 mm",
      quantity: "450 per roll",
    });
  });

  it("returns null without material code or dimensions", () => {
    expect(getProductDisplayTitle({ properties: { breedte: "76", hoogte: "51" } }, "en", en)).toBeNull();
    expect(getProductDisplayTitle({ properties: { material_code: "DIA055", breedte: "76" } }, "en", en)).toBeNull();
  });
});

describe("getProductDisplaySubtitle", () => {
  it("uses simplified material and finish from the material code mapping", () => {
    const product = {
      properties: { printmethode: "Inkjet", material_code: "DIA055", materiaal: "Papier", afwerking: "MAT", lijm: "Permanent" },
    };
    expect(getProductDisplaySubtitle(product, "en", en)).toBe("Inkjet, Paper, Matte, Permanent");
    expect(getProductDisplaySubtitle(product, "nl", nl)).toBe("Inkjet, Papier, Mat, Permanent");
  });

  it("simplifies deep finish values without a known material code", () => {
    const product = { properties: { printmethode: "TT", materiaal: "Kunststof", afwerking: "Glanzend zilver", lijm: "Permanent" } };
    expect(getProductDisplaySubtitle(product, "en", en)).toBe("TT, Plastic, Glossy, Permanent");
  });

  it("allows overriding the finish part with an exact specification value", () => {
    const product = { properties: { printmethode: "Inkjet", materiaal: "Kunststof", afwerking: "Glanzend", lijm: "Permanent" } };
    expect(getProductDisplaySubtitle(product, "nl", nl, "Glanzend Zilver")).toBe("Inkjet, Kunststof, Glanzend Zilver, Permanent");
  });

  it("keeps unknown values as-is and skips missing parts", () => {
    expect(getProductDisplaySubtitle({ properties: { printmethode: "Inkjet", materiaal: "Onbekend" } }, "en", en)).toBe("Inkjet, Onbekend");
    expect(getProductDisplaySubtitle({}, "en", en)).toBeNull();
  });
});
