import { afterEach, describe, expect, it, vi } from "vitest";
import {
  localizedCategoryArchivePath,
  resolveCategoryArchive,
} from "@/lib/categories/archives";

describe("resolveCategoryArchive", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BBNL_API_BASE_URL;
  });

  it("resolves the complete localized nested path", async () => {
    process.env.BBNL_API_BASE_URL = "https://api.example.test";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: {
        archive: {
          term_id: 42,
          locale: "en",
          name: "Beer labels",
          slug: "beer-labels",
          path: "labels/inkjet/beer-labels",
          canonical_url: "/en/product-category/labels/inkjet/beer-labels",
          children: [],
        },
        ancestors: [],
        redirect_to: null,
      },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveCategoryArchive("en", "labels/inkjet/beer-labels");

    expect(result?.archive.term_id).toBe(42);
    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.get("path")).toBe("labels/inkjet/beer-labels");
    expect(requestedUrl.searchParams.get("locale")).toBe("en");
  });

  it("returns null for a genuinely unknown archive path", async () => {
    process.env.BBNL_API_BASE_URL = "https://api.example.test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(resolveCategoryArchive("nl", "missing/archive")).resolves.toBeNull();
  });

  it("does not throw or guess a route for malformed encoded archive paths", async () => {
    process.env.BBNL_API_BASE_URL = "https://api.example.test";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(localizedCategoryArchivePath(
      "/product-categorie/labels/%E0%A4%A",
      "en",
    )).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the authoritative alternate path when translated parent slugs differ", async () => {
    process.env.BBNL_API_BASE_URL = "https://api.example.test";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: {
        archive: {
          term_id: 56,
          locale: "nl",
          name: "Kleuren labelprinters",
          slug: "kleuren-labelprinters-nl",
          path: "labelprinters/kleuren-labelprinters-nl",
          canonical_url: "/product-categorie/labelprinters/kleuren-labelprinters-nl",
          alternate_urls: {
            en: "/en/product-category/labelprinters/color-labelprinters",
          },
        },
        ancestors: [],
        redirect_to: null,
      },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(localizedCategoryArchivePath(
      "/product-categorie/labelprinters/kleuren-labelprinters-nl",
      "en",
    )).resolves.toBe(
      "/en/product-category/labelprinters/color-labelprinters",
    );

    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.get("locale")).toBe("nl");
    expect(requestedUrl.searchParams.get("path")).toBe(
      "labelprinters/kleuren-labelprinters-nl",
    );
  });

  it("returns null instead of guessing when an archive has no linked translation", async () => {
    process.env.BBNL_API_BASE_URL = "https://api.example.test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: {
        archive: {
          term_id: 57,
          locale: "nl",
          canonical_url: "/product-categorie/legacy",
          alternate_urls: {},
        },
        ancestors: [],
        redirect_to: null,
      },
    }), { status: 200 })));

    await expect(localizedCategoryArchivePath(
      "/product-categorie/legacy",
      "en",
    )).resolves.toBeNull();
  });
});
