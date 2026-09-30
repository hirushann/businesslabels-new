import { afterEach, describe, expect, it, vi } from "vitest";
import { getHomeData } from "@/lib/api/home";

describe("getHomeData", () => {
  const originalBaseUrl = process.env.BBNL_API_BASE_URL;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalBaseUrl !== undefined) {
      process.env.BBNL_API_BASE_URL = originalBaseUrl;
    } else {
      delete process.env.BBNL_API_BASE_URL;
    }
  });

  it("fetches home data successfully and returns data object", async () => {
    process.env.BBNL_API_BASE_URL = "https://api.example.test";
    const mockData = {
      hero_banner: "https://api.example.test/storage/home/hero.webp",
      why_choose_business_label: {
        why_choose_business_label_image: null,
        left_logo: null,
        right_logo: null,
      },
      quick_links: {
        find_the_right_printer_image: null,
        find_labels_materials_image: null,
        quick_reorder_image: null,
      },
      footer_banner: null,
    };

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: mockData }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getHomeData();

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/api/home", {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
      },
    });
    expect(result).toEqual(mockData);
  });

  it("attaches Basic Auth header when DOMAIN_LOCK is enabled", async () => {
    process.env.BBNL_API_BASE_URL = "https://api.example.test";
    process.env.DOMAIN_LOCK = "true";
    process.env.DOMAIN_LOCK_USER = "bbnl";
    process.env.DOMAIN_LOCK_PASSWORD = "secret";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { hero_banner: "banner.webp" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await getHomeData();

    const expectedAuth = `Basic ${Buffer.from("bbnl:secret").toString("base64")}`;
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/api/home", {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
        Authorization: expectedAuth,
      },
    });

    delete process.env.DOMAIN_LOCK;
    delete process.env.DOMAIN_LOCK_USER;
    delete process.env.DOMAIN_LOCK_PASSWORD;
  });

  it("falls back to default http://127.0.0.1:8000 if BBNL_API_BASE_URL is not set", async () => {
    delete process.env.BBNL_API_BASE_URL;
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { hero_banner: "banner.webp" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getHomeData();

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:8000/api/home", {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
      },
    });
    expect(result?.hero_banner).toBe("banner.webp");
  });

  it("returns null when API responds with error status", async () => {
    process.env.BBNL_API_BASE_URL = "https://api.example.test";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("Internal Server Error", { status: 500 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getHomeData();
    expect(result).toBeNull();
  });

  it("returns null when network throws an error", async () => {
    process.env.BBNL_API_BASE_URL = "https://api.example.test";
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network failed"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getHomeData();
    expect(result).toBeNull();
  });
});
