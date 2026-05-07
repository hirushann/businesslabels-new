import type { Metadata } from "next";
import ProductsListing, { type ListingProductCardData } from "@/components/ProductsListing";
import type { WarrantyRawData } from "@/lib/utils/warranty";

export const metadata: Metadata = {
  title: "All Printers — BusinessLabels",
  description: "Browse our full product range with sorting and pagination.",
};

type Product = {
  id: number;
  type: "simple" | "variable" | string;
  slug?: string | null;
  title?: string | null;
  name: string;
  sku: string;
  subtitle?: string | null;
  excerpt?: string | null;
  article_number?: string | null;
  price: number;
  original_price?: number | null;
  in_stock: boolean;
  main_image?: string | null;
  created_at?: string | null;
  material?: {
    title?: string | null;
  } | null;
  categories?: Array<{
    id?: number;
    name?: string | null;
  }>;
  warranty?: WarrantyRawData | null;
};

type ProductsResponse = {
  data: Product[];
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
  };
};

function normalizeType(raw: string | undefined): "simple" | "variable" | null {
  if (raw === "simple" || raw === "variable") {
    return raw;
  }
  return null;
}

function createdAtTimestamp(value: string | null | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : fallback;
}

export default async function ProductsPage({
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

  let products: ListingProductCardData[] = [];
  let currentPage = 1;
  let lastPage = 1;

  try {
    const response = await fetch(`${baseUrl}/api/products?page=${page}`, {
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
        warranty: product.warranty ?? null,
        createdAt: createdAtTimestamp(product.created_at, json.data.length - index),
      }));
      console.log("Fetched products test:", products);
    } else {
      console.error(`Failed to fetch products: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching products:", error);
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
            <ProductsListing products={products} currentPage={currentPage} lastPage={lastPage} />
          </div>
        </div>
      </div>
    </section>
  );
}
