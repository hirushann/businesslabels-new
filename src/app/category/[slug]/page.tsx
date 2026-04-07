import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Labelprinters — BusinessLabels",
  description:
    "Browse our full range of color label printers including desktop, midrange and industrial models. Epson ColorWorks Gold Partner.",
};

const categories = [
  {
    name: "Color Desktop labelprinters",
    image: "https://placehold.co/176x160",
    href: "#",
  },
  {
    name: "Color Midrange labelprinters",
    image: "https://placehold.co/145x160",
    href: "#",
  },
  {
    name: "Color Industrial labelprinters",
    image: "https://placehold.co/212x160",
    href: "#",
  },
  {
    name: "Color Starterkits",
    image: "https://placehold.co/160x160",
    href: "#",
  },
  {
    name: "Shippinglabel printers",
    image: "https://placehold.co/160x160",
    href: "#",
  },
  {
    name: "All starterkits",
    image: "https://placehold.co/160x160",
    href: "#",
  },
  {
    name: "Expobadge starterkits",
    image: "https://placehold.co/160x160",
    href: "#",
  },
  {
    name: "Shippinglabels starterkits",
    image: "https://placehold.co/160x160",
    href: "#",
  },
  {
    name: "Beer labeling starterkits",
    image: "https://placehold.co/160x160",
    href: "#",
  },
  {
    name: "Ink cartridges",
    image: "https://placehold.co/198x160",
    href: "#",
  },
  {
    name: "Maintenance boxes",
    image: "https://placehold.co/199x160",
    href: "#",
  },
  {
    name: "TT print ribbons",
    image: "https://placehold.co/160x160",
    href: "#",
  },
];

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
  in_stock?: boolean | null;
  main_image?: string | null;
  material_information?: string | null;
};

type DemoTopProductCard = {
  id: number;
  type: string;
  inStock: boolean;
  badge?: string | null;
  sku: string;
  name: string;
  spec1: string;
  spec2: string;
  price: string;
  pricePrefix: string | null;
  cta: string;
  image: string;
  slug: string | null;
  productType: "simple" | "variable" | null;
};

const DEMO_TOP_PRODUCT_IDS = [1, 2, 3] as const;

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

