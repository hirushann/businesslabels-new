import { afterEach, describe, expect, it, vi } from "vitest";

import { toDisplayImageUrl } from "./imageProxy";

describe("toDisplayImageUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses configured public media URLs directly", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_PUBLIC_URL", "https://media.example.com");
    const image = "https://media.example.com/94/product.jpg";

    expect(toDisplayImageUrl(image)).toBe(image);
    expect(toDisplayImageUrl(`/api/media-proxy?url=${encodeURIComponent(image)}`)).toBe(image);
  });

  it("keeps proxying legacy remote URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_PUBLIC_URL", "https://media.example.com");

    expect(toDisplayImageUrl("https://legacy.example.com/image.jpg"))
      .toBe("/api/media-proxy?url=https%3A%2F%2Flegacy.example.com%2Fimage.jpg");
  });
});
