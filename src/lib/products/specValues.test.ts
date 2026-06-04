import { describe, expect, it } from "vitest";
import { localizeProductSpecValue } from "./specValues";

describe("localizeProductSpecValue", () => {
  it("translates material values by locale", () => {
    expect(localizeProductSpecValue("materiaal", "Papier", "en")).toBe("Paper");
    expect(localizeProductSpecValue("material", "Paper", "nl")).toBe("Papier");
  });

  it("leaves non-material values unchanged", () => {
    expect(localizeProductSpecValue("afwerking", "MAT", "en")).toBe("MAT");
  });
});
