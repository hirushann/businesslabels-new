import { afterEach, describe, expect, it, vi } from "vitest";
import {
  archiveChildrenForNavigation,
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

  it("shows only translated, non-empty children in parent navigation", () => {
    const visibleChildren = archiveChildrenForNavigation({
      term_id: 1,
      external_id: 100,
      identity_id: 10,
      parent_term_id: null,
      locale: "nl",
      name: "Labelprinters",
      slug: "labelprinters",
      path: "labelprinters",
      description: null,
      meta_title: null,
      meta_description: null,
      canonical_url: "/product-categorie/labelprinters",
      alternate_urls: {},
      direct_count: 1,
      count: 1,
      upstream_count: 1,
      is_linked_translation: true,
      children: [
        {
          term_id: 2,
          external_id: 101,
          identity_id: 11,
          parent_term_id: 1,
          locale: "nl",
          name: "Accessoires",
          slug: "accessoires",
          path: "labelprinters/accessoires",
          description: null,
          meta_title: null,
          meta_description: null,
          canonical_url: "/product-categorie/labelprinters/accessoires",
          alternate_urls: {
            en: "/en/product-category/labelprinters/accessories-1",
          },
          direct_count: 1,
          count: 1,
          upstream_count: 1,
          is_linked_translation: true,
        },
        {
          term_id: 3,
          external_id: 102,
          identity_id: 12,
          parent_term_id: 1,
          locale: "nl",
          name: "Legacy accessories",
          slug: "legacy-accessories",
          path: "labelprinters/legacy-accessories",
          description: null,
          meta_title: null,
          meta_description: null,
          canonical_url: "/product-categorie/labelprinters/legacy-accessories",
          alternate_urls: {},
          direct_count: 5,
          count: 5,
          upstream_count: 5,
          is_linked_translation: false,
        },
        {
          term_id: 4,
          external_id: 103,
          identity_id: 13,
          parent_term_id: 1,
          locale: "nl",
          name: "Empty translated category",
          slug: "empty-translated",
          path: "labelprinters/empty-translated",
          description: null,
          meta_title: null,
          meta_description: null,
          canonical_url: "/product-categorie/labelprinters/empty-translated",
          alternate_urls: {
            en: "/en/product-category/labelprinters/empty-translated",
          },
          direct_count: 0,
          count: 0,
          upstream_count: 0,
          is_linked_translation: true,
        },
      ],
    });

    expect(visibleChildren.map((child) => child.term_id)).toEqual([2]);
  });
});
