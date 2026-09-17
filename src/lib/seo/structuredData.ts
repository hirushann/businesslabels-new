// Structured Data (Schema.org) Builders according to Google Rich Results Guidelines

export function buildOrganizationSchema(siteUrl: string) {
  const cleanUrl = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Businesslabels B.V.",
    url: cleanUrl,
    logo: `${cleanUrl}/logo.png`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+31 318 590 465",
        contactType: "sales",
        email: "verkoop@businesslabels.nl",
        areaServed: ["NL", "BE", "DE"],
        availableLanguage: ["Dutch", "English", "German"],
      },
    ],
  };
}

export function buildWebSiteSchema(siteUrl: string) {
  const cleanUrl = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Businesslabels",
    url: cleanUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${cleanUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type ProductSchemaParams = {
  name: string;
  url: string;
  images: string[];
  description?: string | null;
  sku?: string | null;
  mpn?: string | null;
  brand?: string | null;
  category?: string | null;
  price: number;
  inStock?: boolean | null;
  siteUrl: string;
};

export function buildProductSchema(params: ProductSchemaParams) {
  const price =
    typeof params.price === "number" && !isNaN(params.price) && params.price > 0
      ? params.price
      : 0;

  const currentYear = new Date().getFullYear();
  const priceValidUntil = `${currentYear + 1}-12-31`;

  const absImages = params.images
    .filter(Boolean)
    .map((img) =>
      img.startsWith("http")
        ? img
        : `${params.siteUrl.replace(/\/$/, "")}${img.startsWith("/") ? "" : "/"}${img}`
    );

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: params.name,
    brand: {
      "@type": "Brand",
      name: params.brand || "Businesslabels",
    },
  };

  if (absImages.length > 0) {
    schema.image = absImages;
  }

  if (params.description) {
    schema.description = params.description;
  }

  if (params.category) {
    schema.category = params.category;
  }

  const sku = params.sku?.trim() || params.mpn?.trim();
  if (sku) {
    schema.sku = sku;
  }
  const mpn = params.mpn?.trim() || params.sku?.trim();
  if (mpn) {
    schema.mpn = mpn;
  }

  if (price > 0) {
    schema.offers = {
      "@type": "Offer",
      url: params.url,
      priceCurrency: "EUR",
      price: price.toFixed(2),
      priceValidUntil,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        params.inStock !== false
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Businesslabels B.V.",
      },
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: price.toFixed(2),
        priceCurrency: "EUR",
        valueAddedTaxIncluded: false,
      },
    };
  }

  return schema;
}

export type BreadcrumbItem = {
  name: string;
  url?: string | null;
};

export function buildBreadcrumbSchema(items: BreadcrumbItem[], siteUrl: string) {
  const cleanBase = siteUrl.replace(/\/$/, "");
  const itemListElement = items.map((item, index) => {
    const rawUrl = item.url || "";
    const absUrl = rawUrl.startsWith("http")
      ? rawUrl
      : `${cleanBase}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;

    return {
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: absUrl } : {}),
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}

export type FaqItem = {
  question: string;
  answer: string;
};

export function buildFaqSchema(faqs: FaqItem[]) {
  const cleanAnswer = (html: string) =>
    html
      .replace(/<[^>]*>?/gm, "")
      .replace(/\s+/g, " ")
      .trim();

  const validFaqs = faqs.filter(
    (f) => f.question && f.question.trim() && f.answer && f.answer.trim()
  );

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: cleanAnswer(faq.answer),
      },
    })),
  };
}

export type ArticleSchemaParams = {
  headline: string;
  url: string;
  description?: string | null;
  image?: string | null;
  datePublished: string;
  dateModified?: string | null;
  authorName?: string | null;
  siteUrl: string;
};

export function buildArticleSchema(params: ArticleSchemaParams) {
  const cleanBase = params.siteUrl.replace(/\/$/, "");
  const absImage = params.image
    ? params.image.startsWith("http")
      ? params.image
    : `${cleanBase}${params.image.startsWith("/") ? "" : "/"}${params.image}`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: params.headline,
    url: params.url,
    ...(params.description ? { description: params.description } : {}),
    ...(absImage ? { image: [absImage] } : {}),
    datePublished: params.datePublished,
    dateModified: params.dateModified || params.datePublished,
    author: {
      "@type": params.authorName ? "Person" : "Organization",
      name: params.authorName || "Businesslabels",
    },
    publisher: {
      "@type": "Organization",
      name: "Businesslabels B.V.",
      logo: {
        "@type": "ImageObject",
        url: `${cleanBase}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": params.url,
    },
  };
}
