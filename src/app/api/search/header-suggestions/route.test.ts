import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const searchCatalogProducts = vi.fn();
const searchMaterials = vi.fn();

vi.mock("@/lib/search/products", () => ({
  parseCatalogSearchParams: (params: URLSearchParams) => Object.fromEntries(params),
  searchCatalogProducts: (...args: unknown[]) => searchCatalogProducts(...args),
}));
vi.mock("@/lib/search/materials", () => ({
  parseMaterialSearchParams: (params: URLSearchParams) => Object.fromEntries(params),
  searchMaterials: (...args: unknown[]) => searchMaterials(...args),
}));
vi.mock("@/lib/categories/tree", () => ({
  fetchCategoryGroups: async () => [],
  categoryCanonicalUrlsById: () => ({}),
}));

import { GET } from "./route";

function product(id: string, name: string, sku: string, categorySlugs: string[][]) {
  return {
    id,
    href: `/product/${id}`,
    product: {
      name,
      sku,
      article_number: sku,
      type: "simple",
      categories: categorySlugs.map((slug) => ({ slug, name: slug })),
    },
  };
}

async function suggestions(query: string) {
  const request = new NextRequest(`http://localhost/api/search/header-suggestions?search=${encodeURIComponent(query)}&locale=nl`);
  const response = await GET(request);
  return response.json();
}

describe("header search suggestions grouping", () => {
  beforeEach(() => {
    searchMaterials.mockResolvedValue({ materials: [], total: 0 });
  });

  it("lists ink pouches that only belong to consumables categories", async () => {
    searchCatalogProducts.mockResolvedValue({
      total: 2,
      products: [
        product("1", "Inkt pouche Geel - ColorWorks C8000", "C13T55P440", [
          ["verbruiksmaterialen-nl", "consumables"],
          ["inkt-cartridges-nl", "ink-cartridges"],
        ]),
        product("2", "CW-C4000 inkt cartridge Geel", "C13T52M440", [
          ["labelprinters", "label-printers"],
          ["verbruiksmaterialen-nl", "consumables"],
        ]),
      ],
    });

    const data = await suggestions("Inkt pouche Geel");
    const consumables = data.productGroups.find((group: { id: string }) => group.id === "consumables");

    expect(data.productGroups.map((group: { id: string }) => group.id)).toEqual(["consumables"]);
    expect(consumables.items.map((item: { title: string }) => item.title)).toEqual([
      "Inkt pouche Geel - ColorWorks C8000",
      "CW-C4000 inkt cartridge Geel",
    ]);
    expect(consumables.href).toContain("search=Inkt+pouche+Geel");
  });

  it("keeps products without a known category group under other products", async () => {
    searchCatalogProducts.mockResolvedValue({
      total: 2,
      products: [
        product("1", "ColorWorks C8000e BK", "C31CL02102BK", [["labelprinters", "label-printers"]]),
        product("2", "Mystery item", "X-1", [["something-else"]]),
      ],
    });

    const data = await suggestions("C8000");

    expect(data.productGroups.map((group: { id: string }) => group.id)).toEqual(["printers", "other"]);
    expect(data.productGroups[1].items[0].title).toBe("Mystery item");
    expect(data.productGroups[1].href).toBe("/product?search=C8000");
  });
});
