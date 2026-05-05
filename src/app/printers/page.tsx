import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { materialReviews } from "@/lib/materialCatalog";

export const metadata: Metadata = {
  title: "Material Overview — BusinessLabels",
  description:
    "Discover printer media materials selected for precision, durability, color accuracy, and reliable professional output.",
};

import ProductCard, { type ProductCardData } from "@/components/ProductCard";

type ApiProduct = {
  id: string | number;
  sku?: string;
  article_number?: string;
  title?: string;
  name?: string;
  subtitle?: string;
  excerpt?: string;
  material?: { title?: string };
  price?: number;
  original_price?: number;
  in_stock?: boolean;
  main_image?: string;
  categories?: Array<{ id?: number; name?: string }>;
  slug?: string;
  type?: "simple" | "variable";
  packing_group?: number;
};

type ProductsApiResponse = {
  data: ApiProduct[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

function mapApiProductToCardData(apiProduct: ApiProduct): ProductCardData {
  return {
    id: apiProduct.id,
    sku: apiProduct.sku || apiProduct.article_number || "",
    name: apiProduct.title ?? apiProduct.name ?? "",
    subtitle: apiProduct.subtitle,
    excerpt: apiProduct.excerpt,
    materialTitle: apiProduct.material?.title,
    price: apiProduct.price,
    originalPrice: apiProduct.original_price,
    inStock: apiProduct.in_stock ?? true,
    mainImage: apiProduct.main_image,
    categories: apiProduct.categories,
    slug: apiProduct.slug,
    type: apiProduct.type,
    packing_group: apiProduct.packing_group,
  };
}

function cardHref(product: ProductCardData) {
  if (!product.slug) return undefined;

  return product.type
    ? { pathname: `/products/${product.slug}`, query: { type: product.type } }
    : { pathname: `/products/${product.slug}` };
}

export default async function PrinterPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  const query = await searchParams;

  if (!baseUrl) {
    throw new Error("BBNL_API_BASE_URL is not configured");
  }

  const requestedPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const normalizedPage = Number.parseInt(requestedPage ?? "1", 10);
  const page = Number.isFinite(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1;

  let products: ProductCardData[] = [];
  let currentPage = 1;
  let lastPage = 1;

  try {
    const response = await fetch(`${baseUrl}/api/printers?page=${page}`, {
      cache: "no-store",
    });

    if (response.ok) {
      const json = (await response.json()) as ProductsApiResponse;
      products = json.data.map(mapApiProductToCardData);
      currentPage = json.meta?.current_page ?? page;
      lastPage = json.meta?.last_page ?? 1;
    } else {
      console.error(`Failed to fetch printers: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching printers:", error);
  }

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-0 top-64 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-500/30 blur-[132px]" />
      <div className="pointer-events-none absolute right-0 top-[900px] h-48 w-48 translate-x-1/2 rounded-full bg-amber-500/30 blur-[132px]" />

      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-360 flex-col gap-12">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 border-b border-gray-100 pb-4">
              <h2 className="text-4xl font-bold leading-[48px] text-neutral-800">Printer Products</h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="inline-flex h-10 w-fit items-center gap-2 rounded-[42px] border border-slate-200 px-5 text-neutral-800"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M3 5H17" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M5.5 10H14.5" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8 15H12" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-xl font-semibold leading-6">Filters</span>
                </button>

                <label className="flex h-10 w-fit items-center gap-3 rounded-[42px] border border-slate-200 px-5 text-neutral-800">
                  <span className="sr-only">Sort printers</span>
                  <select
                    value="name_asc"
                    disabled
                    className="bg-transparent text-base leading-5 outline-none disabled:opacity-100"
                  >
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} href={cardHref(product)} />
              ))}
            </div>

            {lastPage > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {currentPage > 1 && (
                  <Link
                    href={`/printers?page=${currentPage - 1}`}
                    className="rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-medium text-neutral-800"
                  >
                    Previous
                  </Link>
                )}
                {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <Link
                      key={p}
                      href={`/printers?page=${p}`}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-[50px] border border-slate-100 px-3 text-sm font-semibold ${
                        p === currentPage ? "bg-amber-500 text-white" : "text-neutral-700"
                      }`}
                    >
                      {p}
                    </Link>
                  );
                })}
                {lastPage > 5 && <span className="px-2 text-sm font-semibold text-zinc-500">...</span>}
                {currentPage < lastPage && (
                  <Link
                    href={`/printers?page=${currentPage + 1}`}
                    className="rounded-[50px] border border-slate-100 px-6 py-2.5 text-base font-semibold text-neutral-800"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </div>
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
