import type { Metadata } from "next";
import ProductsListing, { type ListingProductCardData } from "@/components/ProductsListing";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import ProductsListing from "@/components/ProductsListing";
import { parseCatalogSearchParams, searchCatalogProducts } from "@/lib/search/products";
import type { CatalogSearchResponse } from "@/lib/search/types";

export const metadata: Metadata = {
  title: "All Products — BusinessLabels",
  description: "Browse our full product range with search, filters, sorting, and pagination.",
};

type ProductsPageSearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(searchParams: ProductsPageSearchParams): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }

    if (value !== undefined) {
      params.set(key, value);
    }
  });

  return params;
}

const emptyCatalogResponse: CatalogSearchResponse = {
  products: [],
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 24,
  filters: { ranges: [], options: [] },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsPageSearchParams>;
}) {
  const query = toUrlSearchParams(await searchParams);
  let initialCatalog = emptyCatalogResponse;

  try {
    initialCatalog = await searchCatalogProducts(parseCatalogSearchParams(query));
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  const query = await searchParams;

  if (!baseUrl) {
    throw new Error("BBNL_API_BASE_URL is not configured");
  }

  const locale = await getServerLocale();
  const requestedPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const normalizedPage = Number.parseInt(requestedPage ?? "1", 10);
  const page = Number.isFinite(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1;

  let products: ListingProductCardData[] = [];
  let currentPage = 1;
  let lastPage = 1;

  try {
    const response = await fetch(withLocaleParam(`${baseUrl}/api/products?page=${page}`, locale), {
      cache: "no-store",
    });

    if (response.ok) {
      const json = (await response.json()) as ProductsResponse;
      currentPage = json.meta?.current_page ?? page;
      lastPage = json.meta?.last_page ?? 1;
      products = json.data.map((product, index) => ({
        id: product.id,
        sku: product.sku,
        name: product.title?.trim() || product.name,
        subtitle: product.subtitle ?? null,
        excerpt: product.excerpt ?? null,
        materialTitle: product.material?.title ?? null,
        price: product.price,
        originalPrice: product.original_price ?? null,
        inStock: product.in_stock,
        mainImage: product.main_image ?? null,
        categories: product.categories ?? [],
        slug: product.slug ?? null,
        type: normalizeType(product.type),
        createdAt: createdAtTimestamp(product.created_at, json.data.length - index),
      }));
    } else {
      console.error(`Failed to fetch products: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to load product catalog.", error);
  }

  return (
    <section className="bg-white px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-360 flex-col gap-10">
        <div className="border-b border-slate-200 pb-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
            <span>Home</span>
            <span>/</span>
            <span>Products</span>
            <span>/</span>
            <span>All Products</span>
          </div>
          <div className="flex flex-col gap-5">
            <h1 className="text-3xl font-bold font-['Segoe_UI'] leading-8 text-neutral-800">
              All Products
            </h1>
            <ProductsListing initialCatalog={initialCatalog} initialQueryString={query.toString()} />
          </div>
        </div>
      </div>
    </section>
  );
}
