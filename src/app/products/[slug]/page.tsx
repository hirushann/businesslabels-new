import type { Metadata } from "next";
import ProductPurchase from "@/components/ProductPurchase";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import ProductImageGallery from "@/components/ProductImageGallery";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Epson CW-C6000Ae MK — BusinessLabels",
  description:
    "Premium color label printer for product labeling, shipping labels and general purpose use. Compatible with Epson ColorWorks inkjet label printers.",
};

type ProductDetail = {
  id?: number;
  type?: string;
  title?: string | null;
  name?: string | null;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  slug?: string | null;
  sku?: string | null;
  article_number?: string | null;
  price?: number | null;
  original_price?: number | null;
  stock?: number | null;
  in_stock?: boolean | null;
  main_image?: string | null;
  gallery_images?: Array<{ id?: number; url?: string | null; name?: string | null }>;
  product_information?: Record<string, unknown> | string | null;
  material?: {
    id?: number;
    title?: string | null;
    slug?: string | null;
    subtitle?: string | null;
    category?: { id?: number; name?: string | null; slug?: string | null } | null;
  } | null;
  meta?: Record<string, string | number | boolean | null> | null;
  material_information?: string | null;
  make?: string | null;
  packaging_unit?: number | null;
  jeritech_stock?: number | null;
  delivery_dates_in_stock?: number | null;
  delivery_dates_no_stock?: number | null;
  packing_group?: number | null;
  dimensions?: {
    weight?: string | number | null;
    width?: string | number | null;
    height?: string | number | null;
    length?: string | number | null;
  } | null;
  categories?: Array<{ id?: number; name?: string | null }>;
};

const fallbackProductName = "Epson CW-C6000Ae MK";
const fallbackDescription =
  "Premium matte paper labels perfect for product labeling, shipping labels, and general purpose use. Compatible with Epson ColorWorks inkjet label printers.";

function normalizeType(raw: string | string[] | undefined): "simple" | "variable" | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "simple" || value === "variable") {
    return value;
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
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  return String(value).trim() || null;
}

function normalizeDisplayValue(value: unknown): string | null {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return null;
  }

  return toTitleCaseFromSlug(normalized);
}

function specsFromProduct(product: ProductDetail | null): Array<{ label: string; value: string }> {
  const missing = "-";
  const meta = product?.meta ?? {};
  const categoryNames = (product?.categories ?? [])
    .map((category) => normalizeDisplayValue(category.name))
    .filter((name): name is string => Boolean(name))
    .join(", ");
  const specRows: Array<{ label: string; value: string }> = [
    { label: "SKU", value: normalizeDisplayValue(product?.sku) || missing },
    { label: "Category", value: categoryNames || missing },
  ];

  const metaRows = Object.entries(meta)
    .map(([key, value]) => {
      const normalizedValue = normalizeDisplayValue(value);
      if (!normalizedValue) {
        return null;
      }

      return {
        label: toTitleCaseFromSlug(key),
        value: normalizedValue,
      };
    })
    .filter((entry): entry is { label: string; value: string } => Boolean(entry));

  return [...specRows, ...metaRows];
}