function toTitleCaseFromSlug(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatEuroPrice(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

async function fetchProductById(baseUrl: string, id: number): Promise<ProductDetail | null> {
  for (const type of ["simple", "variable"] as const) {
    try {
      const response = await fetch(`${baseUrl}/api/products/${type}/${id}`, { cache: "no-store" });
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
  const type = normalizeType(product?.type ?? undefined);
  const firstSpec =
    normalizeValue(product?.material_information) ||
    normalizeValue(product?.subtitle) ||
    normalizeValue(product?.excerpt) ||
    "-";
  const secondSpec = normalizeValue(product?.excerpt) || normalizeValue(product?.subtitle) || "-";

  return {
    id,
    type: normalizeValue(product?.type) ? toTitleCaseFromSlug(String(product?.type)) : "Inkjet",
    inStock: Boolean(product?.in_stock),
    badge: null,
    sku: normalizeValue(product?.sku) || "-",
    name: normalizeValue(product?.title) || normalizeValue(product?.name) || "-",
    spec1: firstSpec,
    spec2: secondSpec,
    price: formatEuroPrice(product?.price),
    pricePrefix: type === "variable" ? "From" : null,
    cta: "Add",
    image: normalizeValue(product?.main_image) || "https://placehold.co/242x183",
    slug: normalizeValue(product?.slug),
    productType: type,
  };
}

async function loadTopProducts(baseUrl: string | undefined): Promise<DemoTopProductCard[]> {
  return Promise.all(
    DEMO_TOP_PRODUCT_IDS.map(async (id) => {
      const product = baseUrl ? await fetchProductById(baseUrl, id) : null;
      return mapProductToTopCard(id, product);
    }),
  );
}

function productHref(product: DemoTopProductCard): { pathname: string; query?: { type: "simple" | "variable" } } | null {
  if (!product.slug) {
    return null;
  }

  if (product.productType) {
    return {
      pathname: `/products/${product.slug}`,
      query: { type: product.productType },
    };
  }

  return { pathname: `/products/${product.slug}` };
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

export default async function CategoryArchivePage() {
  const baseUrl = process.env.BBNL_API_BASE_URL;
  const topProducts = await loadTopProducts(baseUrl);

  return (
    <div className="bg-white">
      {/* ── Hero Banner ─────────────────────────────────── */}
      <div className="px-10 py-10">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-12">

          {/* Banner */}
          <div className="relative w-full h-56 rounded-xl overflow-hidden shadow-md">
            <Image
              src="/images/archive-banner.jpg"
              alt="Labelprinters banner"
              fill
              sizes="100vw"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute left-6 top-6 flex flex-col gap-12">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12.6667H6.23083V9.30765C6.23083 9.13699 6.28856 8.99388 6.404 8.87832C6.51956 8.76288 6.66267 8.70516 6.83333 8.70516H9.16667C9.33733 8.70516 9.48044 8.76288 9.596 8.87832C9.71144 8.99388 9.76917 9.13699 9.76917 9.30765V12.6667H12V6.76916C12 6.73504 11.9925 6.7041 11.9775 6.67632C11.9626 6.64854 11.9423 6.62393 11.9167 6.60249L8.12183 3.74999C8.08761 3.7201 8.047 3.70515 8 3.70515C7.953 3.70515 7.91239 3.7201 7.87817 3.74999L4.08333 6.60249C4.05767 6.62393 4.03739 6.64854 4.0225 6.67632C4.0075 6.7041 4 6.73504 4 6.76916V12.6667ZM3 12.6667V6.76916C3 6.57838 3.04267 6.39766 3.128 6.22699C3.21344 6.05621 3.33144 5.9156 3.482 5.80515L7.277 2.94615C7.48756 2.78549 7.72822 2.70515 7.999 2.70515C8.26978 2.70515 8.51111 2.78549 8.723 2.94615L12.518 5.80515C12.6686 5.9156 12.7866 6.05621 12.872 6.22699C12.9573 6.39766 13 6.57838 13 6.76916V12.6667C13 12.9393 12.9015 13.1742 12.7045 13.3712C12.5075 13.5682 12.2727 13.6667 12 13.6667H9.37183C9.20106 13.6667 9.05794 13.6089 8.9425 13.4933C8.82694 13.3779 8.76917 13.2348 8.76917 13.064V9.70516H7.23083V13.064C7.23083 13.2348 7.17306 13.3779 7.0575 13.4933C6.94206 13.6089 6.79894 13.6667 6.62817 13.6667H4C3.72733 13.6667 3.4925 13.5682 3.2955 13.3712C3.0985 13.1742 3 12.9393 3 12.6667Z" fill="white" fill-opacity="0.7"/>
                  </svg>
                <span className="text-white/70 text-sm font-normal leading-5">/</span>
                <span className="text-white text-sm font-semibold leading-5">Printers</span>
              </div>
              <h1 className="text-white text-4xl font-bold leading-[48px]">Labelprinters</h1>
            </div>
          </div>

          {/* ── Category Grid ───────────────────────────── */}
          <div className="flex flex-col gap-6">
            {/* Row 1 – 4 cards */}
            <div className="grid grid-cols-4 gap-6">
              {categories.slice(0, 4).map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="px-10 py-6 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col items-center gap-6 hover:shadow-[2px_4px_28px_0px_rgba(109,109,120,0.18)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Image src={cat.image} alt={cat.name} width={212} height={160} unoptimized className="h-40 w-auto object-contain" />
                  <span className="text-center text-neutral-800 text-xl font-bold leading-6">{cat.name}</span>
                </Link>
              ))}
            </div>
            {/* Row 2 – 4 cards */}
            <div className="grid grid-cols-4 gap-6">
              {categories.slice(4, 8).map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="px-10 py-6 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col items-center gap-6 hover:shadow-[2px_4px_28px_0px_rgba(109,109,120,0.18)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Image src={cat.image} alt={cat.name} width={212} height={160} unoptimized className="h-40 w-auto object-contain" />
                  <span className="text-center text-neutral-800 text-xl font-bold leading-6">{cat.name}</span>
                </Link>
              ))}
            </div>
            {/* Row 3 – 4 cards */}
            <div className="grid grid-cols-4 gap-6">
              {categories.slice(8, 12).map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="px-10 py-6 bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col items-center gap-6 hover:shadow-[2px_4px_28px_0px_rgba(109,109,120,0.18)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Image src={cat.image} alt={cat.name} width={212} height={160} unoptimized className="h-40 w-auto object-contain" />
                  <span className="text-center text-neutral-800 text-xl font-bold leading-6">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Selling Products ─────────────────────────── */}
      <div className="px-10 py-24 bg-gray-50">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-12">
          <div className="flex justify-between items-center">
            <h2 className="text-neutral-800 text-4xl font-bold leading-[48px]">Top Selling Products</h2>
            <button className="h-12 px-6 py-4 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-amber-500 flex items-center gap-2.5 hover:bg-amber-50 transition-colors">
              <span className="text-amber-500 text-base font-semibold leading-6">View All Products</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {topProducts.map((product) => {
              const cardContent = (
              <div
                className="bg-white rounded-xl shadow-[2px_4px_20px_0px_rgba(109,109,120,0.10)] outline outline-1 outline-offset-[-1px] outline-orange-50 flex flex-col"
              >
                {/* Image area */}
                <div className="h-56 relative bg-slate-100 overflow-hidden rounded-t-xl">
                  <div className="absolute left-4 top-4 flex justify-between items-center w-[calc(100%-32px)]">
                    {/* Type badge */}
                    <div className="h-6 px-2.5 py-1 bg-white rounded-3xl flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                        <rect x="1" y="4" width="10" height="7" rx="1" />
                        <path d="M4 4V3a2 2 0 014 0v1" />
                      </svg>
                      <span className="text-neutral-700 text-xs font-normal leading-4">{product.type}</span>
                    </div>
                    {/* Stock badge */}
                    {product.inStock ? (
                      <div className="px-2.5 py-1 bg-green-600 rounded-full flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                          <circle cx="6" cy="6" r="5" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l1.5 1.5L8 4" />
                        </svg>
                        <span className="text-white text-xs font-normal leading-4">In Stock</span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 bg-gray-100 rounded-full">
                        <span className="text-zinc-500 text-xs font-normal leading-4">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  {/* Per-box badge for label rolls */}
                  {product.badge && (
                    <div className="absolute right-4 bottom-4 h-6 px-2.5 py-1 bg-white rounded-md">
                      <span className="text-neutral-700 text-xs font-normal leading-4">{product.badge}</span>
                    </div>
                  )}
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={242}
                    height={183}
                    unoptimized
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-44 object-contain"
                  />
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-blue-400 text-sm font-normal leading-5">SKU: {product.sku}</span>
                      <span className="text-neutral-800 text-xl font-semibold leading-6">{product.name}</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {[product.spec1, product.spec2].map((spec, index) => (
                        <div key={`${spec}-${index}`} className="flex items-center gap-2">
                          <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
                            <circle cx="6" cy="6" r="5" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l1.5 1.5L8 4" />
                          </svg>
                          <span className="text-neutral-700 text-base font-normal leading-5">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-auto">
                    <div className="h-px bg-orange-50" />
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-end gap-1.5">
                          {product.pricePrefix && (
                            <span className="text-neutral-800 text-xl font-normal leading-6">{product.pricePrefix}</span>
                          )}
                          <span className="text-neutral-800 text-2xl font-bold leading-7">{product.price}</span>
                        </div>
                        <span className="text-zinc-500 text-xs font-normal leading-4">ex. VAT</span>
                      </div>
                      <button className="h-9 px-4 py-2.5 bg-amber-500 rounded-[100px] flex items-center gap-2 hover:bg-amber-600 transition-colors">
                        <span className="text-white text-base font-semibold leading-6">{product.cta}</span>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 20 16">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h3l2 9h10l2-7H5" />
                          <circle cx="8" cy="13" r="1" />
                          <circle cx="16" cy="13" r="1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );

              const href = productHref(product);
              if (!href) {
                return (
                  <div key={product.id}>
                    {cardContent}
                  </div>
                );
              }

              return (
                <Link key={product.id} href={href} className="block">
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Reviews ─────────────────────────────────────── */}
      <div className="relative px-10 py-24 bg-white overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />
        <div className="absolute left-0 bottom-0 -translate-x-1/2 translate-y-1/2 w-48 h-48 bg-amber-500/30 rounded-full blur-[132px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto flex flex-col gap-12">
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
