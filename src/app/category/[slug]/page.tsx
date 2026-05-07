import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import ProductsListing, { type ListingProductCardData } from "@/components/ProductsListing";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { demoProducts, mapDemoProductToCard } from "@/lib/demoCatalog";
import { getServerLocale, withLocaleParam } from "@/lib/i18n/server";
import InfiniteCategoryListing from "@/components/InfiniteCategoryListing";

export const metadata: Metadata = {
  title: "Labelprinters — BusinessLabels",
  description:
    "Browse our full range of color label printers including desktop, midrange and industrial models. Epson ColorWorks Gold Partner.",
};

type CategoryTreeItem = {
  id?: number;
  name?: string | null;
  slug?: string | null;
  parent_id?: number | null;
  count?: number | null;
  children?: CategoryTreeItem[];
};

type CategoryGroup = {
  id?: number;
  name?: string | null;
  slug?: string | null;
  count?: number | null;
  categories?: CategoryTreeItem[];
};

type CategoriesResponse = {
  data?: CategoryGroup[];
};

type ProductDetail = {
  id?: number;
  type?: string;
  title?: string | null;
  name?: string | null;
  subtitle?: string | null;
  excerpt?: string | null;
  slug?: string | null;
  sku?: string | null;
  price?: number | null;
  original_price?: number | null;
  in_stock?: boolean | null;
  main_image?: string | null;
  categories?: Array<{ id?: number; name?: string | null }>;
  material?: {
    title?: string | null;
  } | null;
  material_information?: string | null;
};

type DemoTopProductCard = ProductCardData;
type CategoryLinkCard = {
  id: number;
  name: string;
  slug: string;
  image: string;
};
type CategoryProductsResponse = {
  data?: ProductDetail[];
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
  };
};

const DEMO_TOP_PRODUCT_IDS = [1, 2, 3] as const;
const CATEGORY_TITLES: Record<string, string> = {
  labelprinters: "Label Printers",
  specials: "Special Labels",
  "product-category": "Product Category",
};

function normalizeType(raw: string | undefined): "simple" | "variable" | null {
  if (raw === "simple" || raw === "variable") {
    return raw;
  }
  return null;
}

function normalizeValue(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value).trim() || null;
}

function normalizeCategoryTreeItem(item: CategoryTreeItem | null | undefined): CategoryLinkCard | null {
  const id = item?.id;
  const name = normalizeValue(item?.name);
  const slug = normalizeValue(item?.slug);

  if (typeof id !== "number" || !name || !slug) {
    return null;
  }

  return {
    id,
    name,
    slug,
    image: "/images/archive-banner.jpg",
  };
}

