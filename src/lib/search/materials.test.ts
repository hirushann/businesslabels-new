import { describe, expect, it } from "vitest";

import { printMethodFilterValues } from "./materials";

describe("material print method filters", () => {
  it("matches category/taxon slugs for inkjet materials", () => {
    expect(printMethodFilterValues("inkjet")).toEqual(
      expect.arrayContaining([
        "inkjet",
        "inkjet-printer-media",
        "inkjetpapier-labels",
        "kunststof-inkjet-labels",
      ]),
    );
  });

  it("matches category/taxon slugs for thermal transfer materials", () => {
    expect(printMethodFilterValues("thermal-transfer")).toEqual(
      expect.arrayContaining([
        "thermal-transfer",
        "thermal-transfer-printer-media",
        "thermische-overdracht-printer-media",
        "papieren-labels-tt",
        "kunststof-labels-tt",
      ]),
    );
  });

  it("matches category/taxon slugs for thermal direct materials", () => {
    expect(printMethodFilterValues("thermal-direct")).toEqual(
      expect.arrayContaining([
        "td",
        "thermal-direct",
        "thermal-direct-printer-media",
        "thermisch-directe-printer-media",
        "papieren-labels-td",
        "kunststof-labels-td",
      ]),
    );
  });
});
