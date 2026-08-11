import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/server", () => ({ getServerLocale: async () => "en" }));

import { elasticIndex } from "./route";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("global search index routing", () => {
  it("uses only the active simple and variable aliases by default", () => {
    delete process.env.SEARCH_INDEX;
    delete process.env.ELASTICSEARCH_INDEX;
    process.env.SCOUT_PREFIX = "business_labels_";

    expect(elasticIndex().split(",")).toEqual([
      "business_labels_catalog_products_simple",
      "business_labels_catalog_products_variable",
    ]);
    expect(elasticIndex()).not.toContain("*");
  });
});