async function fetchProductByType(baseUrl: string, type: "simple" | "variable", slug: string): Promise<ProductDetail | null> {
  try {
    const response = await fetch(`${baseUrl}/api/products/${type}/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { data?: ProductDetail };
    return json.data ?? null;
  } catch (error) {
    console.error(`Failed to fetch product details for type '${type}' and slug '${slug}'`, error);
    return null;
  }
}

type DemoSectionCard = ProductCardData;

const DEMO_SECTION_IDS = {
  inkMaintenance: [1, 2, 3],
  badgesMedia: [4, 5, 6],
  hardwares: [7, 8, 9],
} as const;

function toTitleCaseFromSlug(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildMetaSpecs(meta: ProductDetail["meta"]): string[] {
  if (!meta) {
    return [];
  }

  return Object.entries(meta)
    .map(([key, value]) => {
      const normalized = normalizeValue(value);
      if (!normalized) {
        return null;
      }
      return `${toTitleCaseFromSlug(key)}: ${normalized}`;
    })
    .filter((value): value is string => Boolean(value));
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
      console.error(`Failed to fetch demo section product by id '${id}'`, error);
    }
  }

  return null;
}

function mapProductToDemoCard(id: number, product: ProductDetail | null, placeholderImage: string): DemoSectionCard {
  const metaSpecs = buildMetaSpecs(product?.meta ?? null);
  const subtitle =
    normalizeValue(product?.subtitle) ||
    normalizeValue(product?.material_information) ||
    metaSpecs[0] ||
    "-";
  const excerpt = normalizeValue(product?.excerpt) || metaSpecs[1] || "-";

  return {
    id,
    name: normalizeValue(product?.title) || normalizeValue(product?.name) || "-",
    sku: normalizeValue(product?.sku) || "-",
    subtitle,
    excerpt,
    materialTitle: normalizeValue(product?.material?.title),
    price: product?.price ?? null,
    originalPrice: product?.original_price ?? null,
    inStock: Boolean(product?.in_stock),
    mainImage: normalizeValue(product?.main_image) || placeholderImage,
    categories: product?.categories ?? [],
    slug: normalizeValue(product?.slug),
    type: normalizeType(product?.type ?? undefined),
  };
}

async function loadSectionCards(baseUrl: string | undefined, ids: readonly number[], placeholderImage: string): Promise<DemoSectionCard[]> {
  return Promise.all(
    ids.map(async (id) => {
      const product = baseUrl ? await fetchProductById(baseUrl, id) : null;
      return mapProductToDemoCard(id, product, placeholderImage);
    }),
  );
}

async function loadInkMaintenanceCards(baseUrl: string | undefined): Promise<DemoSectionCard[]> {
  return loadSectionCards(baseUrl, DEMO_SECTION_IDS.inkMaintenance, "https://placehold.co/222x180");
}

async function loadBadgesMediaCards(baseUrl: string | undefined): Promise<DemoSectionCard[]> {
  return loadSectionCards(baseUrl, DEMO_SECTION_IDS.badgesMedia, "https://placehold.co/180x180");
}

async function loadHardwareCards(baseUrl: string | undefined): Promise<DemoSectionCard[]> {
  return loadSectionCards(baseUrl, DEMO_SECTION_IDS.hardwares, "https://placehold.co/227x180");
}

function productHref(product: DemoSectionCard): { pathname: string; query?: { type: "simple" | "variable" } } | null {
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

export default async function SingleProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const baseUrl = process.env.BBNL_API_BASE_URL;

  if (!slug) {
    notFound();
  }

  let product: ProductDetail | null = null;
  const selectedType = normalizeType(query.type);

  if (baseUrl) {
    const tryTypes: Array<"simple" | "variable"> = selectedType
      ? [selectedType]
      : ["simple", "variable"];

    for (const type of tryTypes) {
      const result = await fetchProductByType(baseUrl, type, slug);
      if (result) {
        product = result;
        break;
      }
    }
  } else {
    console.error("BBNL_API_BASE_URL is not configured");
  }

  const productName = product?.title || product?.name || fallbackProductName;
  const productDescription = product?.description || product?.excerpt || fallbackDescription;
  const mainImage = product?.main_image || "https://placehold.co/460x509";
  const galleryImages = (product?.gallery_images ?? [])
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url));
  const specs = specsFromProduct(product);
  const [inkMaintenanceCards, badgesMediaCards, hardwareCards] = await Promise.all([
    loadInkMaintenanceCards(baseUrl),
    loadBadgesMediaCards(baseUrl),
    loadHardwareCards(baseUrl),
  ]);

  return (
    <div className="bg-white">


      {/* Main Product Section */}
      <div className="px-10 py-10">
        {/* Breadcrumb */}
        <div className="pb-8">
          <div className="max-w-[1440px] mx-auto flex items-center gap-2 text-sm text-zinc-500">
            <span>Home</span>
            <span>/</span>
            <span>Products</span>
            <span>/</span>
            <span className="text-neutral-700 font-semibold">{productName}</span>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto flex gap-12 items-start">
          {/* LEFT: Images + Description + Specs */}
          <div className="flex-1 flex flex-col gap-12">
            {/* Title & Description */}
            <div className="flex flex-col gap-4">
              <h1 className="text-neutral-800 text-3xl font-bold leading-10">
                {productName}
              </h1>
              <div className="text-neutral-700 text-lg font-normal leading-7" dangerouslySetInnerHTML={{ __html: productDescription }}>
              </div>
            </div>

            {/* Image Gallery */}
            <ProductImageGallery
              productName={productName}
              mainImage={mainImage}
              galleryImages={galleryImages}
            />

            {/* Product Description Accordion */}
            <div className="flex flex-col gap-6">
              <div className="p-6 bg-gray-50 rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-neutral-700 text-2xl font-bold leading-7">Product Description</h2>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </div>
                <div className="text-neutral-700 text-base font-normal leading-6" dangerouslySetInnerHTML={{ __html: productDescription }}>
                </div>
              </div>

              {/* Product Specifications Accordion */}
              <div className="pt-6 bg-gray-50 rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
                <div className="px-6 flex justify-between items-center mb-4">
                  <h2 className="text-neutral-700 text-2xl font-bold leading-7">Product specifications</h2>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </div>
                <div className="rounded-lg overflow-hidden pb-3">
                  {specs.map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`px-6 py-3 flex justify-between items-center ${i % 2 === 0 ? "bg-white/50" : ""}`}
                    >
                      <span className="text-neutral-700 text-base font-normal leading-6">{spec.label}</span>
                      <span className="text-neutral-700 text-base font-semibold leading-6">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compatibility CTA */}
              <div className="p-6 bg-gradient-to-br from-orange-50 to-white rounded-xl outline outline-2 outline-offset-[-2px] outline-orange-100">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 p-2 bg-white rounded-lg shadow-sm flex-shrink-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                    </svg>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-neutral-700 text-2xl font-bold leading-7">Does this fit my printer?</h3>
                      <p className="text-neutral-700 text-base font-normal leading-6">
                        Use our product finder to check compatibility with your specific printer model.
                      </p>
                    </div>
                    <button className="text-amber-500 text-base font-semibold underline text-left">
                      Check Compatibility
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Purchase Card */}
          <div className="flex flex-col gap-6 w-96 sticky top-24">
            <ProductPurchase
              id={product?.id}
              slug={product?.slug}
              type={normalizeType(product?.type)}
              name={productName}
              sku={product?.sku}
              inStock={product?.in_stock}
              price={product?.price}
              originalPrice={product?.original_price}
              mainImage={product?.main_image}
            />

            {/* Consumable Items */}
            <div className="flex flex-col gap-3">
              <h3 className="text-gray-800 text-2xl font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Consumable Items:
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {["Hardwares", "Ink & Maintenance", "Badges / Media"].map((item) => (
                  <button
                    key={item}
                    className="px-4 py-2.5 bg-blue-400/10 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-blue-400/50 text-blue-400 text-base font-bold text-left hover:bg-blue-400/20 transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ink & Maintenance Section */}
      <div className="px-40 py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
          <div className="flex justify-between items-center">
            <h2 className="text-neutral-800 text-4xl font-bold leading-[48px]">Ink &amp; Maintenance</h2>
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
            {inkMaintenanceCards.map((product) => {
              const href = productHref(product);
              return <ProductCard key={product.id} product={product} href={href ?? undefined} />;
            })}
          </div>
        </div>
      </div>

      {/* Badges / Media Section */}
      <div className="px-40 py-24 bg-white">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
          <div className="flex justify-between items-center">
            <h2 className="text-neutral-800 text-4xl font-bold leading-[48px]">Badges / Media</h2>
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
          <div className="grid grid-cols-3 gap-6">
            {badgesMediaCards.map((product) => {
              const href = productHref(product);
              return <ProductCard key={product.id} product={product} href={href ?? undefined} />;
            })}
          </div>
        </div>
      </div>

      {/* Hardwares Section */}
      <div className="px-40 py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
          <div className="flex justify-between items-center">
            <h2 className="text-neutral-800 text-4xl font-bold leading-[48px]">Hardwares</h2>
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
            {hardwareCards.map((product) => {
              const href = productHref(product);
              return <ProductCard key={product.id} product={product} href={href ?? undefined} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
