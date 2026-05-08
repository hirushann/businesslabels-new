import type { Metadata } from "next";
import Image from "next/image";
import { materialReviews } from "@/lib/materialCatalog";
import PrintersListing from "@/components/PrintersListing";
import type { PrinterCardData } from "@/components/PrintersListing";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Printer Products — BusinessLabels",
  description:
    "Discover printer media materials selected for precision, durability, color accuracy, and reliable professional output.",
};

// ---------------------------------------------------------------------------
// SSR seed: fetch first page directly from Elasticsearch so the page renders
// with visible products immediately, before the client-side ES query resolves.
// ---------------------------------------------------------------------------

type EsHit = {
  _source: {
    id?: number;
    type?: string;
    title?: string | string[];
    name?: string | string[];
    subtitle?: string | string[];
    excerpt?: string | string[];
    material_title?: string | string[];
    price?: number;
    original_price?: number;
    in_stock?: boolean;
    main_image?: string;
    slug?: string | string[];
    sku?: string;
  };
};

function scalar(value: string | string[] | undefined | null): string | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeType(raw?: string): "simple" | "variable" | null {
  return raw === "simple" || raw === "variable" ? raw : null;
}

function mapHitToCardData(hit: EsHit): PrinterCardData {
  const src = hit._source;
  return {
    id: src.id ?? 0,
    sku: src.sku ?? "",
    name: scalar(src.title) ?? scalar(src.name) ?? "Unnamed printer",
    subtitle: scalar(src.subtitle),
    excerpt: scalar(src.excerpt),
    materialTitle: scalar(src.material_title),
    price: src.price ?? null,
    originalPrice: src.original_price ?? null,
    inStock: src.in_stock ?? false,
    mainImage: src.main_image
      ? `/api/media-proxy?url=${encodeURIComponent(src.main_image)}`
      : null,
    categories: [],
    slug: scalar(src.slug),
    type: normalizeType(src.type ?? undefined),
  };
}

async function fetchPrintersSeed(): Promise<PrinterCardData[]> {
  try {
    const rawHost = process.env.ELASTICSEARCH_URL?.trim()
      || `${process.env.ELASTIC_SCHEME?.trim() || "http"}://${process.env.ELASTIC_HOST?.trim() || "localhost:9200"}`;
    const host = rawHost.replace(/\/$/, "");
    const prefix = process.env.SCOUT_PREFIX?.trim() ?? "";
    const index = process.env.SEARCH_INDEX?.trim() || `${prefix}catalog_products_simple`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.ELASTIC_API_KEY?.trim()) {
      headers.Authorization = `ApiKey ${process.env.ELASTIC_API_KEY.trim()}`;
    } else if (process.env.ELASTIC_USERNAME?.trim()) {
      const encoded = Buffer.from(
        `${process.env.ELASTIC_USERNAME.trim()}:${process.env.ELASTIC_PASSWORD ?? ""}`,
      ).toString("base64");
      headers.Authorization = `Basic ${encoded}`;
    }

    const response = await fetch(`${host}/${index}/_search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: 0,
        size: 24,
        query: { terms: { category_slugs: ["labelprinters"] } },
        sort: [{ created_at_timestamp: { order: "desc", unmapped_type: "long" } }],
        _source: [
          "id", "type", "title", "name", "subtitle", "excerpt",
          "material_title", "price", "original_price", "in_stock",
          "main_image", "slug", "sku",
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) return [];
    const json = (await response.json()) as { hits?: { hits?: EsHit[] } };
    return (json.hits?.hits ?? []).map(mapHitToCardData);
  } catch {
    return [];
  }
}

export default async function PrinterPage() {
  const printers = await fetchPrintersSeed();

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-0 top-64 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-500/30 blur-[132px]" />
      <div className="pointer-events-none absolute right-0 top-[900px] h-48 w-48 translate-x-1/2 rounded-full bg-amber-500/30 blur-[132px]" />

      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-360 flex-col gap-12">
          <PrintersListing printers={printers} />
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-360 flex-col gap-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">Over 1000 Positive Reviews</h2>
            <div className="flex items-center gap-6">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-neutral-700 shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)]"
                aria-label="Previous review"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500 bg-white text-amber-500 shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)]"
                aria-label="Next review"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {materialReviews.map((review) => (
              <article
                key={review.name}
                className="flex min-h-72 flex-col justify-between gap-8 rounded-xl border border-gray-100 bg-white p-5 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Image
                      src={`https://placehold.co/96x96?text=${encodeURIComponent(review.name.charAt(0))}`}
                      alt=""
                      width={48}
                      height={48}
                      className="rounded-full"
                      unoptimized
                    />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold leading-5 text-neutral-800">{review.name}</h3>
                      <p className="text-sm leading-5 text-zinc-500">{review.time}</p>
                    </div>
                  </div>
                  <p className="text-base leading-6 text-neutral-700">{review.text}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm leading-5 text-zinc-500">Posted on</span>
                  <span className="text-sm font-semibold leading-5 text-neutral-800">Google</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
