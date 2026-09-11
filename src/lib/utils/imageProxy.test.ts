import { describe, expect, it } from "vitest";

import { toDisplayImageUrl } from "./imageProxy";

describe("toDisplayImageUrl", () => {
  it("returns public media URLs directly", () => {
    const image = "https://media.businesslabels.nl/12527/10550157.png";
    expect(toDisplayImageUrl(image)).toBe(image);
  });

  it("unwraps /api/media-proxy URLs to direct target URLs", () => {
    const image = "https://media.businesslabels.nl/12527/10550157.png";
    expect(toDisplayImageUrl(`/api/media-proxy?url=${encodeURIComponent(image)}`)).toBe(image);
  });

  it("returns remote and relative URLs directly without proxying", () => {
    expect(toDisplayImageUrl("https://legacy.example.com/image.jpg")).toBe("https://legacy.example.com/image.jpg");
    expect(toDisplayImageUrl("/placeholder.svg")).toBe("/placeholder.svg");
    expect(toDisplayImageUrl(null)).toBeNull();
    expect(toDisplayImageUrl("   ")).toBeNull();
  });
});
