import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductDescriptionAccordion from "./ProductDescriptionAccordion";

describe("ProductDescriptionAccordion", () => {
  it.each([null, undefined, "", "   ", "No product description available", "<p>No product description available.</p>"])(
    "hides absent descriptions (%s)",
    (description) => {
      expect(renderToStaticMarkup(
        <ProductDescriptionAccordion title="Product Description" description={description} />,
      )).toBe("");
    },
  );

  it("renders populated descriptions", () => {
    const html = renderToStaticMarkup(
      <ProductDescriptionAccordion title="Product Description" description="<p>Real product details.</p>" />,
    );

    expect(html).toContain("Product Description");
    expect(html).toContain("Real product details.");
  });
});