function dedupeCategoryCards(items: CategoryLinkCard[]): CategoryLinkCard[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.slug.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function loadProductCategories(baseUrl: string | undefined, locale: "en" | "nl"): Promise<CategoryLinkCard[]> {
  if (!baseUrl) {
    return [];
  }

  try {
    const response = await fetch(withLocaleParam(`${baseUrl}/api/categories`, locale), { cache: "no-store" });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as CategoriesResponse;
    const productCategoryGroup = (json.data ?? []).find((group) => {
      const slug = normalizeValue(group.slug)?.toLowerCase();
      const name = normalizeValue(group.name)?.toLowerCase();

      return slug === "product-category" || name === "product category";
    });

    if (!productCategoryGroup?.categories?.length) {
      return [];
    }

    return dedupeCategoryCards(
      productCategoryGroup.categories
        .map((item) => normalizeCategoryTreeItem(item))
        .filter((item): item is CategoryLinkCard => item !== null)
        .filter((item) => item.slug.toLowerCase() !== "uncategorized"),
    );
  } catch (error) {
    console.error("Failed to fetch product categories", error);
    return [];
  }
}

async function fetchProductById(baseUrl: string, id: number, locale: "en" | "nl"): Promise<ProductDetail | null> {
  for (const type of ["simple", "variable"] as const) {
    try {
      const response = await fetch(withLocaleParam(`${baseUrl}/api/products/${type}/${id}`, locale), { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const json = (await response.json()) as { data?: ProductDetail };
      if (json.data) {
        return json.data;
      }
    } catch (error) {
      console.error(`Failed to fetch top product by id '${id}'`, error);
    }
  }

  return null;
}

function mapProductToTopCard(id: number, product: ProductDetail | null): DemoTopProductCard {
  return {
    id,
    sku: normalizeValue(product?.sku) || "-",
    name: normalizeValue(product?.title) || normalizeValue(product?.name) || "-",
    subtitle: normalizeValue(product?.subtitle),
    excerpt: normalizeValue(product?.excerpt),
    materialTitle: normalizeValue(product?.material?.title),
    price: product?.price ?? null,
    originalPrice: product?.original_price ?? null,
    inStock: Boolean(product?.in_stock),
    mainImage: normalizeValue(product?.main_image) || "https://placehold.co/242x183",
    categories: product?.categories ?? [],
    slug: normalizeValue(product?.slug),
    type: normalizeType(product?.type ?? undefined),
  };
}

async function loadTopProducts(baseUrl: string | undefined, locale: "en" | "nl"): Promise<DemoTopProductCard[]> {
  return Promise.all(
    DEMO_TOP_PRODUCT_IDS.map(async (id) => {
      const product = baseUrl ? await fetchProductById(baseUrl, id, locale) : null;
      return mapProductToTopCard(id, product);
    }),
  );
}

function mapProductToCard(product: ProductDetail, fallbackId: number): ProductCardData {
  return {
    id: product.id ?? fallbackId,
    sku: normalizeValue(product.sku) || "-",
    name: normalizeValue(product.title) || normalizeValue(product.name) || "-",
    subtitle: normalizeValue(product.subtitle),
    excerpt: normalizeValue(product.excerpt),
    materialTitle: normalizeValue(product.material?.title),
    price: product.price ?? null,
    originalPrice: product.original_price ?? null,
    inStock: Boolean(product.in_stock),
    mainImage: normalizeValue(product.main_image) || "https://placehold.co/600x400",
    categories: product.categories ?? [],
    slug: normalizeValue(product.slug),
    type: normalizeType(product.type ?? undefined),
  };
}

async function loadCategoryProducts(baseUrl: string | undefined, slug: string, locale: "en" | "nl"): Promise<ProductCardData[]> {
  if (!baseUrl || !slug) {
    return [];
  }

  try {
    const response = await fetch(
      withLocaleParam(`${baseUrl}/api/categories/${slug}?page=1`, locale),
      { cache: "no-store" },
    );

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as CategoryProductsResponse;
    return (json.data ?? []).map((product, index) => mapProductToCard(product, index));
  } catch (error) {
    console.error(`Failed to fetch category products for slug '${slug}'`, error);
    return [];
  }
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function categoryTitleForSlug(slug: string): string {
  return CATEGORY_TITLES[slug] ?? slugToTitle(slug);
}

function productHref(product: DemoTopProductCard): { pathname: string; query?: { type: "simple" | "variable" } } | null {
  if (!product.slug) {
    return null;
  }

  if (product.type) {
    return {
      pathname: `/products/${product.slug}`,
      query: { type: product.type },
    };
  }

  return { pathname: `/products/${product.slug}` };
}

function categoryHref(slug: string, categoriesPage?: number) {
  const search = categoriesPage && categoriesPage > 1 ? `?categories_page=${categoriesPage}` : "";
  return `/category/${slug}${search}`;
}

const reviews = [
  {
    text: "\u201cLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\u2019s standard dummy text ever since the 1500s, when an unknown printer took\u201d",
    name: "David Tui",
    role: "Marketing Manager, HubSync",
    featured: false,
  },
  {
    text: "\u201cLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\u2019s standard dummy text ever since the 1500s, when an unknown printer took\u201d",
    name: "Sarah Mitchell",
    role: "Software Engineer, Anydesk",
    featured: true,
  },
  {
    text: "\u201cLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\u2019s standard dummy text ever since the 1500s, when an unknown printer took\u201d",
    name: "Priya Sharma",
    role: "Product Designer, Designdot",
    featured: false,
  },
];

export default async function CategoryArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[]; categories_page?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const baseUrl = process.env.BBNL_API_BASE_URL;
  const categoryTitle = categoryTitleForSlug(slug);
  const requestedPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const requestedCategoriesPage = Array.isArray(query.categories_page)
    ? query.categories_page[0]
    : query.categories_page;
  const normalizedPage = Number.parseInt(requestedPage ?? "1", 10);
  const currentPage = Number.isFinite(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1;
  const normalizedCategoriesPage = Number.parseInt(requestedCategoriesPage ?? "1", 10);
  const currentCategoriesPage = Number.isFinite(normalizedCategoriesPage) && normalizedCategoriesPage > 0
    ? normalizedCategoriesPage
    : 1;
  const isDemoCategory = slug === "demo";
  const locale = await getServerLocale();
  const demoCategoryProducts = demoProducts.map(mapDemoProductToCard);
  const demoLastPage = Math.max(1, Math.ceil(demoCategoryProducts.length / 12));
  const safeDemoPage = Math.min(currentPage, demoLastPage);
  const paginatedDemoProducts = demoCategoryProducts.slice((safeDemoPage - 1) * 12, safeDemoPage * 12);
  const productCategories = await loadProductCategories(baseUrl, locale);
  const categoryCardsPerPage = 12;
  const productCategoriesLastPage = Math.max(1, Math.ceil(productCategories.length / categoryCardsPerPage));
  const safeCategoriesPage = Math.min(currentCategoriesPage, productCategoriesLastPage);
  const paginatedProductCategories = productCategories.slice(
    (safeCategoriesPage - 1) * categoryCardsPerPage,
    safeCategoriesPage * categoryCardsPerPage,
  );
  const categoryProducts = isDemoCategory ? [] : await loadCategoryProducts(baseUrl, slug, locale);
  const topProducts = await loadTopProducts(baseUrl, locale);

  async function fetchMoreProducts(targetSlug: string, page: number): Promise<ProductCardData[]> {
    "use server";
    const url = process.env.BBNL_API_BASE_URL;
    if (!url) return [];
    const actionLocale = await getServerLocale();
    try {
      const response = await fetch(
        withLocaleParam(`${url}/api/products?page=${page}`, actionLocale),
        { cache: "no-store" }
      );
      if (!response.ok) return [];
      const json = await response.json();
      return (json.data ?? []).map((product: any, index: number) => mapProductToCard(product, index));
    } catch (error) {
      console.error("Failed to fetch more products", error);
      return [];
    }
  }

  return (
    <div className="bg-white">
      {/* ── Hero Banner ─────────────────────────────────── */}
      <div className="px-10 py-10">
        <div className="max-w-360 mx-auto flex flex-col gap-12">

          {/* Banner */}
          <div className="relative w-full h-56 rounded-xl overflow-hidden shadow-md">
            <Image
              src="/images/archive-banner.jpg"
              alt={`${categoryTitle} banner`}
              fill
              sizes="100vw"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute left-6 top-6 flex flex-col gap-12">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12.6667H6.23083V9.30765C6.23083 9.13699 6.28856 8.99388 6.404 8.87832C6.51956 8.76288 6.66267 8.70516 6.83333 8.70516H9.16667C9.33733 8.70516 9.48044 8.76288 9.596 8.87832C9.71144 8.99388 9.76917 9.13699 9.76917 9.30765V12.6667H12V6.76916C12 6.73504 11.9925 6.7041 11.9775 6.67632C11.9626 6.64854 11.9423 6.62393 11.9167 6.60249L8.12183 3.74999C8.08761 3.7201 8.047 3.70515 8 3.70515C7.953 3.70515 7.91239 3.7201 7.87817 3.74999L4.08333 6.60249C4.05767 6.62393 4.03739 6.64854 4.0225 6.67632C4.0075 6.7041 4 6.73504 4 6.76916V12.6667ZM3 12.6667V6.76916C3 6.57838 3.04267 6.39766 3.128 6.22699C3.21344 6.05621 3.33144 5.9156 3.482 5.80515L7.277 2.94615C7.48756 2.78549 7.72822 2.70515 7.999 2.70515C8.26978 2.70515 8.51111 2.78549 8.723 2.94615L12.518 5.80515C12.6686 5.9156 12.7866 6.05621 12.872 6.22699C12.9573 6.39766 13 6.57838 13 6.76916V12.6667C13 12.9393 12.9015 13.1742 12.7045 13.3712C12.5075 13.5682 12.2727 13.6667 12 13.6667H9.37183C9.20106 13.6667 9.05794 13.6089 8.9425 13.4933C8.82694 13.3779 8.76917 13.2348 8.76917 13.064V9.70516H7.23083V13.064C7.23083 13.2348 7.17306 13.3779 7.0575 13.4933C6.94206 13.6089 6.79894 13.6667 6.62817 13.6667H4C3.72733 13.6667 3.4925 13.5682 3.2955 13.3712C3.0985 13.1742 3 12.9393 3 12.6667Z" fill="white" fillOpacity="0.7"/></svg>
                <span className="text-white/70 text-sm font-normal leading-5">/</span>
                <span className="text-white text-sm font-semibold leading-5">Printers</span>
              </div>
              <h1 className="text-white text-4xl font-bold leading-[48px]">{categoryTitle}</h1>
            </div>
          </div>

          {/* ── Product Categories ─────────────────────── */}
          
          {productCategories.length > 0 && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProductCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={categoryHref(category.slug, 1)}
                    className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center"
                  >
                    <div className="relative mb-5 flex h-[180px] w-full items-center justify-center overflow-hidden">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex min-h-[56px] items-center justify-center text-center">
                      <span className="text-neutral-900 text-[18px] font-bold leading-tight transition-colors group-hover:text-amber-600">
                        {category.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {productCategoriesLastPage > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href={categoryHref(slug, safeCategoriesPage - 1)}
                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors ${
                      safeCategoriesPage <= 1
                        ? "pointer-events-none border-gray-200 text-gray-300"
                        : "border-gray-300 text-neutral-800 hover:border-amber-500 hover:text-amber-600"
                    }`}
                  >
                    Previous
                  </Link>

                  {Array.from({ length: productCategoriesLastPage }, (_, index) => index + 1).map((pageNumber) => (
                    <Link
                      key={pageNumber}
                      href={categoryHref(slug, pageNumber)}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                        pageNumber === safeCategoriesPage
                          ? "border-amber-500 bg-amber-500 text-white"
                          : "border-gray-300 text-neutral-800 hover:border-amber-500 hover:text-amber-600"
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  ))}

                  <Link
                    href={categoryHref(slug, safeCategoriesPage + 1)}
                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors ${
                      safeCategoriesPage >= productCategoriesLastPage
                        ? "pointer-events-none border-gray-200 text-gray-300"
                        : "border-gray-300 text-neutral-800 hover:border-amber-500 hover:text-amber-600"
                    }`}
                  >
                    Next
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Product Grid ───────────────────────────── */}
          <InfiniteCategoryListing 
            categoryTitle={categoryTitle} 
            categorySlug={slug}
            initialProducts={isDemoCategory ? paginatedDemoProducts as ProductCardData[] : categoryProducts}
            fetchMoreProducts={fetchMoreProducts}
          />

        </div>
      </div>

      {/* ── Top Selling Products ─────────────────────────── */}
      {/* <div className="px-40 py-24 bg-gray-50">
        <div className="max-w-300 mx-auto flex flex-col gap-12">
          <div className="flex justify-between items-center">
            <h2 className="text-neutral-800 text-4xl font-bold leading-[48px]">Top Selling Products</h2>
            <div className="flex items-center gap-6">
              <button className="w-12 h-12 p-3 bg-gray-50 rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-gray-200 flex justify-center items-center hover:bg-white transition-colors">
                <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-12 h-12 p-3 bg-white rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-amber-500 flex justify-center items-center hover:bg-amber-50 transition-colors">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {topProducts.map((product) => {
              const href = productHref(product);
              return <ProductCard key={product.id} product={product} href={href ?? undefined} />;
            })}
          </div>
        </div>
      </div> */}

      {/* ── Reviews ─────────────────────────────────────── */}
      <div className="relative px-10 py-24 bg-white overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />
        <div className="absolute left-0 bottom-0 -translate-x-1/2 translate-y-1/2 w-48 h-48 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />

        <div className="max-w-360 mx-auto flex flex-col gap-12">
          {/* Header */}
          <div className="flex justify-between items-start">
            <h2 className="text-neutral-800 text-4xl font-bold leading-[48px]">Over 1000 Positive Reviews</h2>
            <div className="flex items-center gap-6">
              <button className="w-12 h-12 p-3 bg-white rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-gray-200 flex justify-center items-center hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-12 h-12 p-3 bg-white rounded-[100px] shadow-[4px_4px_20px_0px_rgba(157,163,160,0.20)] outline outline-1 outline-offset-[-1px] outline-amber-500 flex justify-center items-center hover:bg-amber-50 transition-colors">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Review cards */}
          <div className="grid grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.name}
                className={`p-6 rounded-xl flex flex-col gap-8 ${
                  review.featured
                    ? "bg-gradient-to-br from-orange-50 to-white outline outline-2 outline-offset-[-2px] outline-orange-100"
                    : "bg-white outline outline-1 outline-offset-[-1px] outline-zinc-100"
                }`}
              >
                <p className="text-neutral-700 text-lg font-normal leading-7">{review.text}</p>
                <div className="flex items-center gap-4">
                  <div className="w-1 self-stretch bg-amber-500 rounded-[32px]" />
                  <div className="flex flex-col gap-2">
                    <span className="text-neutral-800 text-xl font-bold leading-6">{review.name}</span>
                    <span className="text-zinc-500 text-base font-normal leading-6">{review.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
