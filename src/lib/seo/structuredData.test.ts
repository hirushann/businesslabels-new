import { describe, it, expect } from "vitest";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildProductSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildArticleSchema,
} from "./structuredData";

describe("Structured Data (Schema.org) Builders", () => {
  const siteUrl = "https://businesslabels.nl";

  it("builds valid Organization schema", () => {
    const schema = buildOrganizationSchema(siteUrl);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Organization");
    expect(schema.name).toBe("Businesslabels B.V.");
    expect(schema.url).toBe("https://businesslabels.nl");
    expect(schema.logo).toBe("https://businesslabels.nl/logo.png");
    expect(schema.contactPoint).toBeDefined();
    expect(schema.contactPoint[0].telephone).toBe("+31 318 590 465");
  });

  it("builds valid WebSite schema with Sitelinks SearchAction", () => {
    const schema = buildWebSiteSchema(siteUrl);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.name).toBe("Businesslabels");
    expect(schema.potentialAction).toBeDefined();
    expect(schema.potentialAction.target.urlTemplate).toBe(
      "https://businesslabels.nl/search?q={search_term_string}"
    );
  });

  it("builds valid Product schema matching exact page price and B2B tax specification", () => {
    const schema: any = buildProductSchema({
      name: "Epson ColorWorks CW-C4000e",
      url: "https://businesslabels.nl/product/colorworks-cw-c4000-mk",
      images: ["/uploads/cw-c4000.png"],
      description: "Desktop color label printer",
      sku: "C31CK03102MK",
      mpn: "C31CK03102MK",
      brand: "Epson",
      category: "Labelprinters",
      price: 1895.0,
      inStock: true,
      siteUrl,
    });

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Product");
    expect(schema.name).toBe("Epson ColorWorks CW-C4000e");
    expect(schema.brand.name).toBe("Epson");
    expect(schema.sku).toBe("C31CK03102MK");
    expect(schema.mpn).toBe("C31CK03102MK");
    expect(schema.image).toEqual(["https://businesslabels.nl/uploads/cw-c4000.png"]);

    // Offer verification
    expect(schema.offers).toBeDefined();
    // Price must match exact ex-VAT number without any 1.23 multiplication bug
    expect(schema.offers.price).toBe("1895.00");
    expect(schema.offers.priceCurrency).toBe("EUR");
    expect(schema.offers.itemCondition).toBe("https://schema.org/NewCondition");
    expect(schema.offers.availability).toBe("https://schema.org/InStock");
    expect(schema.offers.priceSpecification).toEqual({
      "@type": "UnitPriceSpecification",
      price: "1895.00",
      priceCurrency: "EUR",
      valueAddedTaxIncluded: false,
    });
  });

  it("builds valid BreadcrumbList schema with sequential positions and absolute URLs", () => {
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Labelprinters", url: "/product-categorie/labelprinters" },
      { name: "CW-C4000e", url: "/product/colorworks-cw-c4000-mk" },
    ];
    const schema = buildBreadcrumbSchema(breadcrumbs, siteUrl);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://businesslabels.nl/",
    });
    expect(schema.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Labelprinters",
      item: "https://businesslabels.nl/product-categorie/labelprinters",
    });
  });

  it("builds valid FAQPage schema stripping HTML formatting from answers", () => {
    const faqs = [
      {
        question: "What is the difference between Gloss and Matte ink?",
        answer: "<p>Gloss ink (BK) is best for <strong>glossy labels</strong>, while Matte (MK) is for plain paper.</p>",
      },
    ];
    const schema = buildFaqSchema(faqs);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(1);
    expect(schema.mainEntity[0].name).toBe(
      "What is the difference between Gloss and Matte ink?"
    );
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe(
      "Gloss ink (BK) is best for glossy labels, while Matte (MK) is for plain paper."
    );
  });

  it("builds valid BlogPosting schema", () => {
    const schema = buildArticleSchema({
      headline: "How to choose label roll materials",
      url: "https://businesslabels.nl/blog/how-to-choose-label-roll-materials",
      description: "A comprehensive guide to selecting synthetic vs paper labels.",
      image: "/images/labels.jpg",
      datePublished: "2026-01-15T10:00:00Z",
      dateModified: "2026-02-01T12:00:00Z",
      authorName: "John Doe",
      siteUrl,
    });

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.headline).toBe("How to choose label roll materials");
    expect(schema.image).toEqual(["https://businesslabels.nl/images/labels.jpg"]);
    expect(schema.author.name).toBe("John Doe");
    expect(schema.publisher.name).toBe("Businesslabels B.V.");
  });
});
